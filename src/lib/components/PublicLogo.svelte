<script>
  export let frontPage = true
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<header class="publicLogo {frontPage ? '' : 'notFrontPage'}" on:click role="navigation">
  <a href="/">
    <img src="/esponja-symbol2.svg" alt="Esponja" class="esponjaSymbol" />
  </a>
  <a href="/">
    <img src="/esponja-logo.svg" alt="Esponja" class="esponjaLogo" />
    <img src="/esponja-tagline.svg" alt="Eventos de música alternativa en la Ciudad de México" class="esponjaTagline" />
  </a>
</header>

<style lang="scss">
  @use "$lib/sass/variables" as *;

  .publicLogo {
    width: 70vw;
    max-width: 300px;
    padding: var(--spacing);
    padding-bottom: 0;
  }

  .esponjaSymbol {
    display: none;
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

  // Logo on internal pages like /info
  /* .notFrontPage {
    width: 100px;

    .esponjaSymbol {
      display: block;
      height: 100px
    }

    .esponjaTagline {
      display: none;
    }
    .esponjaLogo {
      display: none;
    }
  } */
</style>