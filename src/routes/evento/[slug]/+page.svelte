<script lang="ts">
	import { beforeNavigate, goto, invalidateAll } from "$app/navigation"
	import ButtonLink from "$lib/components/ButtonLink.svelte"
	import EButton from "$lib/components/EButton.svelte"
	import EditEvent from "$lib/components/EditEvent.svelte"
	import EventGridItem from "$lib/components/EventGridItem.svelte"
  import PublicLogo from "$lib/components/PublicLogo.svelte"
	import { fade } from "svelte/transition"
	import { likedEventsPopupVisible, loginSession } from "../../../stores"
	import { likedEventsStore, toggleLikedEvent } from "$lib/likedEvents"
	import { formatDate } from "$lib/dateTime"
	import EventSummary from "$lib/components/EventSummary.svelte"
	import Notification from "$lib/components/Notification.svelte"

  // Props
  export let data: SingleEventPageData
  
  // Observables
  let venues, event, relatedEvents, venue
  $: venues = data.venues
  $: event = data.event.event
  $: relatedEvents = data.event.relatedEvents
  $: venue = venues.find(v => v.id === event?.venueId)
  $: unmoderated = !event.published
  $: likedEvents = $likedEventsStore;

  // State
  let showEditEvent = false
  let editEvent: EventProperties | null = null

  // Display message
  let displayMessage = ''
  const setDisplayMessage = (str: string) => displayMessage = str
  

  // Handlers

  const showLikedEvents = () => {
    likedEventsPopupVisible.set(true);
    document.body.classList.add('popupVisible');
  }

  const handleLikeEvent = (event: EventProperties) => {
    toggleLikedEvent(event)
  }

  const handleEditEvent = $loginSession?.role === 'admin'
    ? (event: EventProperties) => {
      editEvent = event
      showEditEvent = true
    }
    : null

</script>

<svelte:head>
  <title>
    {event.name} {venue ? `en ${venue?.name}` : ''}
    | {formatDate(event.startDate)} 
    | Esponja
  </title>
</svelte:head>

<div class="pageHeaderWrapper">
  <PublicLogo />
  <nav id="pageNavigation">
    <EButton 
      on:click={() => showLikedEvents()}
      class="saveFilled icon"
    >
      Guardados
    </EButton>
    <ButtonLink href="/info" class="info icon">
      Info
    </ButtonLink>
  </nav>
</div>

{#if showEditEvent}
  <div in:fade class="overlay">
    <EditEvent 
      {venues}
      event={editEvent}
      on:saved={() => {
        invalidateAll();
        showEditEvent = false
        setDisplayMessage('Evento actualizado')
      }}
      on:cancel={() => showEditEvent = false}
    />
  </div>
{:else}
  {#if event}
    {#if unmoderated}
      <h2 class="unpublishedWarning">Prevista de evento no publicado</h2>
    {/if}
    <Notification {displayMessage} {setDisplayMessage} />
    <ul class="eventWrapper">
      <EventGridItem isSingle={true} {event} {venues} {handleLikeEvent} {handleEditEvent} isLiked={likedEvents.some(e => e.id === event.id)} />
    </ul>

    {#if relatedEvents.length && venue}
      <div class="relatedEventsWrapper">
        <h2>Más eventos en {venue.name}</h2>
        <ul class="relatedEvents">
          {#each relatedEvents as relatedEvent}
            <EventSummary event={relatedEvent} {venue} />
          {/each}
        </ul>
      </div>
    {/if}

  {:else}
    <!-- NOTE: should most likely never reach this point, instead the 404 page is loaded -->
    <p class="emptyList">
      <strong>No encontrado</strong><br />
      No encontramos el evento que buscas. ¿Pegaste mal el link?
    </p>

  {/if}
{/if}

<style lang="scss">
  @import "$lib/sass/variables";

  .pageHeaderWrapper {
    display: flex;
    justify-content: space-between;
  }

  .unpublishedWarning {
    text-align: center;
    border-top: 1px solid var(--colorGreen);
    margin-top: var(--spacing);
    padding-top: var(--spacing);
    margin-bottom: calc(-1 * var(--spacing));
  }
  
  #pageNavigation {
    margin-top: var(--spacing);
    padding: var(--spacing);
    display: flex;
    gap: var(--spacing);
    justify-content: flex-end;
    height: 3.25em;
  }

  .eventWrapper {
    --eventColumns: 1;
    list-style: none;
    padding: var(--spacing);
    margin: var(--double) 0 0 0;
    border-top: 1px solid var(--colorGreen);
    
    @media (min-width: $mediaM) {
      padding: 0;
    }
  }

  .relatedEventsWrapper {
    max-width: $singleEventMaxWidth;
    margin: 0 auto;
    border-top: 1px solid var(--colorGreen);
    
    @media (min-width: $singleEventMaxWidth) {
      border: 1px solid var(--colorGreen);
      border-bottom: none;
    }
    
    h2 {
      padding: var(--double) var(--spacing);
      border-bottom: 1px solid var(--colorGreen);
      font-size: var(--fsTitleBig);
    }

    ul {
      padding: 0;
      margin: 0;

      :global(li:last-child) {
        border-bottom: none;
      }
    }
  }
</style>