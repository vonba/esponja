<!-- This is the public home page of the app -->
<script lang="ts">
	import ButtonLink from "$lib/components/ButtonLink.svelte"
	import EButton from "$lib/components/EButton.svelte"
	import PublicEvents from "$lib/components/PublicEvents.svelte"
	import PublicLogo from "$lib/components/PublicLogo.svelte"

	export let data: HomePageData

	// State
	let eventTimeWindow = 'week'

	const setEventTimeWindow = (newTimeWindow: string) => {
		if (eventTimeWindow === newTimeWindow) {
			eventTimeWindow = ''
		} else {
			eventTimeWindow = newTimeWindow
		}
	}

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
	<PublicEvents events={data.events} venues={data.venues} />
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
