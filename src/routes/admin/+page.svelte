<script lang="ts">
	import type { PageData } from './$types'
	import { fade } from 'svelte/transition';
	import EditUser from '$lib/components/EditUser.svelte';
	import Tabs from '$lib/components/Tabs.svelte'
	import Users from '$lib/components/Users.svelte'
	import Venues from '$lib/components/Venues.svelte'
	import Events from '$lib/components/Events.svelte'

	// Component props
	export let data: PageData
	const { user } = data;

	// Tabs
  let activeTab = 0
	const setActiveTab = (t: number) => activeTab = t
	
	let titles = ['Eventos', 'Foros', null, 'Cuenta']
	if (user?.role === 'admin') {
		titles = ['Eventos', 'Foros', 'Usuarios', 'Cuenta']
	}
</script>

<svelte:head>
	<title>Esponja Admin</title>
</svelte:head>

<Tabs {titles} {activeTab} {setActiveTab}>
	{#if activeTab === 0}
		<div in:fade>
			<Events events={data.events} />
		</div>
	{:else if activeTab === 1}
		<div in:fade>
			<Venues venues={data.venues} />
		</div>
	{:else if activeTab === 2 && user?.role === 'admin'}
		<div in:fade>
			<Users users={data.users} />
		</div>
	{:else if activeTab === 3}
		<div in:fade>
			<EditUser user={data.user} />
		</div>
	{/if}
</Tabs>