<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { PASSWORD_HASH, verifyPassword } from '$utils/auth';
  import {
    authenticateUser,
    clearAuthentication,
    initializeAuth,
    isAuthenticated
  } from '$stores/auth';

  type FormState = { status: 'idle' | 'error' | 'success'; message?: string };
  const loginResult = writable<FormState>({ status: 'idle' });
  let form: HTMLFormElement | null = null;

  // Für Einsteiger:innen: onMount läuft im Browser und erlaubt uns, den Store auszulesen.
  onMount(() => {
    initializeAuth();
    const unsubscribe = isAuthenticated.subscribe((loggedIn) => {
      if (loggedIn) {
        goto(`${base || ''}/`, { replaceState: true });
      }
    });
    return unsubscribe;
  });

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    if (!form) {
      return;
    }

    const formData = new FormData(form);
    const password = String(formData.get('password') ?? '').trim();

    if (!password) {
      loginResult.set({ status: 'error', message: 'Bitte gib den Zugangscode ein.' });
      clearAuthentication();
      return;
    }

    const isValid = await verifyPassword(password, PASSWORD_HASH);

    if (!isValid) {
      loginResult.set({ status: 'error', message: 'Code ungültig. Erneut versuchen.' });
      clearAuthentication();
      return;
    }

    authenticateUser();
    loginResult.set({ status: 'success', message: 'Erfolgreich geprüft. Zugang ist jetzt aktiv.' });

    setTimeout(() => {
      goto(`${base || ''}/`, { replaceState: true });
    }, 600);
  }
</script>

<section class="login-shell">
  <form
    bind:this={form}
    class="login-card"
    aria-describedby="login-note"
    method="POST"
    on:submit={handleSubmit}
  >
    <h1>Passwort eingeben</h1>
    <p id="login-note">Stealth Login – keine sichtbare Marke, nur direkter Zugang.</p>

    <label for="password">Zugangscode</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required />

    <button type="submit">Prüfen</button>

    {#if $loginResult.status === 'error'}
      <p class="feedback feedback--error">{$loginResult.message}</p>
    {:else if $loginResult.status === 'success'}
      <p class="feedback feedback--success">{$loginResult.message}</p>
    {/if}
  </form>
</section>

<style>
  .login-shell {
    min-height: calc(100vh - 6rem);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .login-card {
    width: min(420px, 100%);
    display: grid;
    gap: 1rem;
    padding: 2.5rem;
    border-radius: 30px;
    border: 1px solid rgba(148, 163, 184, 0.3);
    background: linear-gradient(160deg, rgba(15, 23, 42, 0.85), rgba(17, 24, 39, 0.65));
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.45);
  }

  h1 {
    margin: 0;
    font-size: 1.6rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-weight: 500;
    color: rgba(226, 232, 240, 0.9);
  }

  input {
    width: 100%;
    border-radius: 14px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    padding: 0.85rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    color: #f8fafc;
    font-size: 1rem;
  }

  button {
    margin-top: 0.5rem;
    border: none;
    border-radius: 999px;
    padding: 0.85rem 1.4rem;
    font-weight: 600;
    background: linear-gradient(130deg, #38bdf8, #22d3ee);
    color: #020617;
    cursor: pointer;
    transition: transform 180ms ease, box-shadow 180ms ease;
  }

  button:hover,
  button:focus {
    transform: translateY(-1px);
    box-shadow: 0 18px 30px rgba(34, 211, 238, 0.25);
  }

  .feedback {
    margin: 0;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.7);
  }

  .feedback--error {
    border: 1px solid rgba(248, 113, 113, 0.6);
    color: #fecaca;
  }

  .feedback--success {
    border: 1px solid rgba(52, 211, 153, 0.6);
    color: #bbf7d0;
  }
</style>
