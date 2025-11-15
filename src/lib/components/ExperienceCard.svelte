<script lang="ts">
  import type { ExperiencePage } from '$data/experiences';

  import { base } from '$app/paths';

  // Für Einsteiger:innen: Der base-Pfad sorgt dafür, dass Links auch auf GitHub Pages funktionieren.
  export let page: ExperiencePage;
</script>

<article class="card" data-animate="fade-in">
  <span class="icon" aria-hidden="true">{@html page.icon}</span>
  <h3>{page.title}</h3>
  <p>{page.description}</p>
  <a class="cta" href={`${base}${page.href}`}>Öffnen</a>
</article>

<style>
  .card {
    backdrop-filter: blur(18px);
    background: linear-gradient(160deg, rgba(15, 25, 53, 0.8), rgba(20, 30, 60, 0.65));
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 24px;
    padding: 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
  }

  .card:hover,
  .card:focus-within {
    transform: translateY(-4px) scale(1.01);
    border-color: rgba(94, 234, 212, 0.5);
    box-shadow: 0 18px 32px rgba(15, 118, 110, 0.25);
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  p {
    margin: 0;
    color: rgba(226, 232, 240, 0.8);
    line-height: 1.6;
  }

  .cta {
    align-self: flex-start;
    margin-top: auto;
    padding: 0.65rem 1.2rem;
    border-radius: 999px;
    background: linear-gradient(120deg, #38bdf8, #0ea5e9);
    color: #020617;
    font-weight: 600;
    text-decoration: none;
    transition: transform 180ms ease, box-shadow 180ms ease;
  }

  .cta:hover,
  .cta:focus {
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(56, 189, 248, 0.4);
  }

  .icon :global(svg) {
    width: 2.5rem;
    height: 2.5rem;
  }
</style>
