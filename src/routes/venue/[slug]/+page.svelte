<script lang="ts">
	import { invalidateAll } from "$app/navigation"
	import ButtonLink from "$lib/components/ButtonLink.svelte"
	import EButton from "$lib/components/EButton.svelte"
	import EditVenue from "$lib/components/EditVenue.svelte"
  import PublicLogo from "$lib/components/PublicLogo.svelte"
	import { fade } from "svelte/transition"
	import { likedEventsPopupVisible } from "../../../stores"
	import PublicVenue from "$lib/components/PublicVenue.svelte"

  type SingleVenuePageData = {
    user: User,
    venue: {venue: VenueProperties, events: [EventProperties] | []},
  }
  export let data: SingleVenuePageData
  const events = data.venue.events
  const venue = data.venue.venue
  
  const showLikedEvents = () => {
    likedEventsPopupVisible.set(true);
    document.body.classList.add('popupVisible');
  }
</script>

<svelte:head>
  <title>{venue ? venue.name : 'No encontrado'} – Esponja</title>
</svelte:head>

<div class="pageHeaderWrapper">
  <PublicLogo />
  <nav id="pageNavigation">
    <EButton 
      on:click={() => showLikedEvents()}
      class="saveFilled icon"
    >
      Guardados
    </EButton>
    <ButtonLink href="/info" class="info icon">
      Info
    </ButtonLink>
  </nav>
</div>


{#if venue}
  <PublicVenue venue={venue} {events} />

{:else}
  <p class="emptyList">
    <strong>No encontrado</strong><br />
    No encontramos el foro que buscas. ¿Pegaste mal el link?
  </p>

{/if}


<style lang="scss">
  .pageHeaderWrapper {
    display: flex;
    justify-content: space-between;
  }

  #pageNavigation {
    margin-top: var(--spacing);
    padding: var(--spacing);
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing);
    justify-content: flex-end;
    height: 3.25em;
  }
</style>