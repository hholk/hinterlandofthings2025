<script lang="ts">
  import timeslots from '$data/timeslots.json';

  interface Slot {
    file: string;
    title: string;
    start: string;
    end: string;
  }

  const sortedSlots = (timeslots as Slot[]).slice().sort((a, b) => a.start.localeCompare(b.start));
</script>

<section class="schedule" aria-labelledby="schedule-heading">
  <div class="schedule__header">
    <h2 id="schedule-heading">Tagesfahrplan</h2>
    <p>Alle Sessions auf einen Blick – sortiert nach Startzeit.</p>
  </div>
  <div class="schedule__grid" role="list">
    {#each sortedSlots as slot (slot.file)}
      <article class="schedule__card" role="listitem" data-animate="fade-in">
        <header>
          <h3>{slot.title}</h3>
          <p class="time">
            <span>{slot.start}</span>
            <span aria-hidden="true">→</span>
            <span>{slot.end}</span>
          </p>
        </header>
        <p class="meta">Markdown-Datei: {slot.file}</p>
      </article>
    {/each}
  </div>
</section>

<style>
  .schedule {
    margin-top: clamp(3rem, 8vw, 5rem);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .schedule__header h2 {
    font-size: clamp(1.75rem, 4vw, 2.4rem);
    margin: 0;
  }

  .schedule__header p {
    margin: 0;
    color: rgba(226, 232, 240, 0.7);
  }

  .schedule__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.5rem;
  }

  .schedule__card {
    padding: 1.5rem;
    background: linear-gradient(150deg, rgba(15, 23, 42, 0.75), rgba(30, 41, 59, 0.6));
    border-radius: 20px;
    border: 1px solid rgba(148, 163, 184, 0.25);
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  h3 {
    margin: 0;
    font-size: 1rem;
    line-height: 1.4;
  }

  .time {
    margin: 0;
    font-variant-numeric: tabular-nums;
    color: rgba(148, 163, 184, 0.85);
    display: flex;
    gap: 0.35rem;
    align-items: center;
  }

  .meta {
    margin-top: 1rem;
    color: rgba(148, 163, 184, 0.75);
    font-size: 0.9rem;
  }
</style>
