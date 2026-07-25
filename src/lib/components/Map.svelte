<script lang="ts">
  import { onMount } from 'svelte';
	import { PUBLIC_GOOGLE_API_KEY } from "$env/static/public"
  import { Loader } from '@googlemaps/js-api-loader';

  export let address: string
  export let title: string

  // Bindings
  let mapElement: HTMLElement;

  onMount(async function () {
    // Create loader
    const loader = new Loader({
      apiKey: PUBLIC_GOOGLE_API_KEY,
      version: 'weekly',
    });

    // Load libraries
    let libraries: any = null;
    async function loadLibraries() {
      if (!libraries) {
        libraries = await Promise.all([
          loader.importLibrary('maps'),
          loader.importLibrary('marker'),
          loader.importLibrary('geocoding'),
        ]);
      }
      return libraries;
    }
    const [{ Map }, { AdvancedMarkerElement }, { Geocoder }] = await loadLibraries();

    const map = new Map(mapElement,  {
      zoom: 16,
      mapId: "ESPONJA_MAP", // Map ID is required for advanced markers.
    });

    const geocoder = new Geocoder()

    await geocoder.geocode( { 'address': address}, function(results: any, status: string) {
      if (status == 'OK') {
        map.setCenter(results[0].geometry.location);
        var marker = new AdvancedMarkerElement({
            map: map,
            title,
            position: results[0].geometry.location
        });
      } else {
        // alert('Geocode was not successful for the following reason: ' + status);
      }
    });

  }) // end onMount

</script>

<div class="map">
  <div class="mapContainer" bind:this={mapElement}>
  </div>
</div>

<style lang="scss">
  @use "$lib/sass/variables" as *;

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