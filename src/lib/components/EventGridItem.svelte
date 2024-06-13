<script lang="ts">
	import { getImageURL } from "$lib/file"
	import EButton from "./EButton.svelte"

  
  export let event: EEvent
  export let handleDisableEvent: Function | null = null
  export let handleEditEvent: Function | null = null
  export let handleLikeEvent: Function | null = null
</script>

{#if event}
  <li class="eventGridItem">
    <div class="contentWrapper">
      <strong>{event.name}</strong><br />
      {new Date(event.startDate)}
      
      <div class="actions">
        {#if handleLikeEvent}
        <EButton on:click={() => handleLikeEvent(event.id)} class="icon saveFilled">
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
    </div>

    {#if event.imageURL}
      <div class="imageWrapper">
        <img src={getImageURL(event.imageURL)} alt="Imagen del evento" />
      </div>
    {/if}
  </li>
{/if}

<style lang="scss">
  .eventGridItem {
    //
  }
</style>