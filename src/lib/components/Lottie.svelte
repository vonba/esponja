<script lang="ts">
  import { onMount } from 'svelte';
  import lottie from 'lottie-web';

  export let animationData: any;

  let container: HTMLDivElement;

  onMount(() => {
    const animation = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData
    });

    return () => animation.destroy();
  });
</script>

<div class="lottieContainer" bind:this={container}></div>