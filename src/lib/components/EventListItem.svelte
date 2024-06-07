<script lang="ts">  
  export let event: EEvent
  export let handleDisableEvent: Function
  export let handleEditEvent: Function
  export let handleLikeEvent: Function
</script>

{#if event}
  <li class="eventListItem">
    <strong>{event.name}</strong><br />
    {new Date(event.startDate)}
    
    <div class="actions">
      <button on:click={() => handleLikeEvent(event.id)}>
        Guardar
      </button>
      <button on:click={() => handleEditEvent(event.id)}>
        Modificar
      </button>
      <button on:click={() => handleDisableEvent(event.id) }>
        Ocultar
      </button>
    </div>
  </li>
{/if}

<style>
  .eventListItem {
    padding: 1em;
    border: 1px solid grey;
    border-radius: 5px;
    margin-bottom: 1em;
  }
</style>