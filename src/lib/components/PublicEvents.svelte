<script lang="ts">
	import { fade } from "svelte/transition"
	import EventListItem from "./EventListItem.svelte"
	import EventGridItem from "./EventGridItem.svelte"

  // Props
  export let eventTimeWindow = ''
  export let events: [EventProperties] | []
  export let venues: [VenueProperties] | []
  export let startDate: string | null
  export let endDate: string | null
  export let searchString = ''
  export let displayMode = 'list' // Default mode is list

  // Filter events according to date range and search string
  $: filteredEvents = events.filter(event => {
    const eventStart = event.startDate
    const eventEnd = event.endDate || event.startDate // Use startDate if no endDate
    
    // Check for date range overlap
    const overlapsDateRange = (!startDate || eventEnd >= startDate) 
      && (!endDate || eventStart <= endDate)
    
    // Check search string
    const matchesSearch = searchString === '' || eventMatchesSearch(event, searchString)
    
    return overlapsDateRange && matchesSearch
  })

  // -- Handlers --

  const eventMatchesSearch = (event: EventProperties, searchString: string) => {
    const venue = venues.find(v => v.id === event.venueId)
    return (event.name).toLowerCase().includes(searchString.toLowerCase())
      || (`${venue?.name}`).toLowerCase().includes(searchString.toLowerCase())
  }
</script>
<div class="publicEvents" in:fade>

  <!-- Main events grid -->
  <ul class="events {displayMode}">
    {#each filteredEvents as event (event.id)}
      {#if displayMode === 'list'}
        <EventListItem {event} {venues} />
      {:else}
        <EventGridItem {event} {venues} />
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

<style lang="scss">
  @use "$lib/sass/variables" as *;

  ul.events {
    margin-top: 0;
    list-style: none;
    padding: 0;
    margin-bottom: var(--spacing);
    display: grid;
    gap: var(--spacing);
    
    --eventColumnsGrid: 1;
    --eventColumnsList: 1;
    
    @media (min-width: $mediaM) {
      --eventColumnsGrid: 2;
      --eventColumnsList: 2;
    }
    @media (min-width: $mediaL) {
      --eventColumnsGrid: 3;
    }
    @media (min-width: $mediaXL) {
      --eventColumnsList: 3;
      --eventColumnsGrid: 4;
    }

    &.grid {
      padding: var(--spacing);
      grid-template-columns: repeat(var(--eventColumnsGrid), 1fr);
    }
    &.list {
      grid-template-columns: repeat(var(--eventColumnsList), 1fr);
    }
  }
</style>