<script lang="ts">
  import { invalidateAll } from "$app/navigation";
	import { fade } from "svelte/transition"
	import EditEvent from "./EditEvent.svelte"

  export let events

  let showCreateEvent = false
  let showEditEvent = false
  let editEvent: EEvent = null;

  const disableEvent = (eventId: number) => {
    // TODO: update event and set as disabled
    console.log('disable event with id ' + eventId)
  }
</script>

<ul class="events">
  {#if showCreateEvent}
    <div in:fade>
      <EditEvent 
        event={null} 
        on:saved={() => {
          invalidateAll();
          showCreateEvent = false
        }}
      />
      <button on:click={() => showCreateEvent = false}>Cancelar</button>
    </div>
  
  {:else if showEditEvent}
    <div in:fade>
      <EditEvent 
        event={editEvent}
        on:saved={() => {
          invalidateAll();
          showCreateEvent = false
        }}
      />
      <button on:click={() => showEditEvent = false}>Cancelar</button>
    </div>

  {:else}
    <div in:fade>
      <button on:click={() => showCreateEvent = true}>Nuevo evento</button>
      {#each events as event (event.id)}
      <li>
        <strong>{event.name}</strong><br />
        {new Date(event.startDate)}
        <div class="actions">
          <button on:click={() => {
            editEvent = event
            showEditEvent = true
          }}>
            Modificar
          </button>
          <button on:click={() => disableEvent(event.id) }>Ocultar</button>
        </div>
      </li>
      {/each}
    </div>
    
  {/if}

</ul>