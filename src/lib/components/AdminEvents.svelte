<script lang="ts">
  import Notification from './Notification.svelte';
  import { invalidateAll } from "$app/navigation";
	import { fade } from "svelte/transition"
	import EditEvent from "./EditEvent.svelte"
	import EventListItem from "./EventListItem.svelte"
	import EButton from "./EButton.svelte"
	import EventGridItem from "./EventGridItem.svelte"
	import { loginSession } from '../../stores'

  // Props
  export let events: [EventProperties] | []
  export let venues: [VenueProperties] | []
  export let users: UserProperties[]

  // States
  let showCreateEvent = false
  let showEditEvent = false
  let editEvent: EventProperties | null = null
  let displayMode = 'list'
  let filterMode = 'published'
  let loading = false

  // Observables
  let loggedInUser: User;
  loginSession.subscribe(value => {
    loggedInUser = value;
  });
  $: filteredEvents = events.filter(event => {
    // For contributors, only show their own events
    if (loggedInUser?.role === 'contributor') {
      if (event.userId !== loggedInUser.id) return false
    }
    // Filter events by status
    if (filterMode === 'published') {
      return event.published && !event.hidden
    } else if (filterMode === 'hidden') {
      return event.published && event.hidden
    } else if (filterMode === 'unpublished') {
      return !event.published
    }
    return true
  })
  $: unpublishedCount = events.filter(e => !e.published).length
  $: hiddenCount = events.filter(e => e.hidden).length

  // Handlers
  const handleEditEvent = (event: EventProperties) => {
    editEvent = event
    showEditEvent = true
  }

  // Delete event permanently
	const handleDeleteEvent = async (event: EventProperties) => {
		if (!event.hidden && event.published) {
			setDisplayMessage('No se permite borrar los eventos publicados')
		}
    
    if (!confirm('Borrar de forma permanente este evento y sus imagenes?')) return

    const body = JSON.stringify({id: event.id})
		try {
      loading = true
			const res = await fetch("/api/v1/event", {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body,
			})
			const reply = await res.json()
			setDisplayMessage(reply.message)
			if (res.ok) {
				invalidateAll()
			}
			loading = false
		} catch (error) {
			setDisplayMessage('Servidor no disponible')
		}
	}

  // Display message
  let displayMessage = ''
  const setDisplayMessage = (str: string) => displayMessage = str
</script>

{#if showCreateEvent}
  <div in:fade>
    <EditEvent 
      {venues}
      event={null} 
      on:saved={() => {
        invalidateAll();
        showCreateEvent = false
        setDisplayMessage('Evento actualizado')
        window.scrollTo(0, 0)
      }}
      on:cancel={() => showCreateEvent = false}
    />
  </div>

{:else if showEditEvent}
  <div in:fade>
    <EditEvent 
      {venues}
      event={editEvent}
      on:saved={() => {
        invalidateAll();
        showEditEvent = false
        setDisplayMessage('Evento actualizado')
        window.scrollTo(0, 0);
      }}
      on:deleted={() => {
        invalidateAll();
        showEditEvent = false
        setDisplayMessage('Evento borrado permanentemente')
        window.scrollTo(0, 0)
      }}
      on:cancel={() => showEditEvent = false}
    />
  </div>

{:else}
  <div class="events" in:fade>
    <div class="tools">
      <div class="filters flex">
        <div class="viewOptions">
          <EButton 
            class="icon grid {displayMode === 'grid' ? 'selected' : ''}"
            on:click={() => displayMode = 'grid'}
            disabled={displayMode === 'grid'}
          >Grid</EButton>
          <EButton 
            class="icon list {displayMode === 'list' ? 'selected' : ''}"
            on:click={() => displayMode = 'list'}
            disabled={displayMode === 'list'}
          >List</EButton>
        </div>

        <div class="statusOptions flex">
          <EButton
            on:click={() => filterMode='published'}
            class={filterMode === 'published' ? 'selected' : ''}
          >
            Publicados
          </EButton>
          <EButton
            on:click={() => filterMode='hidden'}
            class={filterMode === 'hidden' ? 'selected' : ''}
          >
            Borradores ({hiddenCount})
          </EButton>
          <EButton
            on:click={() => filterMode='unpublished'}
            class={filterMode === 'unpublished' ? 'selected' : ''}
          >
            No publicados ({unpublishedCount})
          </EButton>
        </div>
      </div>

      <EButton on:click={() => showCreateEvent = true} class="newEvent">Nuevo evento</EButton>
    </div>

    {#if displayMessage !== ''}
      <Notification {displayMessage} {setDisplayMessage} />

    {:else if unpublishedCount && filterMode === 'unpublished'}
      <p class="message">
        <strong>Importante</strong> – estos eventos fueron creados a través del formulario público.
        Pueden ser no legítimos, contener spam, o tener otros problemas. 
      </p>

    {/if}

    <ul class="events {displayMode}">
      {#each filteredEvents as event (event?.id)}
        {#if displayMode === 'list'}
          <EventListItem 
            {event} 
            {venues} 
            {handleEditEvent} 
            handleDeleteEventPermanently={event.hidden ? handleDeleteEvent : null}
          />
        {:else}
          <EventGridItem 
            {event} 
            {venues} 
            {handleEditEvent} 
            handleDeleteEventPermanently={event.hidden ? handleDeleteEvent : null}
          />
        {/if}
      {/each}
    </ul>

    {#if !filteredEvents.length}
      <div class="emptyList">
        No hay eventos del tipo seleccionado
      </div>
    {/if}
  </div>
{/if}

<style lang="scss">
  @use "$lib/sass/variables" as *;
  
  .tools {
    display: flex;
    justify-content: space-between;
    padding: var(--spacing);

    :global(.newEvent) {
      flex-grow: 0;
    }

    @media (max-width: $mediaM) {
      flex-wrap: wrap;
      gap: var(--spacing);

      .filters {
        order: 2;
      }

      :global(.newEvent) {
        width: 100%;
        order: 1;
      }
    }

    // Push grid/list toggle below status button
    @media (max-width: 450px) {
      .filters {
        width: 100%;
      }

      .statusOptions {
          order: 1;
          width: 100%;
          flex-wrap: wrap;

          :global(button) {
            flex-grow: 1;
          }
      }
      .viewOptions {
        order: 2;
      }
    }
  }

  .message {
    text-align: left;
    padding-left: 0;
  }

  .filters {
    flex-wrap: wrap;
  }

  .viewOptions {
    // Override EButton styles
    :global(button:hover),
    :global(button.selected) {
      transform: none;
      box-shadow: 2px 2px 0 var(--colorGreen);
      transform: translate(-2px, -2px);
    }
    :global(button.grid) {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
    :global(button.list) {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      transform: translate(-6px, -2px);
    }
  }

  ul.events {
    list-style: none;
    padding: var(--spacing);
    margin-top: 0;
    border-top: 1px solid var(--colorGreen);
    display: grid;
    gap: var(--spacing);
    
    --eventColumnsGrid: 1;
    --eventColumnsList: 1;
    
    @media (min-width: $mediaM) {
      --eventColumnsGrid: 2;
      --eventColumnsList: 2;
    }
    @media (min-width: $mediaL) {
      --eventColumnsGrid: 3;
    }
    @media (min-width: $mediaXL) {
      --eventColumnsList: 3;
      --eventColumnsGrid: 4;
    }

    &.grid {
      grid-template-columns: repeat(var(--eventColumnsGrid), 1fr);
    }
    &.list {
      grid-template-columns: repeat(var(--eventColumnsList), 1fr);
    }

    @media (min-width: $mediaL) {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
    }
  }

  :global(.viewOptions button:disabled) {
    opacity: 1;
    pointer-events: none;
  }
</style>