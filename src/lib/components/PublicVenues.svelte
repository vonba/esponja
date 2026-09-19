<script lang="ts">
	import { fade } from "svelte/transition"

  // Props
  export let venues: VenueProperties[] = []
  export let searchString = ''

  // Filter venues by name and address
  $: filteredVenues = venues.filter(venue => searchString === '' || venueMatchesSearch(venue, searchString))

  const venueMatchesSearch = (venue: VenueProperties, searchString: string) => {
    const search = searchString.toLowerCase()
    return [venue.name, venue.addressline1, venue.addressline2]
      .some(value => value?.toLowerCase().includes(search))
  }
</script>

<div class="publicVenues" in:fade>
  <ul class="venues">
    {#each filteredVenues as venue (venue.id)}
      <li class="venueCard">
        <h2>
          <a href="/foro/{venue.slug}">
            {venue.name}
          </a>
        </h2>

        {#if venue.addressline1 || venue.addressline2 || venue.postcode}
          <div class="venue">
            <img src="/icon-venue-green.svg" alt="Dirección" />
            <div class="address">
              {#if venue.addressline1}<span>{venue.addressline1}</span>{/if}
              {#if venue.addressline2}<span>{venue.addressline2}</span>{/if}
              {#if venue.postcode}<span>{venue.postcode}</span>{/if}
            </div>
          </div>
        {/if}
      </li>
    {/each}
  </ul>

  {#if !filteredVenues.length}
    <p class="emptyList">
      {#if searchString}
        No encontramos ningún foro con “{searchString}”
      {:else}
        No hay ningún foro por el momento
      {/if}
    </p>
  {/if}
</div>

<style lang="scss">
  @use "$lib/sass/variables" as *;

  ul.venues {
    list-style: none;
    margin: 0 auto;
    padding: var(--spacing);
    max-width: 800px;
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--double);
  }

  .venueCard {
    border: 1px solid var(--colorGreen);
    border-radius: var(--borderRadius);
    box-shadow: 2px 2px 0 var(--colorGreen);
    padding: var(--spacing) var(--double);

    h2 {
      font-size: var(--fsTitleMedium);
      margin: var(--spacing) 0;

      @media (min-width: $mediaM) {
        font-size: var(--fsTitleBig);
      }
    }

    h2 a {
      text-decoration: none;

      @media (hover: hover) and (pointer: fine) {
        &:hover {
          background-color: var(--colorGreen);
          color: var(--colorOffWhite);
        }
      }
    }
  }

  .venue {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing);
    margin-bottom: var(--spacing);

    img {
      margin-top: 2px;
    }
  }

  // Separators between address components on a single line
  .address span:not(:first-of-type)::before {
    display: inline;
    content: '/ ';
  }
</style>
