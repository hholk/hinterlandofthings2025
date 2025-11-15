<script lang="ts">
  import { browser } from '$app/environment';
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import type LocomotiveScroll from 'locomotive-scroll';
  import 'locomotive-scroll/dist/locomotive-scroll.css';
  import '../app.css';
  import { initializeAuth, isAuthenticated } from '$stores/auth';

  let container: HTMLDivElement | null = null;

  // Für Einsteiger:innen: onMount läuft nur im Browser, nicht auf dem Server.
  // So stellen wir sicher, dass Animationen nur dort laufen, wo DOM verfügbar ist.
  onMount(() => {
    if (!browser) {
      return undefined;
    }

    // Erst den Auth-Store synchronisieren, bevor wir Animationen oder Navigationslogik starten.
    initializeAuth();

    let currentPath = globalThis.location?.pathname ?? '';
    const loginPath = `${base || ''}/login`;
    const homePath = `${base || ''}/`;

    const unsubscribePage = page.subscribe(($page) => {
      currentPath = $page.url.pathname;
    });

    const unsubscribeAuth = isAuthenticated.subscribe((loggedIn) => {
      const onLoginRoute = currentPath === loginPath || currentPath.startsWith(`${loginPath}/`);

      if (!loggedIn && !onLoginRoute) {
        goto(loginPath, { replaceState: true });
      } else if (loggedIn && onLoginRoute) {
        goto(homePath, { replaceState: true });
      }
    });

    if (!container) {
      return () => {
        unsubscribeAuth();
        unsubscribePage();
      };
    }

    let loco: LocomotiveScroll | undefined;
    let ctx: gsap.Context | undefined;

    (async () => {
      const { default: LocomotiveScroll } = await import('locomotive-scroll');
      loco = new LocomotiveScroll({
        el: container,
        smooth: true,
        multiplier: 0.9
      });

      ctx = gsap.context(() => {
        gsap.from('[data-animate="fade-in"]', {
          opacity: 0,
          y: 24,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12
        });
      }, container);
    })();

    return () => {
      unsubscribeAuth();
      unsubscribePage();
      ctx?.revert();
      loco?.destroy();
    };
  });
</script>

<svelte:head>
  <title>Interactive Briefing Hub</title>
  <meta name="description" content="SvelteKit Hub für Agenden, Erlebnisse und schnelle Logins." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div bind:this={container} class="app-shell" data-scroll-container>
  <div class="background-gradient" aria-hidden="true"></div>
  <main class="content" data-scroll-section>
    <slot />
  </main>
</div>

<style>
  :global(html) {
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background-color: #020409;
    color: #e8efff;
  }

  .app-shell {
    min-height: 100vh;
    position: relative;
    overflow: hidden;
  }

  .background-gradient {
    position: fixed;
    inset: 0;
    background: radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.25), transparent 60%),
      radial-gradient(circle at 80% 0%, rgba(236, 72, 153, 0.2), transparent 55%),
      radial-gradient(circle at 50% 80%, rgba(59, 130, 246, 0.2), transparent 60%),
      linear-gradient(160deg, rgba(10, 12, 25, 0.9), rgba(5, 8, 16, 0.95));
    z-index: 0;
    pointer-events: none;
  }

  .content {
    position: relative;
    z-index: 1;
    padding: clamp(2rem, 4vw, 4rem) clamp(1.5rem, 6vw, 6rem);
    max-width: 1200px;
    margin: 0 auto;
  }
</style>
