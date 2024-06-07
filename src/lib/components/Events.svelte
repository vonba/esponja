<script lang="ts">
  import { invalidateAll } from "$app/navigation";
	import { fade } from "svelte/transition"
	import EditEvent from "./EditEvent.svelte"
	import EventListItem from "./EventListItem.svelte"

  export let events: [EEvent]
  export let venues: [Venue]

  let showCreateEvent = false
  let showEditEvent = false
  let editEvent: EEvent = null
  let displayMode = 'list'

  const handleLikeEvent = (eventId: number) => {
    // TODO: update event and like for logged in user
    console.log('like with id ' + eventId)
  }

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
    />
    <button on:click={() => showCreateEvent = false}>Cancelar</button>
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
    />
    <button on:click={() => showEditEvent = false}>Cancelar</button>
  </div>

{:else}
  <div class="events" in:fade>
    <div class="tools">
      <div class="viewOptions">
        <button 
          class="grid"
          on:click={() => displayMode = 'grid'}
          disabled={displayMode === 'grid'}
        >Grid</button>
        <button 
          class="list"
          on:click={() => displayMode = 'list'}
          disabled={displayMode === 'list'}
        >List</button>
      </div>
      <button on:click={() => showCreateEvent = true}>Nuevo evento</button>
    </div>
    <ul class="events {displayMode}">
      {#each events as event (event?.id)}
        <EventListItem {event} {handleLikeEvent} {handleDisableEvent} {handleEditEvent} />
      {/each}
    </ul>
  </div>
{/if}

<style lang="scss">
  .tools {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1em;
  }

  ul.events {
    list-style: none;
    padding: 0;

    &.grid {
      display: grid;
      gap: 1em;
      grid-template-columns: repeat(5, 1fr);
    }
  }
</style>