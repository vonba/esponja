<script lang="ts">
  import { likedEventsStore, removeLikedEvent } from '$lib/likedEvents';
	import { likedEventsPopupVisible } from '../../stores'
  import { formatDate, formatTime } from "$lib/dateTime"
	import EButton from './EButton.svelte'
  import { getImageURL } from "$lib/file"
  import { fade } from "svelte/transition"

  // Subscribe to the liked events store
  let likedEvents: LikedEvent[] = [];
  likedEventsStore.subscribe(value => {
    likedEvents = value;
  });

  // Popup state
  $likedEventsPopupVisible
  const closePopup = () => {
    likedEventsPopupVisible.set(false);
    document.body.classList.remove('popupVisible');
  };
</script>

{#if $likedEventsPopupVisible}  
  <div class="likedEventsPopup">
    <EButton class="icon close" on:click={closePopup}>
      Cerrar
    </EButton>

    <h3 class="title">Eventos guardados</h3>
    <div class="contentWrapper">
      <ul class="events">
          {#if likedEvents.length > 0}
            {#each likedEvents as event}
              <li class="event" in:fade out:fade>
                <div class="eventContentWrapper">
                  <h2>
                    <a href="/evento/{event.slug}">{event.name}</a>
                  </h2>
              
                  <div class="datesWrapper flex">
                    <img src="/icon-date-green.svg" alt="Fecha" />
                    <div class="dates">
                      {#if event.startDate}{formatDate(event.startDate)}{/if}{#if event.startTime}, {formatTime(event.startTime)}{/if}
                    </div>
                  </div>
                </div>
              
                <a href="/evento/{event.slug}">
                  <div class="imageWrapper">
                    {#if event.imageKeySmall && event.imageKeyLarge}
                    
                    <img 
                      src={getImageURL(event.imageKeySmall)} 
                      alt="Imagen del evento" 
                    />
                    {/if}
                  </div>
                </a>

                <EButton class="icon delete" on:click={() => removeLikedEvent(event.id)} />
              </li>
            {/each}

          {:else}
            <li class="emptyList">
              Pica el símbolo <img src="/icon-save-outline-green.svg" class="saveIcon" alt="Icono guardar" /> 
              para guardar eventos aquí.
            </li>
    
          {/if}
        </ul>
    </div>
    <img class="logo" src="/esponja-logo.svg" alt="Esponja" />
  </div>
{/if}

<style lang="scss">
  .likedEventsPopup {
    position: fixed;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    background-color: var(--colorOffWhite);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: column;
    z-index: 10;

    :global(button.close) {
      position: absolute;
      top: var(--spacing);
      right: var(--spacing);
    }

    .contentWrapper {
      height: calc(100% - 80px);
      width: 100%;
      padding: var(--spacing);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      
      .events {
        width: 100%;
        max-width: 40em;
        flex-grow: 1;
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .event {
        --itemHeight: 150px;

        display: grid;
        grid-template-columns: 1fr 30% 2em;
        gap: var(--double);
        height: var(--itemHeight);
        margin-bottom: var(--spacing);
        align-items: center;

        a {
          text-decoration: none;
        }
        
        .imageWrapper {
          height: var(--itemHeight);

          img {
            height: 100%;
            width: 100%;
            object-fit: cover;
            border-radius: var(--borderRadius);
          }
        }

        :global(button) {
          height: 2em;
          align-self: center;
        }
      }

      img.saveIcon {
        margin: 0 4px -3px 3px;
      }
    }

    .title {
      margin-top: 20px;
      text-transform: uppercase;
    }

    .logo {
      height: 30px;
      margin-bottom: 20px;
    }
  }
</style>