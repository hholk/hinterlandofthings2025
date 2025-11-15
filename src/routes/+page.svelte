<script lang="ts">
  import ExperienceCard from '$components/ExperienceCard.svelte';
  import ScheduleTable from '$components/ScheduleTable.svelte';
  import { experiencePages } from '$data/experiences';
  import { base } from '$app/paths';
  import { isAuthenticated } from '$stores/auth';

  // Für Einsteiger:innen: Der Auth-Store reagiert sofort, wenn sich das Cookie ändert.
</script>

<section class="hero" data-animate="fade-in">
  <div class="hero__text">
    <p class="eyebrow">Interactive Briefing Hub</p>
    <h1>Alle Playbooks, Sessions und Routen – jetzt in SvelteKit.</h1>
    <p class="lead">
      Eine performante Neuauflage des Hinterland-Workflows, optimiert für schnelle Navigation,
      moderne Animationen mit GSAP und müheloses Scrollen via Locomotive Scroll.
    </p>
    <div class="hero__cta">
      <a class="button" href={`${base}/login`}>Stealth Login öffnen</a>
      <a class="button button--ghost" href={`${base}/experiences/hinterland`}>Direkt zur Agenda</a>
    </div>
  </div>
  <div class="hero__status" data-animate="fade-in">
    <h2>Status</h2>
    <p>Login-Status: {$isAuthenticated ? 'aktiv' : 'ausstehend'}</p>
    <p class="hint">Keine Sichtbarkeit nach außen – nur direkter Zugang nach erfolgreicher Prüfung.</p>
  </div>
</section>

<section class="experiences">
  <header>
    <h2>Module &amp; Erlebnisse</h2>
    <p>Die vertrauten Unterseiten erscheinen hier als Karten mit Glas-Effekt.</p>
  </header>
  <div class="grid">
    {#each experiencePages as exp (exp.id)}
      <ExperienceCard page={exp} />
    {/each}
  </div>
</section>

<ScheduleTable />

<style>
  .hero {
    display: grid;
    gap: clamp(2rem, 5vw, 4rem);
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    align-items: start;
  }

  .hero__text {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 0.75rem;
    color: rgba(96, 165, 250, 0.8);
    margin: 0;
  }

  h1 {
    font-size: clamp(2.2rem, 6vw, 3.5rem);
    margin: 0;
    line-height: 1.1;
  }

  .lead {
    margin: 0;
    color: rgba(226, 232, 240, 0.78);
    max-width: 60ch;
    line-height: 1.7;
  }

  .hero__cta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .button {
    padding: 0.85rem 1.4rem;
    border-radius: 999px;
    text-decoration: none;
    font-weight: 600;
    background: linear-gradient(130deg, #38bdf8, #6366f1);
    color: #020617;
    transition: transform 180ms ease, box-shadow 180ms ease;
  }

  .button:hover,
  .button:focus {
    transform: translateY(-1px);
    box-shadow: 0 18px 30px rgba(99, 102, 241, 0.25);
  }

  .button--ghost {
    background: rgba(15, 23, 42, 0.6);
    color: rgba(226, 232, 240, 0.85);
    border: 1px solid rgba(148, 163, 184, 0.35);
  }

  .hero__status {
    padding: 1.5rem;
    border-radius: 24px;
    border: 1px solid rgba(148, 163, 184, 0.25);
    background: linear-gradient(160deg, rgba(15, 23, 42, 0.75), rgba(30, 41, 59, 0.55));
  }

  .hero__status h2 {
    margin-top: 0;
  }

  .hero__status p {
    margin: 0.5rem 0 0;
    color: rgba(226, 232, 240, 0.75);
  }

  .hero__status .hint {
    font-size: 0.85rem;
    color: rgba(148, 163, 184, 0.8);
  }

  .experiences {
    margin-top: clamp(4rem, 9vw, 6rem);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .experiences header h2 {
    margin: 0;
    font-size: clamp(1.8rem, 4vw, 2.5rem);
  }

  .experiences header p {
    margin: 0;
    color: rgba(226, 232, 240, 0.75);
  }

  .grid {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }

  @media (max-width: 960px) {
    .hero {
      grid-template-columns: 1fr;
    }
  }
</style>
