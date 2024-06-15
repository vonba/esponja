<script lang="ts">
	import { formatDate, formatTime } from "$lib/dateTime"
	import { getImageURL } from "$lib/file"
	import EButton from "./EButton.svelte"
	import { loginSession } from '$lib/../stores'
	import { formatDescription } from "$lib/strings"

  // Props
  export let event: EventProperties
  export let venues: [VenueProperties] | []
  export let handleDisableEvent: Function | null = null
  export let handleEditEvent: Function | null = null
  export let handleLikeEvent: Function | null = null
  export let handleShareEvent: Function | null = null
  export let isSingle = false

  const venue = venues.find(v => v.id === event.venueId)

  let user;
  loginSession.subscribe(value => {
    user = value;
  });
</script>

{#if event}
  <li class="eventGridItem {isSingle ? 'isSingle' : ''}">
    <a href="/event/{event.id}">
      <div class="imageWrapper">
        {#if event.imageKeySmall && event.imageKeyLarge}
        
        <img 
          src={getImageURL(event.imageKeySmall)} 
          sizes="(max-width: 500px) 100vw, (max-width: 600px) 30vw, (max-width: 1200px) 30vw, 1200px"
          srcset="{getImageURL(event.imageKeySmall)} 400w, {getImageURL(event.imageKeyLarge)} 1200w"
          alt="Imagen del evento" 
        />
        {/if}
      </div>
    </a>

    <div class="contentWrapper">
      <header>
        <h2>
          <a href="/event/{event.id}">
            {event.name}
          </a>
        </h2>

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
      </header>

      <div class="datesWrapper">
        <img src="/icon-date-green.svg" alt="calendar" />
        <div class="dates">
          {#if event.startDate}{formatDate(event.startDate)}{/if} 
          {#if event.startTime}{formatTime(event.startTime)}{/if}
          {#if event.endDate && event.endDate !== event.startDate}<br />{formatDate(event.endDate)}{/if}
          {#if event.endTime}
            {#if !event.endDate || event.endDate === event.startDate} – {/if}
            {formatTime(event.endTime)}
          {/if}
        </div>
      </div>

      {#if venue}
        <p class="venue">
          <img src="/icon-venue-green.svg" alt="venue" />
          <a href="/venue/{venue.id}">
            {venue.name}
          </a>
        </p>
      {/if}

      <div class="description">
        <p>{@html formatDescription(event.description)}</p>
      </div>
    </div>
  </li>
{/if}

<style lang="scss">
  @import "$lib/sass/variables";

  h2 a {
    text-decoration: none;
  }

  header {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing);

    h2 {
      font-size: var(--fsTitleMedium);
      margin-bottom: var(--spacing);
  
      @media (min-width: $mediaM) {
        font-size: var(--fsTitleBig);
      }
    }
  }

  .actions {
    display: flex;
    gap: var(--spacing);
    
    :global(button) {
      height: 2em;
    }
  }

  .eventGridItem {
    padding: var(--spacing);
  }

  .imageWrapper {
    height: calc(100vw / var(--eventColumns) - var(--spacing) * var(--eventColumns));
    width: 100%;
    border-radius: var(--borderRadius);
    overflow: hidden;
    background-color: var(--colorGreen);
    margin-bottom: var(--spacing);

    img {
      object-fit: cover;
      object-position: center top;
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
    align-items: flex-start;
    gap: var(--spacing);
    margin-bottom: var(--spacing);

    img {
      margin-top: 3px;
    }
  }

  .description {
    display: none;
  }
  
  // Viewing single event
  .eventGridItem.isSingle {
    max-width: $singleEventMaxWidth;
    padding: 0;

    // Show border above min-width
    @media (min-width: $singleEventMaxWidth) {
      border-right: 1px solid var(--colorGreen);
      border-left: 1px solid var(--colorGreen);
    }
    
    // Show as columns above 600px (non-standard breakpoint)
    @media (min-width: 600px) {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: calc(2 * var(--spacing));
      margin: 0 auto;
    }
    
    .description {
      display: block;
    }
    
    .contentWrapper {
      padding: var(--spacing);
      padding-left: 0;
    }

    .imageWrapper {
      height: auto;
      border-radius: 0;
      margin-bottom: 0;
      padding: var(--spacing);
      background-color: transparent;
      
      img {
        object-fit: initial;
        width: 100%;
        height: auto;
        float: left;
        border-radius: var(--borderRadius);
      }
    }

    .actions {
      position: relative;
      margin-bottom: calc(2 * var(--spacing));
    }
  }
</style>