<script lang="ts">
	import EventSummary from "./EventSummary.svelte"
	import Map from "./Map.svelte"

  export let venue: VenueProperties
  export let events: [EventProperties] | []
</script>


<div class="publicVenue {events.length ? '' : 'noEvents'}">
  
  <div class="mapWrapper">
    <div class="venueHeader">
      <img src="/icon-venue-green.svg" alt="Foro" />
      <h2>
        {venue.name}
      </h2>
    </div>

    <div class="address">
      {venue.addressline1}
      {#if venue.addressline2}
        , {venue.addressline2}
      {/if}
    </div>

    {#if venue.addressline1}  
      <Map title={venue.addressline1} address={`${venue.name}, ${venue.addressline1}, ${venue.addressline2 ? venue.addressline2 + ', ' : ''}${venue.city}, Mexico`} />
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
    margin: var(--spacing) 0;
    display: flex;
    align-items: center;
    gap: var(--spacing);

    img {
      height: var(--fsTitleBig);
    }
    
    h2 {
      font-size: var(--fsTitleBig);
      margin-bottom: 0;
    }
  }

  .mapWrapper {
    margin: var(--spacing);
  }

  :global(.map) {
    border-radius: var(--borderRadius);
  }

  .events {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .address {
    padding-top: 0;
    margin: var(--spacing) 0;
  }

  .publicVenue {
    border-top: 1px solid var(--colorGreen);
    margin-top: var(--spacing);

    @media (min-width: $mediaL) {
      &:not(.noEvents) {
        display: grid;
        grid-template-columns: 1fr 1fr;
        /* gap: var(--spacing); */
  
        .events {
          padding-top: var(--spacing);
          padding-right: var(--spacing);
        }
        
        .mapWrapper {
          border-right: 1px solid var(--colorGreen);
          margin: 0 var(--spacing);
          padding: var(--spacing) 0;          
          padding-right: var(--spacing);
        }
      }
    }    
  }
</style>