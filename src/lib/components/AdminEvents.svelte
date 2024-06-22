<script lang="ts">
  import { invalidateAll } from "$app/navigation";
	import { fade } from "svelte/transition"
	import EditEvent from "./EditEvent.svelte"
	import EventListItem from "./EventListItem.svelte"
	import EButton from "./EButton.svelte"
	import EventGridItem from "./EventGridItem.svelte"

  export let events: [EventProperties] | []
  export let venues: [VenueProperties] | []

  let showCreateEvent = false
  let showEditEvent = false
  let editEvent: EventProperties | null = null
  let displayMode = 'list'

  const handleEditEvent = (event: EventProperties) => {
    editEvent = event
    showEditEvent = true
  }
</script>

{#if showCreateEvent}
  <div in:fade>
    <EditEvent 
      {venues}
      event={null} 
      on:saved={() => {
        invalidateAll();
        showCreateEvent = false
      }}
      on:cancel={() => showCreateEvent = false}
    />
  </div>

{:else if showEditEvent}
  <div in:fade>
    <EditEvent 
      {venues}
      event={editEvent}
      on:saved={() => {
        invalidateAll();
        showEditEvent = false
      }}
      on:cancel={() => showEditEvent = false}
    />
  </div>

{:else}
  <div class="events" in:fade>
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
      <EButton on:click={() => showCreateEvent = true}>Nuevo evento</EButton>
    </div>
    <ul class="events {displayMode}">
      {#each events as event (event?.id)}
        {#if displayMode === 'list'}
          <EventListItem {event} {venues} {handleEditEvent} />
        {:else}
          <EventGridItem {event} {venues} {handleEditEvent} />
        {/if}
      {/each}
    </ul>
  </div>
{/if}

<style lang="scss">
  @import "$lib/sass/variables";

  .tools {
    display: flex;
    justify-content: space-between;
    padding: var(--spacing);
  }

  .viewOptions {
    // Override EButton styles
    :global(button:hover),
    :global(button.selected) {
      transform: none;
      box-shadow: 2px 2px 0 var(--colorGreen);
      transform: translate(-2px, -2px);
    }
    :global(button.grid) {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
    :global(button.list) {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      transform: translate(-6px, -2px);
    }
  }

  ul.events {
    list-style: none;
    padding: 0;
    margin-top: 0;
    border-top: 1px solid var(--colorGreen);
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

    @media (min-width: $mediaL) {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
    }
  }

  :global(.viewOptions button:disabled) {
    opacity: 1;
    pointer-events: none;
  }
</style>