<!-- This is the public home page of the app -->
<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment'
	import { goto } from "$app/navigation"
	import PublicEvents from "$lib/components/PublicEvents.svelte"
	import PublicHeader from "$lib/components/PublicHeader.svelte"
	import DigestSubscribe from "$lib/components/DigestSubscribe.svelte"
	import { getDateFiltersFromTimeWindow } from "$lib/dateTime"
	import { lastEventsPath } from '../../stores'
	import { PUBLIC_DOMAIN } from '$env/static/public'

	export let data: HomePageData

	// State
  let searchString = ''
	let displayMode = 'grid'

	// The date filter comes from the URL: /eventos (everything), /hoy, /manana, /semana
	$: eventTimeWindow = $page.params.slug ?? 'eventos'
	$: dateFilters = getDateFiltersFromTimeWindow(eventTimeWindow)
	// Remembered so the "Eventos" button on /foros comes back to the same view. Browser only:
	// on the server this store would be shared by every visitor.
	$: if (browser) $lastEventsPath = `/${eventTimeWindow}`

	// Clicking the selected filter again goes back to all events
	const setEventTimeWindow = (newTimeWindow: string) => {
		const nextTimeWindow = newTimeWindow && newTimeWindow !== eventTimeWindow ? newTimeWindow : 'eventos'
		goto(`/${nextTimeWindow}`, { replaceState: true })
	}

  const handleSearchChange = (newSearchString: string) => searchString = newSearchString
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
	<PublicEvents 
		{eventTimeWindow}
		events={data.events} 
		venues={data.venues} 
		startDate={dateFilters.startDate} 
		endDate={dateFilters.endDate} 
		{searchString}
		{displayMode}
	/>
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
