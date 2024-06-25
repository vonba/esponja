<script lang="ts">
	import { formatDate, formatTime } from "$lib/dateTime"
	import { getImageURL } from "$lib/file"
	import EButton from "./EButton.svelte"
	import { loginSession } from '$lib/../stores'
	import { formatDescription } from "$lib/strings"

  // Props
  export let event: EventProperties
  export let venues: [VenueProperties] | []
  export let handleEditEvent: Function | null = null
  export let handleLikeEvent: Function | null = null
  export let handleShareEvent: Function | null = null
  export let isSingle = false
  export let isLiked = false

  const venue = venues.find(v => v.id === event.venueId)
</script>

{#if event}
  <li class="eventGridItem {isSingle ? 'isSingle' : ''}">
    <a href="/event/{event.slug}">
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
          <a href="/event/{event.slug}">
            {event.name}
          </a>
        </h2>

        <div class="actions">
          {#if handleLikeEvent}
            <EButton on:click={() => handleLikeEvent(event)} class="icon {isLiked ? 'saveFilled' : 'saveOutline'}">
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
          <a href="/venue/{venue.slug}">
            {venue.name}
          </a>
        </p>
      {/if}

      {#if !venue && event.addressLine1}
        <p class="venue">
          <img src="/icon-venue-green.svg" alt="venue" />
          {event.addressLine1}<br />
          {#if event.addressLine2}{event.addressLine2}<br />{/if}
          {#if event.addressPostCode}{event.addressPostCode}<br />{/if}
        </p>
      {/if}

      {#if event.price}
        <p class="price">
          ${event.price}
          {#if event.priceMax} – ${event.priceMax}{/if}
        </p>
      {/if}

      <div class="description">
        <p>{@html formatDescription(event.description)}</p>
      </div>

      {#if event.ticketLink}
        <p class="ticketLink flex alignCenter">
          <img src="/icon-ticket-green.svg" alt="Entrada" />
          <a href={event.ticketLink}>Comprar boletos</a>
        </p>
      {/if}
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

  .ticketLink,
  .price {
    display: none;
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
  
  .description {
    display: none;
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


  
  // Viewing single event
  .eventGridItem.isSingle {
    max-width: $singleEventMaxWidth;
    padding: 0;

    // Show border above min-width
    @media (min-width: $singleEventMaxWidth) {
      border-right: 1px solid var(--colorGreen);
      border-left: 1px solid var(--colorGreen);
    }
    
    // Show as columns
    @media (min-width: $mediaM) {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--double);
      margin: 0 auto;
    }

    .description,
    .ticketLink,
    .price {
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
      margin-bottom: var(--double);
    }
  }
</style>