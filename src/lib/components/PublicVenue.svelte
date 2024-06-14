<script lang="ts">
	import Map from "./Map.svelte"
	import PublicEvents from "./PublicEvents.svelte"

  export let venue: VenueProperties
</script>

<div class="publicVenue">
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

    <div class="map">
      <Map {venue} />
    </div>
  {/if}
  
</div>

<style lang="scss">
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

  .address {
    padding: var(--spacing);
    padding-top: 0;
    font-size: var(--fsTitleMedium);
  }
</style>