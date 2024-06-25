<script lang="ts">
	import { fade, slide } from "svelte/transition"
	import EButton from "./EButton.svelte"

  export let displayMessage: string
  export let setDisplayMessage: Function
</script>

<div class="message" in:fade out:slide>
        <h2>
          {displayMessage}
          &nbsp;
          <EButton on:click={() => setDisplayMessage('')} class="large">Ok</EButton>
        </h2>
      </div>

<style lang="scss">
  .message {
    text-align: left;
    padding-left: 0;
  }
</style>