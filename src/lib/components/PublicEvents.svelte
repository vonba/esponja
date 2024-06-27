<script lang="ts">
	import { fade } from "svelte/transition"
	import EventListItem from "./EventListItem.svelte"
	import EventGridItem from "./EventGridItem.svelte"
	import { loginSession } from "../../stores"
	import { invalidateAll } from "$app/navigation"
	import EditEvent from "./EditEvent.svelte"
  import { likedEventsStore, toggleLikedEvent } from '$lib/likedEvents';

  // Props
  export let eventTimeWindow = 'todo'
  export let events: [EventProperties] | []
  export let venues: [VenueProperties] | []
  export let startDate: string | null
  export let endDate: string | null
  export let searchString = ''
  export let displayMode = 'grid'

  // State
  let showEditEvent = false
  let editEvent: EventProperties | null = null
  let user: User;
  loginSession.subscribe(value => {
    user = value;
  });
  $: likedEvents = $likedEventsStore;

  // Observable
  $: filteredEvents = events.filter(event => 
    (!startDate || event.startDate >= startDate) 
    && (!endDate || event.startDate <= endDate)
    && (searchString === '' || eventMatchesSearch(event, searchString))
  )

  // -- Handlers --

  const eventMatchesSearch = (event: EventProperties, searchString: string) => {
    const venue = venues.find(v => v.id === event.venueId)
    return (event.name).toLowerCase().includes(searchString.toLowerCase())
      || (`${venue?.name}`).toLowerCase().includes(searchString.toLowerCase())
  }

  const handleLikeEvent = (event: EventProperties) => {
    toggleLikedEvent(event);
  }

  const handleEditEvent = user && user.role === 'admin' 
    ? (event: EventProperties) => {
      editEvent = event
      showEditEvent = true
    }
    : null

</script>
{#if showEditEvent}
  <div in:fade class="overlay">
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
  <div class="publicEvents" in:fade>

    <!-- Main events grid -->
    <ul class="events {displayMode}">
      {#each filteredEvents as event (event.id)}
        {#if displayMode === 'list'}
          <EventListItem {event} {venues} {handleLikeEvent} {handleEditEvent} isLiked={likedEvents.some(e => e.id === event.id)} />
        {:else}
          <EventGridItem {event} {venues} {handleLikeEvent} {handleEditEvent} isLiked={likedEvents.some(e => e.id === event.id)} />
        {/if}
      {/each}
    </ul>

    <!-- No events notice -->
    {#if !filteredEvents.length}
      <p class="emptyList">
        {#if eventTimeWindow === 'hoy'}
          No hay eventos hoy
        {:else if eventTimeWindow === 'manana'}
          No hay eventos mañana
        {:else if eventTimeWindow === 'semana'}
          No hay eventos esta semana
        <!-- {:else if eventTimeWindow === 'mes'}
          No hay eventos este mes -->
        {:else}
          No hay ningún evento por el momento 😥<br />
          Pero tú nos puedes ayudar, <a href="/tu-evento">agregando el tuyo</a>
          <br />
          También nos puedes contactar en <a href="mailto:hola@esponja.mx">hola@esponja.mx</a>
        {/if}
      </p>
    {/if}
  </div>
{/if}

<style lang="scss">
  @import "$lib/sass/variables";

  ul.events {
    margin-top: 0;
    list-style: none;
    padding: var(--spacing);
    margin-bottom: var(--spacing);
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
      grid-template-columns: repeat(var(--eventColumns), 1fr);
      gap: var(--spacing);
    }

    @media (max-width: $mediaM) {
      padding-top: calc(3 * var(--spacing));
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