<script lang="ts">
  import { invalidateAll } from "$app/navigation";
	import { fade } from "svelte/transition"
	import EditVenue from "./EditVenue.svelte"
	import EButton from "./EButton.svelte"

  // Props
  export let venues: [VenueProperties] | []

  // States
  let showCreateVenue = false
  let showEditVenue = false
  let editVenue: Venue = null;
  let filterMode = 'visible'

  // Observables
  $: filteredVenues = venues.filter(
    venue => filterMode === 'hidden' ? venue.hidden : !venue.hidden
  )
  $: hiddenCount = venues.filter(v => v.hidden).length
</script>

{#if showCreateVenue}
  <div in:fade>
    <EditVenue 
      venue={null} 
      on:saved={() => {
        invalidateAll();
        showCreateVenue = false
      }}
      on:cancel={() => showCreateVenue = false}
    />
  </div>

{:else if showEditVenue}
  <div in:fade>
    <EditVenue 
      venue={editVenue}
      on:saved={() => {
        invalidateAll();
        showEditVenue = false
      }}
      on:cancel={() => showEditVenue = false}
    />
  </div>

{:else}
  <div in:fade>
    <div class="tools">
      <div class="statusOptions flex">
        <EButton
          on:click={() => filterMode='visible'}
          class={filterMode === 'visible' ? 'selected' : ''}
        >
          Visibles
        </EButton>
        <EButton
          on:click={() => filterMode='hidden'}
          class={filterMode === 'hidden' ? 'selected' : ''}
        >
          No visibles ({hiddenCount})
        </EButton>
      </div>
      <EButton on:click={() => showCreateVenue = true}>Nuevo foro</EButton>
    </div>

    <ul class="venues">
      {#each filteredVenues as venue (venue.id)}
      <li>
        <strong>{venue.name}</strong><br />
        {venue.addressline1}<br />
        {venue.addressline2}<br />
        <div class="actions">
          <EButton
            class="icon edit"
            on:click={() => {
              editVenue = venue
              showEditVenue = true
            }}
          >
            Modificar
          </EButton>
        </div>
      </li>
      {/each}
    </ul>
    {#if !filteredVenues.length}
      <div class="emptyList">
        No hay foros del tipo seleccionado
      </div>
    {/if}
  </div>
  
{/if}

<style lang="scss">
  @import "$lib/sass/variables";

  .tools {
    padding: var(--spacing);
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid var(--colorGreen);
  }

  ul.venues {
    list-style: none;
    margin: 0;
    padding: 0;

    li {
      padding: var(--spacing);
      margin-bottom: var(--spacing);

      .actions {
        margin-top: var(--spacing);
      }
  }

    @media (min-width: $mediaM) {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    @media (min-width: $mediaL) {
      grid-template-columns: 1fr 1fr 1fr;
    }

    @media (min-width: $mediaXL) {
      grid-template-columns: 1fr 1fr 1fr 1fr;
    }
  }
</style>
