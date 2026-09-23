<script lang="ts">
	import ButtonLink from "$lib/components/ButtonLink.svelte"
  import PublicLogo from "$lib/components/PublicLogo.svelte"
	import PublicVenue from "$lib/components/PublicVenue.svelte"

  export let data: SingleVenuePageData
  $: events = data.events
  $: venue = data.venue
</script>

<svelte:head>
  <title>{venue ? venue.name : 'No encontrado'} – Esponja</title>
</svelte:head>

<div class="pageHeaderWrapper">
  <PublicLogo />
  <nav id="pageNavigation">
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