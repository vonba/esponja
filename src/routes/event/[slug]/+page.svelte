<script lang="ts">
	import { beforeNavigate, goto, invalidateAll } from "$app/navigation"
	import ButtonLink from "$lib/components/ButtonLink.svelte"
	import EButton from "$lib/components/EButton.svelte"
	import EditEvent from "$lib/components/EditEvent.svelte"
	import EventGridItem from "$lib/components/EventGridItem.svelte"
  import PublicLogo from "$lib/components/PublicLogo.svelte"
	import { fade } from "svelte/transition"
	import { likedEventsPopupVisible, loginSession } from "../../../stores"
	import { formatDate } from "$lib/dateTime"
	import EventSummary from "$lib/components/EventSummary.svelte"

  export let data: SingleEventPageData
  let venues, event, relatedEvents, venue
  $: venues = data.venues
  $: event = data.event.event
  $: relatedEvents = data.event.relatedEvents
  $: venue = venues.find(v => v.id === event?.venueId)

  // State
  let showEditEvent = false
  let editEvent: EventProperties | null = null
  
  const showLikedEvents = () => {
    likedEventsPopupVisible.set(true);
    document.body.classList.add('popupVisible');
  }

  const handleLikeEvent = (eventId: number) => {
    // TODO: add event to cookie
    console.log('like with id ' + eventId)
  }

  const handleEditEvent = $loginSession?.role === 'admin'
    ? (event: EventProperties) => {
      editEvent = event
      showEditEvent = true
    }
    : null

</script>

<svelte:head>
  <title>{event 
    ? `${event.name} el ${formatDate(event.startDate)} ${venue ? `en ${venue?.name}` : ''}` 
    : 'No encontrado'}
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
      }}
      on:cancel={() => showEditEvent = false}
    />
  </div>
{:else}
  {#if event}
    <ul class="eventWrapper">
      <EventGridItem isSingle={true} {event} {venues} {handleLikeEvent} {handleEditEvent} />
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
    margin: calc(2 * var(--spacing)) 0 0 0;
    border-top: 1px solid var(--colorGreen);
    
    @media (min-width: $mediaM) {
      padding: 0;
    }
  }

  .relatedEventsWrapper {
    max-width: $singleEventMaxWidth;
    margin: 0 auto;
    
    @media (min-width: $singleEventMaxWidth) {
      border: 1px solid var(--colorGreen);
      border-bottom: none;
    }
    
    h2 {
      padding: calc(2 * var(--spacing)) var(--spacing);
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