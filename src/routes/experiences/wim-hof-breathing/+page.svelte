<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import NoSleep from 'nosleep.js';
  import { buildChapters, clampRounds, type ChapterStatus, type Phase } from '$lib/wimhof/chapters';

  // Für Einsteiger:innen: Diese Daten stammen aus der ursprünglichen HTML-Version.
  // Sie definieren, wann jede Phase innerhalb des Videos beginnt oder endet.
  const timings = [
    { start: 38, loopIn: 80, loopOut: 115, endBreath: 124, endHold: 190, endRecover: 205 },
    { start: 234, loopIn: 270, loopOut: 305, endBreath: 313, endHold: 403, endRecover: 418 },
    { start: 436, loopIn: 480, loopOut: 510, endBreath: 518, endHold: 641, endRecover: 656 },
    { start: 672, loopIn: 710, loopOut: 745, endBreath: 756, endHold: 910, endRecover: 925 },
    { start: 938, loopIn: 980, loopOut: 1015, endBreath: 1023, endHold: 1189, endRecover: 1210 }
  ];

  const speeds = [4.5, 3.5, 2.8, 2.2, 1.8];
  const storageKey = 'wimhof_breathing_v1';

  let videoEl: HTMLVideoElement | null = null;
  let ready = false;
  let playing = false;
  let currentPhase: Phase = 'IDLE';
  let roundIndex = 0;
  let totalRounds = 4;
  let loop = false;
  let loopCount = 0;
  let displayTime = '--';
  let instruction = 'Warte auf Start';
  let phaseLabel = 'BEREIT';
  let chapters: ChapterStatus[] = [];
  let ringProgress = 0;
  let circleColor = '#1f2937';
  let videoSize = 320;
  let loaderText = 'Initialisiere Atemvideo ...';

  // Wachhalte-Logik
  let wakeLockSupported = false;
  let wakeLockActive = false;
  let wakePrompt = false;
  let wakeLockError = '';
  let keepAwakePreference = false;
  let wakeLockSentinel: WakeLockSentinel | null = null;
  let noSleep: NoSleep | null = null;

  let animationId: number | null = null;

  onMount(() => {
    wakeLockSupported = browser && 'wakeLock' in navigator;
    loadSettings();
    updateChapters();
    startRenderLoop();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  });

  const persistSettings = () => {
    if (!browser) return;
    localStorage.setItem(
      storageKey,
      JSON.stringify({ rounds: totalRounds, loop, keepAwake: keepAwakePreference })
    );
  };

  const loadSettings = () => {
    if (!browser) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        totalRounds = clampRounds(parsed.rounds ?? totalRounds);
        loop = Boolean(parsed.loop);
        keepAwakePreference = Boolean(parsed.keepAwake);
      }
    } catch (error) {
      console.warn('Konnte gespeicherte Einstellungen nicht lesen', error);
    }
  };

  const requestWakeLock = async () => {
    wakeLockError = '';

    if (!browser || wakeLockActive) return;

    try {
      if (wakeLockSupported && (navigator as any).wakeLock?.request) {
        wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        wakeLockActive = true;
        keepAwakePreference = true;

        wakeLockSentinel.addEventListener('release', () => {
          wakeLockActive = false;
        });
      } else {
        // iOS-Fallback: NoSleep spielt ein minimales, stummes Video ab,
        // damit das Gerät nicht einschläft.
        if (!noSleep) {
          noSleep = new NoSleep();
        }
        await noSleep.enable();
        wakeLockActive = true;
        keepAwakePreference = true;
      }

      document.addEventListener('visibilitychange', handleVisibilityChange);
      persistSettings();
    } catch (error) {
      wakeLockError = error instanceof Error ? error.message : 'Unbekannter Fehler beim Wachhalten';
      wakeLockActive = false;
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockSentinel) {
      wakeLockSentinel.release().catch(() => undefined);
      wakeLockSentinel = null;
    }
    if (noSleep) {
      noSleep.disable();
    }
    wakeLockActive = false;
  };

  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible' && keepAwakePreference && !wakeLockActive) {
      await requestWakeLock();
    }
  };

  const startRenderLoop = () => {
    const loopFrame = () => {
      animationId = requestAnimationFrame(loopFrame);
      renderFrame();
    };
    loopFrame();
  };

  const formatSeconds = (s: number) => {
    const minutes = Math.floor(s / 60);
    const seconds = Math.floor(s % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const setPhase = (phase: Phase) => {
    if (currentPhase === phase) return;
    currentPhase = phase;

    if (phase === 'BREATH') phaseLabel = 'RHYTHMISCHE ATMUNG';
    if (phase === 'HOLD') phaseLabel = 'LUFT ANHALTEN';
    if (phase === 'RECOVER') phaseLabel = 'ERHOLUNG';
    if (phase === 'DONE') phaseLabel = 'FERTIG';

    updateChapters();
  };

  const setRound = (index: number) => {
    const capped = Math.min(index, timings.length - 1);
    roundIndex = capped;
    loopCount = 0;
    setPhase('BREATH');
    updateChapters();

    if (videoEl) {
      videoEl.currentTime = timings[capped].start;
    }
  };

  const finish = () => {
    playing = false;
    setPhase('DONE');
    displayTime = 'DONE';
  };

  const handleStart = async () => {
    ready = true;

    if (keepAwakePreference && !wakeLockActive) {
      await requestWakeLock();
    } else if (!keepAwakePreference && !wakeLockActive) {
      wakePrompt = true;
      return;
    }

    await startPlayback();
  };

  const startPlayback = async () => {
    if (!videoEl) return;
    videoEl.muted = false;

    try {
      await videoEl.play();
      playing = true;
      if (currentPhase === 'IDLE' || currentPhase === 'DONE') {
        setRound(0);
      }
    } catch (error) {
      loaderText = 'Tippe auf Start, um Audio zu aktivieren';
      console.error(error);
    }
  };

  const togglePlay = async () => {
    if (playing) {
      videoEl?.pause();
      playing = false;
      return;
    }

    await handleStart();
  };

  const skipPhase = () => {
    const data = timings[Math.min(roundIndex, timings.length - 1)];
    if (!videoEl) return;

    if (currentPhase === 'BREATH') videoEl.currentTime = data.endBreath;
    else if (currentPhase === 'HOLD') videoEl.currentTime = data.endHold;
    else if (currentPhase === 'RECOVER') videoEl.currentTime = data.endRecover;
  };

  const renderFrame = () => {
    if (!playing || !videoEl) return;

    const t = videoEl.currentTime;
    const roundData = timings[Math.min(roundIndex, timings.length - 1)];
    const speed = speeds[Math.min(roundIndex, speeds.length - 1)];

    if (t < roundData.endBreath) {
      setPhase('BREATH');

      if (loop && loopCount < 2 && t > roundData.loopOut) {
        videoEl.currentTime = roundData.loopIn;
        loopCount += 1;
      }

      const effectiveTime = (t - roundData.start) + loopCount * (roundData.loopOut - roundData.loopIn);
      const cycle = (effectiveTime % speed) / speed;
      ringProgress = 0;

      displayTime = Math.max(1, Math.floor(effectiveTime / speed)).toString();
      instruction = cycle < 0.5 ? 'Einatmen' : 'Ausatmen';
      updateVisuals('BREATH', cycle);
    } else if (t >= roundData.endBreath && t < roundData.endHold) {
      setPhase('HOLD');
      loopCount = 0;
      const total = roundData.endHold - roundData.endBreath;
      ringProgress = (t - roundData.endBreath) / total;
      displayTime = formatSeconds(roundData.endHold - t);
      instruction = 'Luft anhalten';
      updateVisuals('HOLD', ringProgress);
    } else if (t >= roundData.endHold && t < roundData.endRecover) {
      setPhase('RECOVER');
      const total = roundData.endRecover - roundData.endHold;
      ringProgress = (t - roundData.endHold) / total;
      displayTime = formatSeconds(roundData.endRecover - t);
      instruction = 'Tief ein & halten';
      updateVisuals('RECOVER', ringProgress);
    } else if (t >= roundData.endRecover) {
      if (roundIndex < totalRounds - 1) setRound(roundIndex + 1);
      else finish();
    }
  };

  const updateVisuals = (phase: Phase, progress: number) => {
    const baseSize = 320;
    if (phase === 'BREATH') {
      const wave = (1 - Math.cos(progress * Math.PI * 2)) / 2;
      videoSize = baseSize + wave * 70;
      circleColor = progress < 0.5 ? '#60a5fa' : '#3b82f6';
    }
    if (phase === 'HOLD') {
      videoSize = baseSize + Math.sin(Date.now() / 600) * 12;
      circleColor = '#a855f7';
    }
    if (phase === 'RECOVER') {
      videoSize = baseSize * 1.2;
      circleColor = '#22c55e';
    }
  };

  const updateChapters = () => {
    chapters = buildChapters(totalRounds, roundIndex, currentPhase);
  };

  const adjustRounds = (delta: number) => {
    totalRounds = clampRounds(totalRounds + delta);
    updateChapters();
    persistSettings();
  };

  const confirmWakeLock = async () => {
    wakePrompt = false;
    await requestWakeLock();
    await startPlayback();
  };

  const startWithoutWakeLock = async () => {
    wakePrompt = false;
    await startPlayback();
  };

  const toggleLoop = () => {
    loop = !loop;
    persistSettings();
  };
</script>

<svelte:head>
  <title>Wim-Hof-Breathing</title>
  <meta
    name="description"
    content="Geführte Wim-Hof-Atem-Session mit Runden-Übersicht, mobilem Wachhalte-Modus und den vertrauten Timings."
  />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="theme-color" content="#0b1222" />
</svelte:head>

<section class="page" data-animate="fade-in">
  <header class="hero">
    <div>
      <p class="eyebrow">Atemtraining</p>
      <h1>Wim-Hof-Breathing</h1>
      <p class="lead">
        Dieselben Phasen wie in der Original-App, jetzt als Svelte-Unterseite mit Bestätigung für den
        Wachhalte-Modus und einer klaren Rundenübersicht.
      </p>
      <div class="tag-list">
        <span class="pill">iOS & Android Ready</span>
        <span class="pill">Screen Wake Lock</span>
        <span class="pill">Runden als Kapitel</span>
      </div>
    </div>
    <div class="hero-card">
      <p class="status-title">Gerät wach halten?</p>
      <p class="status-text">
        Wir fragen vor dem Start, ob der Bildschirm wach bleiben darf. Android nutzt den Wake Lock API,
        iOS den NoSleep-Fallback.
      </p>
      <div class="status-row">
        <span class="dot {wakeLockActive ? 'dot--on' : ''}"></span>
        <span>{wakeLockActive ? 'Wachhalten aktiv' : 'Noch nicht aktiv'}</span>
      </div>
      {#if wakeLockError}
        <p class="error">{wakeLockError}</p>
      {/if}
    </div>
  </header>

  <div class="layout">
    <div class="player-card">
      <div class="player-viewport">
        <div
          class="video-circle"
          style={`width:${videoSize}px;height:${videoSize}px;box-shadow:0 0 40px ${circleColor}40;`}
        >
          <video
            bind:this={videoEl}
            playsinline
            preload="auto"
            muted
            src="https://www.hholk.de/index.php/s/E4sJEYLRdFRcw8W/download"
            on:canplay={() => {
              ready = true;
              loaderText = 'Bereit für den Start';
            }}
            class="video"
          ></video>
          <svg class="ring" viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r="82" stroke={circleColor} stroke-width="2" fill="none" opacity="0.6" />
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke="#e2e8f0"
              stroke-width="4"
              stroke-linecap="round"
              fill="none"
              stroke-dasharray={`${Math.max(2 * Math.PI * 90 * ringProgress, 0.001)} ${2 * Math.PI * 90}`}
              transform="rotate(-90 100 100)"
            />
          </svg>
        </div>

        <div class="overlay">
          <p class="phase">{phaseLabel}</p>
          <p class="timer">{displayTime}</p>
          <p class="instruction">{instruction}</p>
        </div>
      </div>

      <div class="controls">
        <button class="primary" on:click={togglePlay}>
          {#if playing}
            ⏸ Pause
          {:else}
            ▶ Start
          {/if}
        </button>
        <button class="ghost" on:click={skipPhase} disabled={!playing}>
          Phase überspringen
        </button>
      </div>

      <div class="info-row">
        <div>
          <p class="label">Runde</p>
          <p class="value">{roundIndex + 1} / {totalRounds}</p>
        </div>
        <div>
          <p class="label">Loop</p>
          <p class="value">{loop ? 'Erweitert' : 'Normal'}</p>
        </div>
        <div>
          <p class="label">Wachhalten</p>
          <p class="value">{keepAwakePreference ? 'Erlaubt' : 'Nachfrage'}</p>
        </div>
      </div>

      {#if !ready}
        <div class="loader">{loaderText}</div>
      {/if}
    </div>

    <aside class="sidebar">
      <div class="card">
        <h2>Runden-Übersicht</h2>
        <p class="muted">Jede Runde erscheint als Kapitel, damit du immer weißt, wo du bist.</p>
        <div class="chapters">
          {#each chapters as chapter}
            <div class={`chapter chapter--${chapter.state}`}>
              <div class="chapter-index">{chapter.index + 1}</div>
              <div>
                <p class="chapter-label">{chapter.label}</p>
                <p class="chapter-state">{chapter.state === 'done' ? 'abgeschlossen' : chapter.state === 'active' ? 'läuft' : 'wartet'}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="card">
        <h2>Einstellungen</h2>
        <div class="setting-row">
          <div>
            <p class="setting-label">Rundenanzahl</p>
            <p class="muted">Maximal 10, damit die Session kompakt bleibt.</p>
          </div>
          <div class="setting-actions">
            <button on:click={() => adjustRounds(-1)} aria-label="Runden verringern">-</button>
            <span>{totalRounds}</span>
            <button on:click={() => adjustRounds(1)} aria-label="Runden erhöhen">+</button>
          </div>
        </div>

        <div class="setting-row">
          <div>
            <p class="setting-label">Extra Atemzüge</p>
            <p class="muted">Verlängert die Ein- und Ausatmung.</p>
          </div>
          <label class="switch">
            <input type="checkbox" checked={loop} on:change={toggleLoop} />
            <span>Loop aktivieren</span>
          </label>
        </div>

        <div class="setting-row">
          <div>
            <p class="setting-label">Wachhalten</p>
            <p class="muted">Bei Zustimmung aktivieren wir Wake Lock bzw. NoSleep.</p>
          </div>
          <label class="switch">
            <input
              type="checkbox"
              checked={keepAwakePreference}
              on:change={async (event) => {
                keepAwakePreference = (event.currentTarget as HTMLInputElement).checked;
                persistSettings();
                if (keepAwakePreference) {
                  await requestWakeLock();
                } else {
                  releaseWakeLock();
                }
              }}
            />
            <span>Aktiv nach Zustimmung</span>
          </label>
        </div>
      </div>
    </aside>
  </div>
</section>

{#if wakePrompt}
  <div class="backdrop">
    <div class="dialog">
      <h3>Bildschirm wach halten?</h3>
      <p>
        Damit die Atemübungen nicht unterbrochen werden, kann die Seite den Schlafmodus deaktivieren.
        Möchtest du das erlauben?
      </p>
      <div class="dialog-actions">
        <button class="ghost" on:click={startWithoutWakeLock}>Ohne Wachhalten starten</button>
        <button class="primary" on:click={confirmWakeLock}>Ja, Bildschirm wach halten</button>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(body) {
    background: radial-gradient(circle at 10% 10%, rgba(59, 130, 246, 0.15), transparent 60%),
      radial-gradient(circle at 80% 0%, rgba(14, 165, 233, 0.1), transparent 55%),
      linear-gradient(160deg, #0b1222, #0c1020 40%, #06090f 100%);
  }

  .page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-bottom: 2rem;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
    gap: 1.25rem;
    align-items: start;
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-size: 0.75rem;
    color: rgba(96, 165, 250, 0.8);
    margin: 0 0 0.5rem;
  }

  h1 {
    margin: 0;
    font-size: clamp(2.2rem, 5vw, 3.2rem);
  }

  .lead {
    color: rgba(226, 232, 240, 0.8);
    line-height: 1.6;
    margin: 0.75rem 0 1rem;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .pill {
    padding: 0.35rem 0.8rem;
    border-radius: 999px;
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.35);
    font-weight: 600;
    color: #e2e8f0;
  }

  .hero-card {
    padding: 1.25rem;
    border-radius: 20px;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(148, 163, 184, 0.2);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
  }

  .status-title {
    margin: 0;
    font-weight: 700;
  }

  .status-text {
    margin: 0.5rem 0 1rem;
    color: rgba(226, 232, 240, 0.78);
    line-height: 1.6;
  }

  .status-row {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 12px;
    background: rgba(34, 197, 94, 0.08);
    color: #bbf7d0;
    font-weight: 700;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: #64748b;
  }

  .dot--on {
    background: #22c55e;
    box-shadow: 0 0 10px #22c55e;
  }

  .error {
    color: #fca5a5;
    margin: 0.5rem 0 0;
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
    gap: 1rem;
    align-items: start;
  }

  .player-card {
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 24px;
    padding: 1.25rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  }

  .player-viewport {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 360px;
  }

  .video-circle {
    position: relative;
    border-radius: 50%;
    overflow: hidden;
    background: #0f172a;
    transition: width 180ms ease, height 180ms ease, box-shadow 180ms ease;
  }

  .video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.9;
  }

  .ring {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    text-align: center;
    gap: 0.5rem;
    pointer-events: none;
  }

  .phase {
    font-weight: 700;
    letter-spacing: 0.35em;
    color: #93c5fd;
    margin: 0;
  }

  .timer {
    font-size: clamp(3rem, 10vw, 4.5rem);
    margin: 0;
    font-weight: 800;
  }

  .instruction {
    margin: 0;
    font-size: 1.15rem;
    color: rgba(226, 232, 240, 0.85);
  }

  .controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75rem;
    margin-top: 1rem;
  }

  button {
    border: none;
    cursor: pointer;
    border-radius: 14px;
    font-weight: 700;
    transition: transform 150ms ease, box-shadow 150ms ease, background 150ms ease;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .primary {
    background: linear-gradient(130deg, #38bdf8, #6366f1);
    color: #0b1222;
    padding: 0.95rem 1.2rem;
    box-shadow: 0 14px 30px rgba(99, 102, 241, 0.25);
  }

  .primary:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .ghost {
    background: rgba(30, 41, 59, 0.7);
    color: #e2e8f0;
    padding: 0.9rem 1.2rem;
    border: 1px solid rgba(148, 163, 184, 0.25);
  }

  .info-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .label {
    margin: 0;
    color: rgba(148, 163, 184, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.75rem;
  }

  .value {
    margin: 0.25rem 0 0;
    font-weight: 700;
  }

  .loader {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: rgba(59, 130, 246, 0.08);
    border: 1px dashed rgba(59, 130, 246, 0.4);
    border-radius: 12px;
    color: #bfdbfe;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .card {
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 20px;
    padding: 1rem 1.1rem;
    box-shadow: 0 16px 28px rgba(0, 0, 0, 0.2);
  }

  .card h2 {
    margin: 0 0 0.35rem;
  }

  .muted {
    margin: 0 0 0.75rem;
    color: rgba(226, 232, 240, 0.7);
  }

  .chapters {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .chapter {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.65rem;
    align-items: center;
    padding: 0.65rem;
    border-radius: 14px;
    border: 1px solid rgba(148, 163, 184, 0.2);
  }

  .chapter--active {
    border-color: rgba(59, 130, 246, 0.6);
    background: rgba(59, 130, 246, 0.1);
  }

  .chapter--done {
    border-color: rgba(34, 197, 94, 0.45);
    background: rgba(34, 197, 94, 0.08);
  }

  .chapter-index {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: rgba(226, 232, 240, 0.08);
    font-weight: 800;
  }

  .chapter-label {
    margin: 0;
    font-weight: 700;
  }

  .chapter-state {
    margin: 0;
    color: rgba(148, 163, 184, 0.8);
  }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.6rem 0;
    border-top: 1px solid rgba(148, 163, 184, 0.18);
  }

  .setting-row:first-of-type {
    border-top: none;
  }

  .setting-label {
    margin: 0;
    font-weight: 700;
  }

  .setting-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .setting-actions button {
    width: 36px;
    height: 36px;
    background: rgba(226, 232, 240, 0.08);
    color: #e2e8f0;
  }

  .setting-actions span {
    font-weight: 800;
    min-width: 2rem;
    text-align: center;
  }

  .switch {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    cursor: pointer;
  }

  .switch input {
    accent-color: #38bdf8;
    width: 18px;
    height: 18px;
  }

  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: grid;
    place-items: center;
    z-index: 50;
    padding: 1rem;
  }

  .dialog {
    background: #0f172a;
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: 16px;
    padding: 1.25rem;
    max-width: 520px;
    width: 100%;
    box-shadow: 0 18px 30px rgba(0, 0, 0, 0.35);
  }

  .dialog h3 {
    margin-top: 0;
  }

  .dialog-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  @media (max-width: 960px) {
    .hero,
    .layout {
      grid-template-columns: 1fr;
    }

    .player-viewport {
      min-height: 320px;
    }
  }
</style>
