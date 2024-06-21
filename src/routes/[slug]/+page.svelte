<!-- This is the public home page of the app -->
<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from "$app/navigation"
	import EButton from "$lib/components/EButton.svelte"
	import PublicEvents from "$lib/components/PublicEvents.svelte"
	import PublicLogo from "$lib/components/PublicLogo.svelte"
	import { getDateFiltersFromTimeWindow } from "$lib/dateTime"
	import { onMount } from 'svelte'

	// Props
	export let data: HomePageData

	// State
	let eventTimeWindow: string | null
	let eventFilterDateStart: string | null  // YYYY-MM-DD
	let eventFilterDateEnd: string | null // YYYY-MM-DD
	let slug = ''

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
	
	<nav id="eventsNavigation">
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
	</nav>
</section>

<a href="/tu-evento" class="suggestEvent">
	Agregar tu evento
</a>

<section id="homePage">
	<PublicEvents events={data.events} venues={data.venues} startDate={eventFilterDateStart} endDate={eventFilterDateEnd} />
</section>

<style lang="scss">
	@import "$lib/sass/variables";

	/* #homePage {
	} */

	.homeHeader {
		position: sticky;
		top: 0;
		background-color: var(--colorOffWhite);
		z-index: 10;
		margin-bottom: var(--spacing);

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

		:global(button) {
			flex-grow: 1;
		}

		@media (min-width: $mediaL) {
			width: 50%;
			max-width: 40em;
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
			
			&:hover {
				color: var(--colorGreen);
				background-color: var(--colorOffWhite);
				border-top: 1px solid var(--colorGreen);
			}
		}
		
		// Desktop: top right link
		@media (min-width: $mediaL) {
			bottom: unset;
			top: var(--spacing);

			&:hover {
				text-decoration: underline;
			}
			right: var(--spacing);
		}
	}
</style>
