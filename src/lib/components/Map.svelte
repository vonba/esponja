<script lang="ts">
  import { onMount } from 'svelte';
	import { PUBLIC_GOOGLE_API_KEY } from "$env/static/public"

  export let venue: VenueProperties

  let mapContainer: HTMLDivElement;

  onMount(() => {
    // Load Google Maps API script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${PUBLIC_GOOGLE_API_KEY}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      initMap();
    };
  });

  function initMap() {
    const address = `${venue.addressline1}, ${venue.addressline2 ? venue.addressline2 + ', ' : ''}${venue.city}, Mexico`;

    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const map = new google.maps.Map(mapContainer, {
          center: results[0].geometry.location,
          zoom: 15,
        });

        new google.maps.Marker({
          position: results[0].geometry.location,
          map: map,
          title: venue.addressline1,
        });
      } else {
        console.error('Geocode was not successful for the following reason: ' + status);
      }
    });
  }
</script>

<div class="map">
  <div class="mapContainer" bind:this={mapContainer}>
  </div>
</div>

<style lang="scss">
  @import "$lib/sass/variables";

  .map {
    padding: var(--spacing);
  }

  .mapContainer {
    border-radius: var(--borderRadius);
    background-color: var(--colorGreen);
    overflow: hidden;
    height: 80vw;

    @media (min-width: $mediaL) {
      height: 60vh;
    }
  }
</style>