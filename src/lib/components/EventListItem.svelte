<script lang="ts">
	import { formatDate, formatTime } from "$lib/dateTime"
	import { getImageURL } from "$lib/file"
	import { formatDescription } from "$lib/strings"
  import EButton from "./EButton.svelte"
  
  export let event: EventProperties
  export let venues: [VenueProperties] | []
  export let handleDisableEvent: Function | null = null
  export let handleEditEvent: Function | null = null
  export let handleLikeEvent: Function | null = null
  export let handleShareEvent: Function | null = null
  export let isLiked = false

  const venue = venues.find(v => v.id === event.venueId)
</script>

<li class="eventListItem">
  <div class="contentWrapper">
    <h2>
      <a href="/event/{event.slug}">{event.name}</a>
    </h2>

    <div class="datesWrapper">
      <img src="/icon-date-green.svg" alt="Fecha" />
      <div class="dates">
        {#if event.startDate}{formatDate(event.startDate)}{/if}{#if event.startTime}, {formatTime(event.startTime)}{/if}
      </div>
    </div>

    <p class="venue">
      <img src="/icon-venue-green.svg" alt="Foro" />
      <a href="/venue/{venue?.slug}">
        {venue?.name}
      </a>
    </p>

    <div class="description">
      <p>{@html formatDescription(event.description)}</p>
    </div>
    
    <div class="actions">
      {#if handleLikeEvent}
      <EButton on:click={() => handleLikeEvent(event)}  class="icon {isLiked ? 'saveFilled' : 'saveOutline'}">
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

  <a href="/event/{event.slug}">
    <div class="imageWrapper">
      {#if event.imageKeySmall && event.imageKeyLarge}
      
      <img 
        src={getImageURL(event.imageKeySmall)} 
        sizes="(max-width: 600px) 30vw, (max-width: 1200px) 30vw, 1200px"
        srcset="{getImageURL(event.imageKeySmall)} 400w, {getImageURL(event.imageKeyLarge)} 1200w"
        alt="Imagen del evento" 
      />
      {/if}
    </div>
  </a>
</li>

<style lang="scss">
  @import "$lib/sass/variables";

  h2 a {
    text-decoration: none;
  }

  h2 {
    font-size: var(--fsTitleMedium);
    margin-bottom: var(--spacing);

    @media (min-width: $mediaL) {
      font-size: var(--fsTitleBig);
    }
  }

  .eventListItem {
    --itemHeight: 150px;

    padding: var(--spacing);
    display: grid;
    grid-template-columns: 1fr minmax(100px, 33%);
    gap: var(--spacing);
    min-height: calc(var(--itemHeight) + var(--spacing));
    border-bottom: 1px solid var(--colorGreen);

    @media (min-width: $mediaL) {
      --itemHeight: 25vw;
    }
  }
  
  .description {
    @media (max-width: $mediaL) {
      display: none;
    }
  }

  .imageWrapper {
    min-height: calc(var(--itemHeight) - var(--spacing));
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
    margin-bottom: var(--spacing);

    img {
      margin-top: 3px;
    }
  }

  .dates::first-letter {
    text-transform: capitalize;
  }

  .actions {
    position: absolute;
    right: 0;
    bottom: 0;
    display: flex;
    gap: var(--spacing);
  }
</style>