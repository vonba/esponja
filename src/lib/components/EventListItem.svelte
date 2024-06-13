<script lang="ts">
	import { formatDate, formatTime } from "$lib/dateTime"
	import { getImageURL } from "$lib/file"
  import EButton from "./EButton.svelte"
  
  export let event: EEvent
  export let handleDisableEvent: Function | null = null
  export let handleEditEvent: Function | null = null
  export let handleLikeEvent: Function | null = null
</script>

{#if event}
  <li class="eventListItem">
    <div class="contentWrapper">
      <h2>{event.name}</h2>

      <div class="dates">
        {#if event.startDate}{formatDate(event.startDate)}{/if}{#if event.startTime}, {formatTime(event.startTime)}{/if}
      </div>
      
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

    {#if event.imageKeySmall}
      <div class="imageWrapper">
        <img src={getImageURL(event.imageKeySmall)} alt="Imagen del evento" />
      </div>
    {/if}
  </li>
{/if}

<style lang="scss">
  h2 {
    font-size: var(--fsTitleMedium);
    margin-bottom: 0;
  }

  .eventListItem {
    margin-bottom: var(--spacing);
    display: grid;
    grid-template-columns: 1fr minmax(100px, 33%);
    gap: var(--spacing);
    border-top: 1px solid var(--colorGreen);
    padding-top: var(--spacing);
    height: calc(150px + var(--spacing));
  }

  .imageWrapper {
    height: 100%;
    border-radius: var(--borderRadius);
    overflow: hidden;

    img {
      object-fit: cover;
      object-position: top;
      height: 100%;
      width: 100%;
    }
  }

  .dates::first-letter {
    text-transform: capitalize;
  }
</style>