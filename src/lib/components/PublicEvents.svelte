<script lang="ts">
	import { fade } from "svelte/transition"
	import EventListItem from "./EventListItem.svelte"
	import EButton from "./EButton.svelte"
	import ButtonLink from "./ButtonLink.svelte"
	import EventGridItem from "./EventGridItem.svelte"

  export let events: [EEvent] | []
  export let venues: [Venue] | []

  let displayMode = 'list'
  let showSearch = false

  const handleLikeEvent = (eventId: number) => {
    // TODO: add event to cookie
    console.log('like with id ' + eventId)
  }

  const handleEditEvent = (event: EEvent) => {
    // Navigate to edit page for this event
  }

  const toggleSearch = () => showSearch = !showSearch

  const showSavedEvents = () => {
    // TODO: global modal state
  }
</script>
<div class="publicEvents" in:fade>
  <div class="tools">
    <div class="viewOptions">
      <EButton 
        class="icon grid {displayMode === 'grid' ? 'selected' : ''}"
        on:click={() => displayMode = 'grid'}
        disabled={displayMode === 'grid'}
      >Grid</EButton>
      <EButton 
        class="icon list {displayMode === 'list' ? 'selected' : ''}"
        on:click={() => displayMode = 'list'}
        disabled={displayMode === 'list'}
      >List</EButton>
    </div>

    <nav id="pageNavigation">
      <EButton 
        on:click={() => showSavedEvents()}
        class="saveFilled icon"
      >
        Guardados
      </EButton>
      <EButton 
        on:click={() => toggleSearch()}
        class="search icon"
      >
        Buscar
      </EButton>
      <ButtonLink href="/info" class="info icon">
        Info
      </ButtonLink>
    </nav>
  </div>
  <ul class="events {displayMode}">
    {#each events as event (event?.id)}
      {#if displayMode === 'list'}
        <EventListItem {event} {venues} {handleLikeEvent} {handleEditEvent} />
      {:else}
        <EventGridItem {event} {venues} {handleLikeEvent} {handleEditEvent} />
      {/if}
    {/each}
  </ul>
</div>

<style lang="scss">
  @import "$lib/sass/variables";

  .publicEvents {
    padding: var(--spacing);
  }
  
  .tools {
    display: flex;
    gap: var(--spacing);
    justify-content: space-between;
    margin-bottom: 1em;
  }

  .viewOptions {
    // Override EButton styles
    :global(button:hover),
    :global(button.selected) {
      transform: none;
      box-shadow: 2px 2px 0 var(--colorGreen);
    }
    :global(button.grid) {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
    :global(button.list) {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      transform: translateX(-4px);
    }
  }

  #pageNavigation {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing);
	}

  ul.events {
    list-style: none;
    padding: 0;
    --eventColumns: 1;
    
    @media (min-width: $mediaM) {
      --eventColumns: 2;
    }
    @media (min-width: $mediaL) {
      --eventColumns: 3;
    }
    @media (min-width: $mediaXL) {
      --eventColumns: 4;
    }

    &.grid {
      display: grid;
      gap: 1em;
      grid-template-columns: repeat(var(--eventColumns), 1fr);
    }
  }

  :global(.viewOptions button:disabled) {
    opacity: 1;
    pointer-events: none;
  }
</style>