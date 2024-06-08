<script lang="ts">
	import type { PageData } from './$types'
	import { goto } from '$app/navigation'
	import { fade } from 'svelte/transition';

	import EditUser from '$lib/components/EditUser.svelte';
	import Tabs from '$lib/components/Tabs.svelte'
	import Users from '$lib/components/Users.svelte'
	import Venues from '$lib/components/Venues.svelte'
	import { loginSession } from '../../stores'
	import EButton from '$lib/components/EButton.svelte'
	import AdminEvents from '$lib/components/AdminEvents.svelte'


	// Component props
	export let data: AdminPageData
	const { user } = data;

	// Tabs
  let activeTab = 0
	const setActiveTab = (t: number) => activeTab = t
	
	let titles = ['Eventos', 'Foros', null, 'Cuenta']
	if (user?.role === 'admin') {
		titles = ['Eventos', 'Foros', 'Usuarios', 'Cuenta']
	}

	async function logout(e: Event) {
		e.preventDefault()

		// Request server delete httpOnly cookie called loginSession
		const url = '/auth/logout'
		const res = await fetch(url, {
			method: 'POST'
		})
		if (res.ok) {
			loginSession.set(undefined) // delete loginSession.user from
			goto('/login')
		} else console.error(`Logout not successful: ${res.statusText} (${res.status})`)
	}
</script>

<svelte:head>
	<title>Esponja Admin</title>
</svelte:head>

<Tabs {titles} {activeTab} {setActiveTab}>
	{#if activeTab === 0}
		<div in:fade>
			<AdminEvents events={data.events} venues={data.venues} />
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
			<EButton on:click={logout}>
				Salir
			</EButton>
		</div>
	{/if}
</Tabs>