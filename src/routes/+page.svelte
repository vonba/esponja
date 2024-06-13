<!-- This is the public home page of the app -->
<script lang="ts">
	import ButtonLink from "$lib/components/ButtonLink.svelte"
	import EButton from "$lib/components/EButton.svelte"
	import PublicEvents from "$lib/components/PublicEvents.svelte"
	import PublicLogo from "$lib/components/PublicLogo.svelte"

	export let data: HomePageData

	// State
	let eventTimeWindow: string | null
	let eventFilterDateStart: string | null  // YYYY-MM-DD
	let eventFilterDateEnd: string | null // YYYY-MM-DD

	const setEventTimeWindow = (newTimeWindow: string) => {
		if (eventTimeWindow === newTimeWindow) {
			eventTimeWindow = ''
		} else {
			eventTimeWindow = newTimeWindow
		}

		if ('today' === eventTimeWindow) {
			eventFilterDateStart = new Date().toISOString().split('T')[0];
			eventFilterDateEnd = eventFilterDateStart;
		} else if ('tomorrow' === eventTimeWindow) {
			let tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			eventFilterDateStart = tomorrow.toISOString().split('T')[0];
			eventFilterDateEnd = eventFilterDateStart;
		} else if ('week' === eventTimeWindow) {
			let currentDate = new Date();
			let firstDayOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1));
			eventFilterDateStart = firstDayOfWeek.toISOString().split('T')[0];
			let lastDayOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 7));
			eventFilterDateEnd = lastDayOfWeek.toISOString().split('T')[0];
		} else if ('month' === eventTimeWindow) {
			let currentMonth = new Date();
			eventFilterDateStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
			eventFilterDateEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];
		} else {
			eventFilterDateStart = null
			eventFilterDateEnd = null
		}
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
	#homePage {
		/* :global(.publicEvents) {
			// Pull events up so that grid/list selector lines up with menu buttons
			margin-top: -35px;
		} */
	}

	.homeHeader {
		position: sticky;
		top: 0;
		background-color: var(--colorOffWhite);
		z-index: 10;
	}

	#eventsNavigation {
		display: flex;
		width: 100%;
		margin-top: var(--spacing);
		padding: 0 var(--spacing);
		gap: var(--spacing);

		:global(button) {
			flex-grow: 1;
		}
	}
</style>
