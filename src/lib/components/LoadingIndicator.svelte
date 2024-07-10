<script>

	import Lottie from "./Lottie.svelte"
	import animationData from '$lib/lottie/esponja1.json';

</script>

<div class="overlay loadingIndicator">
  <Lottie {animationData} />
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
    background-color: var(--colorGreen);

    :global(.lottieContainer) {
      height: 150px;
      width: 150px;
    }
  }
  
</style>