<script lang="ts">
  import { invalidateAll } from "$app/navigation";
	import { fade } from "svelte/transition"
	import EditVenue from "./EditVenue.svelte"
	import EButton from "./EButton.svelte"

  export let venues

  let showCreateVenue = false
  let showEditVenue = false
  let editVenue: Venue = null;
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
      <EButton on:click={() => showCreateVenue = true}>Nuevo foro</EButton>
    </div>

    <ul class="venues">
      {#each venues as venue (venue.id)}
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
  </div>
  
{/if}

<style lang="scss">
  @import "$lib/sass/variables";

  .tools {
    padding: var(--spacing);
    display: flex;
    justify-content: flex-end;
    border-bottom: 1px solid var(--colorGreen);
  }

  ul.venues {
    list-style: none;
    margin: 0;
    padding: 0;

    li {
      padding: var(--spacing);
      margin-bottom: var(--spacing);
    }

    @media (min-width: $mediaL) {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
