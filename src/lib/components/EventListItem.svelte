<script lang="ts">
	import EButton from "./EButton.svelte"

  
  export let event: EEvent
  export let handleDisableEvent: Function | null = null
  export let handleEditEvent: Function | null = null
  export let handleLikeEvent: Function | null = null
</script>

{#if event}
  <li class="eventListItem">
    <strong>{event.name}</strong><br />
    {new Date(event.startDate)}
    
    <div class="actions">
      {#if handleLikeEvent}
      <EButton on:click={() => handleLikeEvent(event.id)}>
        Guardar
        </EButton>
      {/if}
      {#if handleEditEvent}
        <EButton on:click={() => handleEditEvent(event)}>
          Modificar
        </EButton>
      {/if}
      {#if handleDisableEvent}
        <EButton on:click={() => handleDisableEvent(event.id) }>
          Ocultar
        </EButton>
      {/if}
    </div>
  </li>
{/if}

<style>
  .eventListItem {
    margin-bottom: calc(2 * var(--spacing));
  }
</style>