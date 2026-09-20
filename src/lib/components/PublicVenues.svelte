<script lang="ts">
	import { fade } from "svelte/transition"
	import { formatDateShort, formatTime } from "$lib/dateTime"
	import { getImageURL } from "$lib/file"

  // Props
  export let venues: VenueProperties[] = []
  export let events: EventProperties[] = []
  export let searchString = ''

  // Upcoming events per venue, in the order the API returns them (soonest first), so the
  // card can summarise what's coming up next.
  $: eventsByVenue = events.reduce((byVenue, event) => {
    if (!event.venueId) return byVenue
    byVenue.set(event.venueId, [...(byVenue.get(event.venueId) || []), event])
    return byVenue
  }, new Map<number, EventProperties[]>())

  // Filter venues by name and address
  $: filteredVenues = venues.filter(venue => searchString === '' || venueMatchesSearch(venue, searchString))

  // Venues with nothing coming up go in their own section, below the active ones
  $: venuesWithEvents = filteredVenues.filter(venue => eventsByVenue.get(venue.id)?.length)
  $: venuesWithoutEvents = filteredVenues.filter(venue => !eventsByVenue.get(venue.id)?.length)

  const venueMatchesSearch = (venue: VenueProperties, searchString: string) => {
    const search = searchString.toLowerCase()
    return [venue.name, venue.addressline1, venue.addressline2]
      .some(value => value?.toLowerCase().includes(search))
  }
</script>

<div class="publicVenues" in:fade>
  {#each [
    { title: 'Con eventos próximos', venues: venuesWithEvents },
    { title: 'Sin eventos próximos', venues: venuesWithoutEvents }
  ] as section (section.title)}
    {#if section.venues.length}
      <section class="venueSection">
        <h2>{section.title}</h2>

        <ul class="venues">
          {#each section.venues as venue (venue.id)}
            {@const nextEvent = eventsByVenue.get(venue.id)?.[0]}
            <li class="venueCard">
              <h3>
                <a href="/foro/{venue.slug}">
                  {venue.name}
                </a>
              </h3>

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

              {#if nextEvent}
                <a class="nextEvent" href="/evento/{nextEvent.slug}">
                  <div class="thumbnail">
                    {#if nextEvent.imageKeySmall}
                      <img loading="lazy" src={getImageURL(nextEvent.imageKeySmall)} alt="Imagen del evento" />
                    {/if}
                  </div>

                  <div class="nextEventDetails">
                    <span class="label">Próximo evento</span>
                    <span class="eventName">{nextEvent.name}</span>
                    <span class="eventDate">
                      {formatDateShort(nextEvent.startDate)}{#if nextEvent.startTime}, {formatTime(nextEvent.startTime)}{/if}
                    </span>
                  </div>
                </a>
              {/if}
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  {/each}

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

  .venueSection {
    max-width: 800px;
    margin: 0 auto;

    h2 {
      font-size: var(--fsNormal);
      text-transform: uppercase;
      font-style: italic;
      padding: 0 var(--spacing);
      margin-top: var(--double);
      margin-bottom: 0;
    }
  }

  ul.venues {
    list-style: none;
    margin: 0;
    padding: var(--spacing);
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--double);
  }

  .venueCard {
    border: 1px solid var(--colorGreen);
    border-radius: var(--borderRadius);
    padding: var(--spacing) var(--double);

    h3 {
      font-size: var(--fsTitleMedium);
      margin: var(--spacing) 0;

      @media (min-width: $mediaM) {
        font-size: var(--fsTitleBig);
      }
    }

    h3 a {
      text-decoration: none;

      @media (hover: hover) and (pointer: fine) {
        &:hover {
          background-color: var(--colorGreen);
          color: var(--colorOffWhite);
        }
      }
    }
  }

  .nextEvent {
    display: flex;
    align-items: center;
    gap: var(--spacing);
    margin-top: var(--spacing);
    padding-top: var(--spacing);
    border-top: 1px solid var(--colorGreen);
    text-decoration: none;

    @media (hover: hover) and (pointer: fine) {
      &:hover .eventName {
        text-decoration: underline;
      }
    }
  }

  .thumbnail {
    flex-shrink: 0;
    height: 60px;
    width: 60px;
    border-radius: var(--borderRadius);
    overflow: hidden;
    background-color: var(--colorGreen);

    img {
      object-fit: cover;
      object-position: center top;
      height: 100%;
      width: 100%;
    }
  }

  .nextEventDetails {
    display: flex;
    flex-direction: column;
    min-width: 0;

    .label {
      text-transform: uppercase;
      font-style: italic;
      font-size: calc(0.85 * var(--fsNormal));
    }

    .eventName {
      font-weight: bold;
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
