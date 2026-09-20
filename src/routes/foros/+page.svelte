<!-- Public listing of all (non-hidden) venues -->
<script lang="ts">
	import type { PageData } from './$types'
	import PublicHeader from '$lib/components/PublicHeader.svelte'
	import PublicVenues from '$lib/components/PublicVenues.svelte'
	import { PUBLIC_DOMAIN } from '$env/static/public'

	export let data: PageData

	// State
	let searchString = ''

	const handleSearchChange = (newSearchString: string) => searchString = newSearchString
</script>

<svelte:head>
	<title>Foros – Esponja</title>
	<meta property="og:title" content="Foros – Esponja" />
	<meta property="og:description" content="Foros de música alternativa en la Ciudad de México" />
	<meta name="description" content="Foros de música alternativa en la Ciudad de México">
	<meta property="og:image" content="{PUBLIC_DOMAIN}/esponja-preview.jpg" />
	<meta property="og:type" content="website" />
</svelte:head>

<PublicHeader section="foros" {handleSearchChange} />

<section id="venuesPage">
	<PublicVenues venues={data.venues} events={data.events} {searchString} />
</section>
