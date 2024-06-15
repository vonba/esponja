<script lang="ts">
	import { fade } from "svelte/transition"
	import EButton from "./EButton.svelte"
	import { tick } from "svelte"

  // Props
  export let toggleSearch: Function
  export let handleSearchChange: Function
  export let isSearchVisible: boolean

  // State
  let searchString = ''
  let focusedField: HTMLInputElement

  $: handleSearchChange(searchString)
</script>

{#if isSearchVisible}
  <div class="searchWrapper" in:fade>
    <input bind:this={focusedField} bind:value={searchString} placeholder="Buscar" />
    <button 
      on:click={() => {
        toggleSearch()
        searchString = ''
      }}
      class="close icon"
    >
      Cerrar
    </button>
  </div>
{:else}
  <EButton 
    on:click={async () => {
      toggleSearch()
      await tick()
      focusedField.focus()
    }}
    class="search icon"
  >
    Buscar
  </EButton>
{/if}

<style lang="scss">
  .searchWrapper {
    display: flex;
    gap: var(--spacing);
    border: 1px solid var(--colorGreen);
    border-radius: var(--borderRadius);
    overflow: hidden;
    box-shadow: 2px 2px 0 var(--colorGreen);

    :global(input) {
      padding-top: 2px;
      padding-bottom: 2px;
      border: none;
    }

    :global(input:focus) {
      outline: none;
    }

    button.close {
      cursor: pointer;
      background: transparent url('/icon-close-green.svg') center no-repeat;
      background-size: 1em;
      border: none;
      text-indent: -999em;
      padding-right: var(--spacing);
      border-left: 1px solid var(--colorGreen);
      width: 3em;
      transition: all 0.5s;

      @media (hover: hover) {
        &:hover {
          background-color: var(--colorGreen);
          background-image: url('/icon-close-offwhite.svg');
        }
      }
    }
  }
</style>