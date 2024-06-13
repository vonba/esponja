<script lang="ts">
	import { formatDate, formatTime } from "$lib/dateTime"
	import { getImageURL } from "$lib/file"
  import EButton from "./EButton.svelte"
  
  export let event: EventProperties
  export let venues: [VenueProperties] | []
  export let handleDisableEvent: Function | null = null
  export let handleEditEvent: Function | null = null
  export let handleLikeEvent: Function | null = null
  export let handleShareEvent: Function | null = null

  const venue = venues.find(v => v.id === event.venueId)
</script>

<li class="eventListItem">
  <div class="contentWrapper">
    <h2>{event.name}</h2>

    <div class="datesWrapper">
      <img src="/icon-date-green.svg" alt="calendar" />
      <div class="dates">
        {#if event.startDate}{formatDate(event.startDate)}{/if}{#if event.startTime}, {formatTime(event.startTime)}{/if}
      </div>
    </div>

    <div class="venue">
      <img src="/icon-venue-green.svg" alt="venue" />
      {venue?.name}
    </div>
    
    <div class="actions">
      {#if handleLikeEvent}
      <EButton on:click={() => handleLikeEvent(event.id)} class="icon saveOutline">
        Guardar
        </EButton>
      {/if}
      {#if handleShareEvent}
        <EButton on:click={() => handleShareEvent(event.id)} class="icon share">
          Compartir
        </EButton>
      {/if}
      {#if handleEditEvent}
        <EButton on:click={() => handleEditEvent(event)} class="icon edit">
          Modificar
        </EButton>
      {/if}
      {#if handleDisableEvent}
        <EButton on:click={() => handleDisableEvent(event.id) } class="icon delete">
          Ocultar
        </EButton>
      {/if}
    </div>
  </div>

  <div class="imageWrapper">
    {#if event.imageKeySmall}
      <img src={getImageURL(event.imageKeySmall)} alt="Imagen del evento" />
    {/if}
  </div>
</li>

<style lang="scss">
  h2 {
    font-size: var(--fsTitleMedium);
    margin-bottom: 0;
  }

  .eventListItem {
    margin-bottom: var(--spacing);
    display: grid;
    grid-template-columns: 1fr minmax(100px, 33%);
    gap: var(--spacing);
    border-top: 1px solid var(--colorGreen);
    padding-top: var(--spacing);
    height: calc(150px + var(--spacing));
  }

  .imageWrapper {
    height: 100%;
    width: 100%;
    border-radius: var(--borderRadius);
    overflow: hidden;
    background-color: var(--colorGreen);

    img {
      object-fit: cover;
      object-position: top;
      height: 100%;
      width: 100%;
    }
  }

  .contentWrapper {
    position: relative;
  }

  .venue,
  .datesWrapper {
    display: flex;
    align-items: center;
    gap: var(--spacing);
  }

  .dates::first-letter {
    text-transform: capitalize;
  }

  .actions {
    position: absolute;
    right: 0;
    bottom: 0;
  }
</style>