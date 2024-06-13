<script lang="ts">
	import { fade } from "svelte/transition"
	import EventListItem from "./EventListItem.svelte"
	import EButton from "./EButton.svelte"
	import ButtonLink from "./ButtonLink.svelte"
	import EventGridItem from "./EventGridItem.svelte"
	import SearchEvents from "./SearchEvents.svelte"

  export let events: [EventProperties] | []
  export let venues: [VenueProperties] | []
  export let startDate: string | null
  export let endDate: string | null

  let displayMode = 'list'
  let isSearchVisible = false
  let searchString = ''

  $: filteredEvents = events.filter(event => 
    (!startDate || event.startDate >= startDate) 
    && (!endDate || event.startDate <= endDate)
    && (searchString === '' || eventMatchesSearch(event, searchString))
  )

  const eventMatchesSearch = (event: EventProperties, searchString: string) => {
    const venue = venues.find(v => v.id === event.venueId)
    return (event.name).toLowerCase().includes(searchString.toLowerCase())
      || (`${venue?.name}`).toLowerCase().includes(searchString.toLowerCase())
  }

  const handleLikeEvent = (eventId: number) => {
    // TODO: add event to cookie
    console.log('like with id ' + eventId)
  }

  const handleEditEvent = (event: EEvent) => {
    // Navigate to edit page for this event
  }

  const toggleSearch = () => {
    isSearchVisible = !isSearchVisible
    searchString = ''
  }

  const handleSearchChange = (newSearchString: string) => searchString = newSearchString

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
      <SearchEvents {isSearchVisible} {toggleSearch} {handleSearchChange}  />
      <ButtonLink href="/info" class="info icon">
        Info
      </ButtonLink>
    </nav>
  </div>
  <ul class="events {displayMode}">
    {#each filteredEvents as event (event.id)}
      {#if displayMode === 'list'}
        <EventListItem {event} {venues} {handleLikeEvent} {handleEditEvent} />
      {:else}
        <EventGridItem {event} {venues} {handleLikeEvent} {handleEditEvent} />
      {/if}
    {/each}
    {#if !filteredEvents.length}
      <p class="emptyList">
        No hay eventos para las fechas seleccionadas
      </p>
    {/if}
  </ul>
</div>

<style lang="scss">
  @import "$lib/sass/variables";

  .publicEvents {

  }
  
  .tools {
    display: flex;
    gap: var(--spacing);
    padding: var(--spacing);
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
    margin-bottom: var(--spacing);
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
  }

  :global(.viewOptions button:disabled) {
    opacity: 1;
    pointer-events: none;
  }
</style>