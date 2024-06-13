<script lang="ts">
  import { invalidateAll } from "$app/navigation";
	import { fade } from "svelte/transition"
	import EditEvent from "./EditEvent.svelte"
	import EventListItem from "./EventListItem.svelte"
	import EButton from "./EButton.svelte"

  export let events: [EEvent] | []
  export let venues: [Venue] | []

  let showCreateEvent = false
  let showEditEvent = false
  let editEvent: EEvent = null
  let displayMode = 'list'

  const handleDisableEvent = (eventId: number) => {
    // TODO: update event and set as disabled
    console.log('disable event with id ' + eventId)
  }

  const handleEditEvent = (event: EEvent) => {
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
        showCreateEvent = false
      }}
      on:cancel={() => showEditEvent = false}
    />
  </div>

{:else}
  <div class="events" in:fade>
    <div class="tools">
      <div class="viewOptions">
        <EButton 
          class="grid {displayMode === 'grid' ? 'selected' : ''}"
          on:click={() => displayMode = 'grid'}
          disabled={displayMode === 'grid'}
        >Grid</EButton>
        <EButton 
          class="list {displayMode === 'list' ? 'selected' : ''}"
          on:click={() => displayMode = 'list'}
          disabled={displayMode === 'list'}
        >List</EButton>
      </div>
      <EButton on:click={() => showCreateEvent = true}>Nuevo evento</EButton>
    </div>
    <ul class="events {displayMode}">
      {#each events as event (event?.id)}
        <EventListItem {event} {handleDisableEvent} {handleEditEvent} />
      {/each}
    </ul>
  </div>
{/if}

<style lang="scss">
  @import "$lib/sass/variables";

  .tools {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1em;
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