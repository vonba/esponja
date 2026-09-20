<!-- This is the public home page of the app -->
<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from "$app/navigation"
	import PublicEvents from "$lib/components/PublicEvents.svelte"
	import PublicHeader from "$lib/components/PublicHeader.svelte"
	import DigestSubscribe from "$lib/components/DigestSubscribe.svelte"
	import { getDateFiltersFromTimeWindow, getDateString } from "$lib/dateTime"
	import { afterUpdate, onMount } from 'svelte'
	import { lastEventsPath } from '../../stores'
	import { PUBLIC_DOMAIN } from '$env/static/public'
	import LoadingIndicator from '$lib/components/LoadingIndicator.svelte'
	import type { Snapshot } from '../$types'

	// State
	let eventTimeWindow: string | undefined
	let eventFilterDateStart: string | null  // YYYY-MM-DD
	let eventFilterDateEnd: string | null // YYYY-MM-DD
	let slug = ''
  let searchString = ''
	let displayMode = 'grid'

	// State for fetching data (ISR)
	let loading = true;
	let data: HomePageData = {
		venues: [],
		events: [],
	}
	
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

		const { startDate, endDate } = getDateFiltersFromTimeWindow(eventTimeWindow)
		eventFilterDateStart = startDate
		eventFilterDateEnd = endDate

		$lastEventsPath = `/${eventTimeWindow || 'eventos'}`
		goto(`/${eventTimeWindow}`, { replaceState: true })
	}
  $: (slug = $page.params.slug || '');

  const handleSearchChange = (newSearchString: string) => searchString = newSearchString

	afterUpdate(() => {
		window.scrollTo(scrollX, scrollY)
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
		const dateString = getDateString()
		const eventResponse = await fetch(`/api/v1/event?today=${dateString}`, {
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

<PublicHeader
	section="eventos"
	{eventTimeWindow}
	{setEventTimeWindow}
	{handleSearchChange}
/>

<section id="digestSection">
	<DigestSubscribe />
</section>

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
	@use "$lib/sass/variables" as *;

	#homePage {
		@media (max-width: $mediaM) {
			// To compensate for .smallButtons which has an absolute position
			margin-top: 35px;
		}
	}

	#digestSection {
		max-width: 800px;
		margin: 0 auto;
		padding: 0 var(--spacing);
	}
</style>
