<!-- This is the public home page of the app -->
<script lang="ts">
	import ButtonLink from "$lib/components/ButtonLink.svelte"
	import EButton from "$lib/components/EButton.svelte"
	import PublicEvents from "$lib/components/PublicEvents.svelte"

	export let data: HomePageData

	// State
	let eventTimeWindow = 'week'
	let showSearch = false

	const setEventTimeWindow = (newTimeWindow: string) => {
		if (eventTimeWindow === newTimeWindow) {
			eventTimeWindow = ''
		} else {
			eventTimeWindow = newTimeWindow
		}
	}

	const toggleSearch = () => showSearch = !showSearch

	const showSavedEvents = () => {
		// TODO: global modal state
	}
</script>

<svelte:head>
	<title>Esponja – Eventos de Música Alternativa en la Ciudad de México</title>
</svelte:head>

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
		Este mes
	</EButton>
	<EButton 
		on:click={() => setEventTimeWindow('month')}
		class={'month' === eventTimeWindow ? 'selected' : ''}
	>
		Este mes
	</EButton>
</nav>

<nav id="pageNavigation">
	<EButton 
		on:click={() => showSavedEvents()}
		class="saved icon"
	>
		Guardados
	</EButton>
	<EButton 
		on:click={() => toggleSearch()}
		class="search icon"
	>
		Buscar
	</EButton>
	<ButtonLink href="/info">
		Info
	</ButtonLink>
</nav>

<PublicEvents events={data.events} venues={data.venues} />

<style lang="scss">
	#pageNavigation {
		display: flex;
		width: 100%;
		align-items: flex-end;
		margin-top: var(--spacing);
	}
</style>
