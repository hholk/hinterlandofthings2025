<script lang="ts">
  export let data: {
    experience: {
      title: string;
      description: string;
      icon: string;
    };
  };
</script>

<section class="detail" data-animate="fade-in">
  <header>
    <span aria-hidden="true">{@html data.experience.icon}</span>
    <h1>{data.experience.title}</h1>
    <p>{data.experience.description}</p>
  </header>
  <p>
    Diese Unterseite wird Schritt für Schritt migriert. Die bisherigen Inhalte bleiben erreichbar, während wir
    weitere Module nach SvelteKit übertragen.
  </p>
</section>

<style>
  .detail {
    display: grid;
    gap: 1.5rem;
    padding-block: clamp(2rem, 6vw, 4rem);
  }

  header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 60ch;
  }

  header :global(svg) {
    width: 3rem;
    height: 3rem;
  }

  h1 {
    margin: 0;
    font-size: clamp(2rem, 5vw, 3rem);
  }

  p {
    margin: 0;
    color: rgba(226, 232, 240, 0.78);
    line-height: 1.7;
  }
</style>
