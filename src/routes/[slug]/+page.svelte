<!-- This is the public home page of the app -->
<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from "$app/navigation"
	import EButton from "$lib/components/EButton.svelte"
	import PublicEvents from "$lib/components/PublicEvents.svelte"
	import PublicLogo from "$lib/components/PublicLogo.svelte"
	import { getDateFiltersFromTimeWindow } from "$lib/dateTime"
	import { onMount } from 'svelte'
	import ButtonLink from '$lib/components/ButtonLink.svelte'
	import { likedEventsPopupVisible } from '../../stores'
	import SearchEvents from '$lib/components/SearchEvents.svelte'

	// Props
	export let data: HomePageData

	// State
	let eventTimeWindow: string | null
	let eventFilterDateStart: string | null  // YYYY-MM-DD
	let eventFilterDateEnd: string | null // YYYY-MM-DD
	let slug = ''
	let isSearchVisible = false
  let searchString = ''
	let displayMode = 'grid'

	// Date filters
	const setEventTimeWindow = (newTimeWindow: string) => {
		if (eventTimeWindow === newTimeWindow) {
			eventTimeWindow = 'todo' // Unset filter by clicking already selected button
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

	onMount(() => {
    if(slug) {
			setEventTimeWindow(slug)
		} else {
			// No default filter
			setEventTimeWindow('todo')
		}
  });

</script>

<svelte:head>
	<title>Esponja – Eventos de Música Alternativa en la Ciudad de México</title>
</svelte:head>

<section class="homeHeader">
	<PublicLogo on:click={() => setEventTimeWindow('todo')} />
	
	<nav id="eventsNavigation" class={isSearchVisible ? 'searchVisible' : ''}>
		<EButton 
			on:click={() => setEventTimeWindow('hoy')}
			class={'hoy' === eventTimeWindow ? 'selected' : ''}
		>
			Hoy
		</EButton>
		<EButton 
			on:click={() => setEventTimeWindow('manana')}
			class={'manana' === eventTimeWindow ? 'selected' : ''}
		>
			Mañana
		</EButton>
		<EButton 
			on:click={() => setEventTimeWindow('semana')}
			class={'semana' === eventTimeWindow ? 'selected' : ''}
		>
			Esta semana
		</EButton>
		<EButton 
			on:click={() => setEventTimeWindow('mes')}
			class={'mes' === eventTimeWindow ? 'selected' : ''}
		>
			Este mes
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
				<ButtonLink href="/info" class="info icon">
					Info
				</ButtonLink>
			</div>
		</div>
	</nav>
</section>

<a href="/tu-evento" class="suggestEvent">
	Agregar tu evento
</a>

<section id="homePage">
	<PublicEvents 
		{eventTimeWindow}
		events={data.events} 
		venues={data.venues} 
		startDate={eventFilterDateStart} 
		endDate={eventFilterDateEnd} 
		{searchString}
		{displayMode}
	/>
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
	}
	
	.smallButtons {

		.more {
			display: flex;
			gap: var(--spacing);
		}

		@media (max-width: $mediaM) {
			display: flex;
			width: 100%;
			position: absolute;
			right: 0;
			margin-top: 28px;
			justify-content: space-between;
			background-color: var(--colorOffWhite);
			padding: var(--spacing);
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

    @media (min-width: $mediaM) {
      display: none;
    }
  }

	.suggestEvent {
		position: fixed;
		bottom: 0;
		right: 0;
		text-transform: uppercase;
		font-style: italic;
		text-decoration: none;
		font-weight: bold;
		z-index: 10;
		
		// Small screens: banner at the bottom
		@media (max-width: $mediaL) {
			width: 100%;
			text-align: center;
			padding: var(--spacing);
			background-color: var(--colorGreen);
			color: var(--colorOffWhite);
			
			@media (hover: hover) {
				&:hover {
					color: var(--colorGreen);
					background-color: var(--colorOffWhite);
					border-top: 1px solid var(--colorGreen);
				}
			}
		}
		
		// Desktop: top right link
		@media (min-width: $mediaL) {
			bottom: unset;
			top: var(--spacing);
			right: var(--spacing);

			@media (hover: hover) {
				&:hover {
					text-decoration: underline;
				}
			}
		}
	}
</style>
