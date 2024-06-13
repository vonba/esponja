<!-- This is the public home page of the app -->
<script lang="ts">
	import EButton from "$lib/components/EButton.svelte"
	import PublicEvents from "$lib/components/PublicEvents.svelte"
	import PublicLogo from "$lib/components/PublicLogo.svelte"
	import { getDateFiltersFromTimeWindow } from "$lib/dateTime"

	// Props
	export let data: HomePageData

	// State
	let eventTimeWindow: string | null
	let eventFilterDateStart: string | null  // YYYY-MM-DD
	let eventFilterDateEnd: string | null // YYYY-MM-DD

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
	}
	// Default filter
	setEventTimeWindow('week')

</script>

<svelte:head>
	<title>Esponja – Eventos de Música Alternativa en la Ciudad de México</title>
</svelte:head>

<section class="homeHeader">
	<PublicLogo />
	
	<nav id="eventsNavigation">
		<EButton 
			on:click={() => setEventTimeWindow('today')}
			class={'today' === eventTimeWindow ? 'selected' : ''}
		>
			Hoy
		</EButton>
		<EButton 
			on:click={() => setEventTimeWindow('tomorrow')}
			class={'tomorrow' === eventTimeWindow ? 'selected' : ''}
		>
			Mañana
		</EButton>
		<EButton 
			on:click={() => setEventTimeWindow('week')}
			class={'week' === eventTimeWindow ? 'selected' : ''}
		>
			Esta semana
		</EButton>
		<EButton 
			on:click={() => setEventTimeWindow('month')}
			class={'month' === eventTimeWindow ? 'selected' : ''}
		>
			Este mes
		</EButton>
	</nav>
</section>

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
		margin-top: var(--spacing);
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
</style>
