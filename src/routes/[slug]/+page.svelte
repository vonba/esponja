<!-- This is the public home page of the app -->
<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from "$app/navigation"
	import EButton from "$lib/components/EButton.svelte"
	import PublicEvents from "$lib/components/PublicEvents.svelte"
	import PublicLogo from "$lib/components/PublicLogo.svelte"
	import { getDateFiltersFromTimeWindow } from "$lib/dateTime"
	import { afterUpdate, onMount, tick } from 'svelte'
	import { likedEventsPopupVisible } from '../../stores'
	import SearchEvents from '$lib/components/SearchEvents.svelte'
	import { PUBLIC_DOMAIN } from '$env/static/public'
	import LoadingIndicator from '$lib/components/LoadingIndicator.svelte'
	import type { Snapshot } from '../$types'

	// Fetch data (ISR)
	let loading = true;
	let data: HomePageData = {
		venues: [],
		events: [],
	}

	// State
	let eventTimeWindow: string | undefined
	let eventFilterDateStart: string | null  // YYYY-MM-DD
	let eventFilterDateEnd: string | null // YYYY-MM-DD
	let slug = ''
	let isSearchVisible = false
  let searchString = ''
	let displayMode = 'grid'
	
	// Restore scroll state
	let scrollX = 0
	let scrollY = 0
	export const snapshot: Snapshot<string> = {
		capture: () => {
			return JSON.stringify({scrollPosition: {x: window.scrollX, y: window.scrollY}})
		},
		restore: (snapshotJSON) => {
			const snapshot = JSON.parse(snapshotJSON)
			if (snapshot.scrollPosition) {
				scrollX = snapshot.scrollPosition.x
				scrollY = snapshot.scrollPosition.y
			}
		},
	};

	// Date filters
	const setEventTimeWindow = (newTimeWindow: string) => {
		if (eventTimeWindow === newTimeWindow) {
			eventTimeWindow = '' // Unset filter by clicking already selected button
		} else {
			eventTimeWindow = newTimeWindow
		}

		const { startDate, endDate } = getDateFiltersFromTimeWindow(eventTimeWindow);
		eventFilterDateStart = startDate
		eventFilterDateEnd = endDate

		goto(`/${eventTimeWindow}`, { replaceState: true });
	}
  $: ({ slug } = $page.params);

  const showLikedEvents = () => {
    likedEventsPopupVisible.set(true);
    document.body.classList.add('popupVisible');
  }

	const toggleSearch = () => {
    isSearchVisible = !isSearchVisible
    searchString = ''
  }

  const handleSearchChange = (newSearchString: string) => searchString = newSearchString

	afterUpdate(() => {
		window.scrollTo(scrollX, scrollY);
	});

	onMount(async () => {
    if(slug) {
			setEventTimeWindow(slug)
		} else {
			// No default filter
			setEventTimeWindow('')
		}

		// Fetch venues
		const venueResponse = await fetch('/api/v1/venue', {
			method: 'GET',
		});
		if (!venueResponse.ok) {
			loading = false
			throw new Error('Error en API de foros');
		}
		data.venues = await venueResponse.json();

		// Fetch events
		const eventResponse = await fetch('/api/v1/event', {
			method: 'GET'
		});
		if (!eventResponse.ok) {
			loading = false
			throw new Error('Error en API de eventos');
		}
		data.events = await eventResponse.json();
		loading = false
  })

</script>

<svelte:head>
	<title>Esponja – Eventos de música alternativa en la Ciudad de México</title>
	<meta property="og:title" content="Esponja" />
  <meta property="og:description" content="Eventos de música alternativa en la Ciudad de México" />
	<meta name="description" content="Eventos de música alternativa en la Ciudad de México">
  <meta property="og:image" content="{PUBLIC_DOMAIN}/esponja-preview.jpg" />
  <meta property="og:type" content="website" />
</svelte:head>

<section class="homeHeader">
	<PublicLogo on:click={() => setEventTimeWindow('')} />
	
	<nav id="eventsNavigation" class={isSearchVisible ? 'searchVisible' : ''}>
		<EButton 
			on:click={() => setEventTimeWindow('')}
			class={[undefined, '', 'eventos'].includes(eventTimeWindow) ? 'selected' : ''}
		>
			Todo
		</EButton>
		<EButton 
			on:click={() => setEventTimeWindow('hoy')}
			class={'hoy' === eventTimeWindow ? 'selected cross' : ''}
		>
			Hoy
		</EButton>
		<EButton 
			on:click={() => setEventTimeWindow('manana')}
			class={'manana' === eventTimeWindow ? 'selected cross' : ''}
		>
			Mañana
		</EButton>
		<EButton 
			on:click={() => setEventTimeWindow('semana')}
			class={'semana' === eventTimeWindow ? 'selected cross' : ''}
		>
			Esta semana
		</EButton>
		<div class="smallButtons">
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
			<div class="more">
				<EButton 
					on:click={() => showLikedEvents()}
					class="saveFilled icon"
				>
					Guardados
				</EButton>
				<SearchEvents {isSearchVisible} {toggleSearch} {handleSearchChange}  />
				<!-- <ButtonLink href="/info" class="info icon">
					Info
				</ButtonLink> -->
			</div>
		</div>
	</nav>
</section>

<div class="links">
	<a href="/info">
		¿Qué es Esponja?
	</a>
		&nbsp; &nbsp;
	<a href="/tu-evento">
		Agregar tu evento
	</a>
</div>

<section id="homePage">
	{#if loading}
		<LoadingIndicator />
	{:else}
		<PublicEvents 
			{eventTimeWindow}
			events={data.events} 
			venues={data.venues} 
			startDate={eventFilterDateStart} 
			endDate={eventFilterDateEnd} 
			{searchString}
			{displayMode}
		/>
	{/if}
</section>

<style lang="scss">
	@import "$lib/sass/variables";

	.homeHeader {
		position: sticky;
		top: 0;
		background-color: var(--colorOffWhite);
		z-index: 10;
		padding-bottom: var(--spacing);
		border-bottom: 1px solid var(--colorGreen);

		@media (min-width: $mediaL) {
			display: flex;
			justify-content: space-between;
			align-items: flex-end;
		}
	}

	#eventsNavigation {
		display: flex;
		width: 100%;
		margin-top: 20px;
		padding: 0 var(--spacing);
		gap: var(--spacing);
		height: 2em;
		transition: all 0.5s;

		:global(button:not(.icon)) {
			flex-grow: 1;
		}

		@media (min-width: $mediaL) {
			width: 80%;
			max-width: 40em;

			&.searchVisible {
				max-width: 50em;
			}
		}

		@media (max-width: $mediaM) {
			&.searchVisible {
				.viewOptions {
					display: none;
				}

				.more {
					width: 100%;

					:global(.searchWrapper) {
						flex-grow: 1;
					}
				}
			}
		}
	}
	
	.smallButtons {
		.more {
			display: flex;
			gap: var(--spacing);
		}
		display: flex;
		gap: var(--spacing);

		@media (max-width: $mediaM) {
			width: 100%;
			position: absolute;
			right: 0;
			margin-top: 28px;
			justify-content: space-between;
			background-color: var(--colorOffWhite);
			padding: var(--spacing);
			border-bottom: 1px solid var(--colorGreen);
		}
	}

	#homePage {
		@media (max-width: $mediaM) {
			// To compensate for .smallButtons which has an absolute position
			margin-top: 35px;
		}
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

	.links {
		position: fixed;
		bottom: 0;
		right: 0;
		text-transform: uppercase;
		font-style: italic;
		font-weight: bold;
		z-index: 10;
		
		a {
			text-decoration: none;
			
			&:hover {
				text-decoration: underline;
			}
		}
		
		// Small screens: banner at the bottom
		@media (max-width: $mediaL) {
			width: 100%;
			text-align: center;
			padding: var(--spacing);
			background-color: var(--colorGreen);
			color: var(--colorOffWhite);
			
			a {
				color: var(--colorOffWhite);
			}
		}
		
		// Desktop: top right link
		@media (min-width: $mediaL) {
			bottom: unset;
			top: var(--spacing);
			right: var(--spacing);
		}
	}
</style>
