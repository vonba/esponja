<div class="overlay loadingIndicator">
  <img src="/esponja-symbol3.svg" alt="Cargando" />
</div>

<style lang="scss">
  @keyframes pulsate {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
    100% {
      opacity: 1;
    }
  }

  .loadingIndicator {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing);

    img {
      animation: pulsate 3s infinite ease-in-out;
      height: 150px;
    }
  }
</style>