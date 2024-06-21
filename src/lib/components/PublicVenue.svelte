<script lang="ts">
	import EventSummary from "./EventSummary.svelte"
	import Map from "./Map.svelte"

  export let venue: VenueProperties
  export let events: [EventProperties] | []
</script>


<div class="publicVenue">
  
  <div class="map">
    <div class="venueHeader">
      <img src="/icon-venue-green.svg" alt="Foro" />
      <h2>
        {venue.name}
      </h2>
    </div>

    {#if venue.addressline1}  
      <Map {venue} />

      <div class="address">
        <strong>Dirección</strong><br />
        {venue.addressline1}
        {#if venue.addressline2}
          <br />
          {venue.addressline2}
        {/if}
      </div>
    {/if}
  </div>

  <div class="eventsWrapper">
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
    /* padding-top: calc(2 * var(--spacing)); */
    margin: var(--spacing) 0;
    display: flex;
    align-items: center;
    gap: var(--spacing);
    /* border-top: 1px solid var(--colorGreen); */

    img {
      height: var(--fsTitleBig);
      /* margin-top: -5px; */
    }
    
    h2 {
      font-size: var(--fsTitleBig);
      margin-bottom: 0;
    }
  }

  .map {
    padding: var(--spacing);
    padding-top: 0;
    border: 1px solid var(--colorGreen);
    border-radius: var(--borderRadius);
    margin: var(--spacing);
  }

  .events {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .address {
    padding-top: 0;
    margin-top: var(--spacing);
    font-size: var(--fsTitleMedium);
    text-align: right;
  }

  .publicVenue {
    @media (min-width: $mediaL) {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing);

      .events {
        margin-top: 20px;
      }
    }    
  }
</style>