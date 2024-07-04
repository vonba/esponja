<div class="overlay loadingIndicator">
  <img src="/esponja-blob-green.svg" alt="Cargando" />
</div>

<style lang="scss">
  @keyframes pulsate {
    0% {
      opacity: 0.4;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.4;
    }
  }

  .loadingIndicator {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing);

    img {
      animation: pulsate 2.5s infinite ease-in-out;
      height: 150px;
    }
  }
</style>