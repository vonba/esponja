<script lang="ts">
	import { formatDate, formatTime } from "$lib/dateTime"
	import { getImageURL } from "$lib/file"
  
  export let event: EventProperties
  export let venue: VenueProperties
</script>

<li class="eventSummary">
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
  </div>

  <a href="/event/{event.slug}">
    <div class="imageWrapper">
      {#if event.imageKeySmall && event.imageKeyLarge}
      
      <img 
        src={getImageURL(event.imageKeySmall)} 
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
  }

  .eventSummary {
    --itemHeight: 175px;

    padding: var(--spacing);
    display: grid;
    grid-template-columns: 1fr minmax(100px, 33%);
    gap: var(--spacing);
    height: calc(var(--itemHeight) + var(--spacing));
    border-bottom: 1px solid var(--colorGreen);
  }

  .imageWrapper {
    height: calc(var(--itemHeight) - var(--spacing));
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
</style>