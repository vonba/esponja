<header class="adminLogo">
  <img src="/esponja-logo-offwhite.svg" alt="Esponja" class="esponjaLogo" />
  <p>
    Administración
  </p>
  <a href="/eventos" class="exit">Sitio público</a>
</header>

<style lang="scss">
  @import "$lib/sass/variables";

  .adminLogo {
    width: 100%;
    padding: var(--spacing);
    background-color: var(--colorGreen);
    color: var(--colorOffWhite);
    text-transform: uppercase;
    font-weight: bold;
  }
  
  .esponjaLogo {
    width: 150px;
    margin-bottom: 8px
  }

  .exit {
    position: absolute;
    top: var(--spacing);
    right: var(--spacing);
    color: var(--colorOffWhite);
    font-style: italic;
  }
</style>