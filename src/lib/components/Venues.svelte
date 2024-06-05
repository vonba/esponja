<script lang="ts">
  import { invalidateAll } from "$app/navigation";
	import { fade } from "svelte/transition"
	import EditVenue from "./EditVenue.svelte"

  export let venues

  let showCreateVenue = false
  let showEditVenue = false
  let editVenue: Venue = null;

  const disableVenue = (venueId: number) => {
    // TODO: update venue and set as disabled
    console.log('disable venue with id ' + venueId)
  }
</script>

<ul class="venues">
  {#if showCreateVenue}
    <div in:fade>
      <EditVenue 
        venue={null} 
        on:saved={() => {
          invalidateAll();
          showCreateVenue = false
        }}
      />
      <button on:click={() => showCreateVenue = false}>Cancelar</button>
    </div>
  
  {:else if showEditVenue}
    <div in:fade>
      <EditVenue 
        venue={editVenue}
        on:saved={() => {
          invalidateAll();
          showCreateVenue = false
        }}
      />
      <button on:click={() => showEditVenue = false}>Cancelar</button>
    </div>

  {:else}
    <div in:fade>
      <button on:click={() => showCreateVenue = true}>Nuevo foro</button>
      {#each venues as venue (venue.id)}
      <li>
        <strong>{venue.name}</strong><br />
        {venue.addressline1}<br />
        {venue.addressline2}<br />
        <div class="actions">
          <button on:click={() => {
            editVenue = venue
            showEditVenue = true
          }}>
            Modificar
          </button>
          <button on:click={() => disableVenue(venue.id) }>Ocultar</button>
        </div>
      </li>
      {/each}
    </div>
    
  {/if}

</ul>