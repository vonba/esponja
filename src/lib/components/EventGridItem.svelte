<script lang="ts">
	import { formatDate, formatTime } from "$lib/dateTime"
	import { getImageURL } from "$lib/file"
	import EButton from "./EButton.svelte"
	import Notification from "./Notification.svelte"
	import { fade } from "svelte/transition"
	import { capitalizeFirstChar, descriptionParts, safeHttpUrl } from "$lib/strings"
	import { loginSession } from "../../stores"

  // Props
  export let event: EventProperties
  export let venues: [VenueProperties] | []
  export let handleEditEvent: Function | null = null
  export let handleDeleteEventPermanently: Function | null = null
  export let isSingle = false

  // Observables
  let user: User;
  loginSession.subscribe(value => {
    user = value;
  });
  // For contributors, only allow editing own events
  const allowEdit = user?.role !== 'contributor' || user?.id === event.userId

  const isMultiDay = event.endDate && event.endDate !== event.startDate

  const venue = venues.find(v => v.id === event.venueId)

  // Unpublished events only appear in the admin panel, and open as a logged-in preview
  $: eventPath = `/evento/${event.slug}${event.published ? '' : '?preview'}`

  // XSS guard: the ticket link is typed in by whoever submitted the event. Only an http(s)
  // URL becomes a link, so a stored javascript: URL can never run when someone clicks it.
  // (The API also rejects such links on save, see sanitizeEventText in $lib/server/events.)
  $: ticketHref = safeHttpUrl(event.ticketLink)

  // Share
  let shareMessage = ''
  const clearShareMessage = (msg: string) => { shareMessage = msg }
  const shareEvent = async () => {
    const url = `${window.location.origin}/evento/${event.slug}`
    const isMobile = window.matchMedia('(pointer: coarse)').matches
    if (isMobile && navigator.share) {
      try { await navigator.share({ title: event.name, url }) } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      shareMessage = 'Link copiado'
      setTimeout(() => shareMessage = '', 2000)
    }
  }
</script>

{#if event}
  <li class="eventGridItem {isSingle ? 'isSingle' : ''}">
    <a href={eventPath}>
      <div class="imageWrapper">
        {#if event.imageKeySmall && event.imageKeyLarge}
        
        <img 
          loading="lazy"
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
          <a href={eventPath}>
            {event.name}
          </a>
        </h2>

        {#if shareMessage}
          <div class="shareNotification" out:fade>
            <Notification displayMessage={shareMessage} setDisplayMessage={clearShareMessage} />
          </div>
        {/if}
        <div class="actions">
          <EButton on:click={shareEvent} class="icon share">
            Compartir
          </EButton>
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
      </header>

      {#if event.author}
        <p class="author">
          <i>
            Publicado por {event.author}
            {#if event.submitterName}
              <br />
              Creado por colaborador externo {event.submitterName} ({event.submitterEmail})
            {/if}
          </i>
        </p>
      {/if}

      <div class="price mb">
        {#if event.price}
          ${Math.floor(event.price)}
          {#if event.priceMax} – ${Math.floor(event.priceMax)}{/if}
        {:else}
          Entrada libre
        {/if}
      </div>

      <div class="datesWrapper">
        <img src="/icon-date-green.svg" alt="calendar" />
        <div class="dates">
          {#if event.startDate}
            {#if event.endDate && isMultiDay}De {/if}
            {capitalizeFirstChar(formatDate(event.startDate))}
          {/if} 
          {#if event.startTime}{formatTime(event.startTime)}{/if}
          {#if event.endDate && isMultiDay}<br />A {capitalizeFirstChar(formatDate(event.endDate))}{/if}
          {#if event.endTime}
            {#if !event.endDate || !isMultiDay} – {/if}
            {formatTime(event.endTime)}
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
        <div class="venue">
          <img src="/icon-venue-green.svg" alt="venue" />
          <div class="address">
            <span>{event.addressLine1}</span>
            {#if event.addressLine2}<span>{event.addressLine2}</span>{/if}
            {#if event.addressPostCode}<span>{event.addressPostCode}</span>{/if}
          </div>
        </div>
      {/if}

      <!-- XSS guard: the description is user input, so it is never rendered with {@html}.
           descriptionParts() splits it into text, links and line breaks, and Svelte escapes
           each piece. Kept on one line so no stray whitespace ends up between the pieces. -->
      <div class="description">
        <p><strong>Acerca del evento</strong></p>
        <p>{#each descriptionParts(event.description) as part}{#if part.kind === 'link'}<a href={part.href} target="_blank" rel="noopener noreferrer">{part.text}</a>{:else if part.kind === 'lineBreak'}<br />{:else}{part.text}{/if}{/each}</p>
      </div>

      {#if ticketHref}
        <p class="ticketLink flex alignCenter">
          <img src="/icon-ticket-green.svg" alt="Entrada" />
          <a href={ticketHref}>Comprar boletos</a>
        </p>
      {/if}
    </div>
  </li>
{/if}

<style lang="scss">
  @use "$lib/sass/variables" as *;

  h2 a {
    text-decoration: none;

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background-color: var(--colorGreen);
        color: var(--colorOffWhite);
      }
    }
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

  .ticketLink {
    display: none;
  }

  .actions {
    display: flex;
    gap: var(--spacing);
  }
  
  .description {
    display: none;
  }

  .imageWrapper {
    height: calc(100vw / var(--eventColumnsGrid) - var(--spacing) * var(--eventColumnsGrid));
    width: 100%;
    border-radius: var(--borderRadius);
    overflow: hidden;
    background-color: var(--colorGreen);
    margin-bottom: var(--spacing);
    transition: border 0.25s;

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        border: 2px solid var(--colorGreen);
      }
    }

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
      margin-top: 2px;
    }
  }

  // Add separators between address components when they're on a single line
  .address span:not(:first-of-type)::before {
    display: inline;
    content: '/ ';
  }
  
  .shareNotification {
    position: fixed;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--colorOffWhite);
    border: 1px solid var(--colorGreen);
    border-radius: var(--borderRadius);
    z-index: 100;
    padding: var(--spacing) 4rem;
  }

  // ====== Viewing single event ======
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

    // Put address components on separate lines
    .address {
      span {
        display: block;

        // Remove line separators
        &:not(:first-of-type)::before {
          display: none;
        }
      }
    }

    .description,
    .price {
      display: block;
    }

    .description {
      margin-top: 40px;
      text-align: justify;
    }

    .ticketLink {
      display: flex;
    }
    
    .contentWrapper {
      padding: var(--spacing);
      padding-left: 0;
    }

    .imageWrapper {
      height: auto;
      border-radius: 0;
      margin-bottom: 0;
      background-color: transparent;
      padding: var(--spacing);

      @media (max-width: $mediaM) {
        padding: 0;
      }

      &:hover {
        border: none;
      }
      
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