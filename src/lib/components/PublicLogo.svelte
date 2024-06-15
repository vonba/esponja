<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<header class="publicLogo" on:click role="navigation">
  <a href="/todo">
    <img src="/esponja-logo.svg" alt="Esponja" class="esponjaLogo" />
    <img src="/esponja-tagline.svg" alt="Eventos de música alternativa en la Ciudad de México" class="esponjaTagline" />
  </a>
</header>

<style>
  .publicLogo {
    width: 70vw;
    max-width: 300px;
    padding: var(--spacing);
    padding-bottom: 0;
  }
  img {
    display: block;
  }
  .esponjaLogo {
    width: 100%;
    margin-bottom: 8px
  }
  .esponjaTagline {
    width: 100%;
  }
</style>