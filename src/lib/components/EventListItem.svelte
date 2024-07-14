<script lang="ts">
	import { formatDate, formatDateShort, formatTime } from "$lib/dateTime"
	import { getImageURL } from "$lib/file"
	import { capitalizeFirstChar } from "$lib/strings"
	import { loginSession } from "../../stores"
  import EButton from "./EButton.svelte"
  
  // Props
  export let event: EventProperties
  export let venues: [VenueProperties] | []
  export let handleEditEvent: Function | null = null
  export let handleLikeEvent: Function | null = null
  export let handleDeleteEventPermanently: Function | null = null
  export let isLiked = false

  // Observables
  let user: User;
  loginSession.subscribe(value => {
    user = value;
  });
  // For contributors, only allow editing own events
  const allowEdit = user?.role !== 'contributor' || user?.id === event.userId

  const isMultiDay = event.endDate && event.endDate !== event.startDate

  const venue = venues.find(v => v.id === event.venueId)
</script>

<li class="eventListItem">
  <div class="contentWrapper">
    <h2>
      <a href="/evento/{event.slug}">{event.name}</a>
    </h2>

    <div class="price mb">
      {#if event.price}
        ${Math.floor(event.price)}
        {#if event.priceMax} – ${Math.floor(event.priceMax)}{/if}
      {:else}
        Entrada libre
      {/if}
    </div>

    <div class="datesWrapper">
      <img src="/icon-date-green.svg" alt="Fecha" />
      <div class="dates">
        {#if event.startDate}
          {#if event.endDate && isMultiDay}De {/if}
          {capitalizeFirstChar(formatDate(event.startDate))}
        {/if} 
        {#if event.startTime}<span class="time">{formatTime(event.startTime)}</span>{/if}
        {#if event.endDate && isMultiDay}<br />A {capitalizeFirstChar(formatDate(event.endDate))}{/if}
        {#if event.endTime}
          <span class="time end">
            {#if !event.endDate || !isMultiDay} – {/if}
            {formatTime(event.endTime)}
          </span>
        {/if}
      </div>
    </div>

    {#if venue}
      <p class="venue">
        <img src="/icon-venue-green.svg" alt="venue" />
        <a href="/foro/{venue.slug}">
          {venue.name}
        </a>
      </p>
    {/if}

    {#if !venue && event.addressLine1}
      <p class="venue">
        <img src="/icon-venue-green.svg" alt="venue" />
        {event.addressLine1}
      </p>
    {/if}
    
    <div class="actions">
      {#if handleLikeEvent}
        <EButton on:click={() => handleLikeEvent(event)}  class="icon {isLiked ? 'saveFilled' : 'saveOutline'}">
          Guardar
        </EButton>
      {/if}
      {#if handleDeleteEventPermanently}
        <EButton on:click={() => handleDeleteEventPermanently(event)} class="icon delete">
          Borrar
        </EButton>
      {/if}
      {#if handleEditEvent && allowEdit}
        <EButton on:click={() => handleEditEvent(event)} class="icon edit">
          Modificar
        </EButton>
      {/if}
    </div>
  </div>

  <a href="/evento/{event.slug}">
    <div class="imageWrapper">
      {#if event.imageKeySmall && event.imageKeyLarge}
      
      <img 
        loading="lazy"
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

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background-color: var(--colorGreen);
        color: var(--colorOffWhite);
      }
    }
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

    @media (max-width: $mediaM) {
      border-bottom: 1px solid var(--colorGreen);
    }

    @media (min-width: $mediaL) {
      --itemHeight: 200px;
    }
  }

  .imageWrapper {
    width: 100%;
    height: 100%;
    min-height: calc(var(--itemHeight) - var(--spacing));
    border-radius: var(--borderRadius);
    overflow: hidden;
    background-color: var(--colorGreen);

    img {
      object-fit: cover;
      object-position: top;
      height: 100%;
      width: 100%;

      @media (hover: hover) and (pointer: fine) {
        &:hover {
          border: 2px solid var(--colorGreen);
        }
      }
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

  .venue {
    @media (max-width: $mediaS) {
      margin-bottom: 35px;
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

  .time {
    @media (max-width: $mediaS) {
      display: none;
    }
  }
</style>