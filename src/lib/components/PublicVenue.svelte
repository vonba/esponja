<script lang="ts">
	import EventSummary from "./EventSummary.svelte"
	import Map from "./Map.svelte"

  export let venue: VenueProperties
  export let events: [EventProperties] | []
</script>

<div class="venueHeader">
  <img src="/icon-venue-green.svg" alt="Foro" />
  <h2>
    {venue.name}
  </h2>
</div>

{#if venue.addressline1}
  <div class="address">
    {venue.addressline1}
    {#if venue.addressline2}
      <br />
      {venue.addressline2}
    {/if}
  </div>
{/if}

<div class="publicVenue">
  
  <div class="map">
    {#if venue.addressline1}  
      <Map {venue} />
    {/if}
  </div>

  <div class="eventsWrapper">
    <h2>Eventos en {venue.name}</h2>

    <ul class="events">
      {#if events.length}
        {#each events as event}
          <EventSummary {event} {venue} />
        {/each}
      {/if}
    </ul>
  </div>
  
</div>

<style lang="scss">
  @import "$lib/sass/variables";

  .venueHeader {
    padding: var(--spacing);
    margin-top: 20px;
    display: flex;
    align-items: center;
    gap: var(--spacing);
    
    img {
      height: var(--fsTitleBig);
      /* margin-top: -5px; */
    }
    
    h2 {
      font-size: var(--fsTitleBig);
      margin-bottom: 0;
    }
  }

  .publicVenue {
    @media (min-width: $mediaM) {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing);
    }    
  }

  .map {
    padding: var(--spacing);
    padding-top: 0;
  }

  .events {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .eventsWrapper {
    h2 {
      padding: calc(2 * var(--spacing)) 0;
      border-top: 1px solid var(--colorGreen);
      border-bottom: 1px solid var(--colorGreen);
      font-size: var(--fsTitleMedium);

      @media (max-width: $mediaM) {
        padding-left: var(--spacing);
        padding-right: var(--spacing);
      }
    }
  }

  .address {
    padding: var(--spacing);
    padding-top: 0;
    font-size: var(--fsTitleMedium);
  }
</style>