<script lang="ts">
	import { goto } from '$app/navigation'
	import { fade } from 'svelte/transition';
	import EditUser from '$lib/components/EditUser.svelte';
	import Tabs from '$lib/components/Tabs.svelte'
	import AdminUsers from '$lib/components/AdminUsers.svelte'
	import { loginSession } from '../../stores'
	import EButton from '$lib/components/EButton.svelte'
	import AdminEvents from '$lib/components/AdminEvents.svelte'
	import AdminLogo from '$lib/components/AdminLogo.svelte'
	import AdminVenues from '$lib/components/AdminVenues.svelte'


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
			goto('/')
		} else console.error(`Logout not successful: ${res.statusText} (${res.status})`)
	}
</script>

<svelte:head>
	<title>Esponja Admin</title>
</svelte:head>

<AdminLogo />

<Tabs {titles} {activeTab} {setActiveTab}>
	{#if activeTab === 0}
		<div in:fade>
			<AdminEvents events={data.events} venues={data.venues} users={data.users} />
		</div>
	{:else if activeTab === 1}
		<div in:fade>
			<AdminVenues venues={data.venues} />
		</div>
	{:else if activeTab === 2 && user?.role === 'admin'}
		<div in:fade>
			<AdminUsers users={data.users} />
		</div>
	{:else if activeTab === 3}
		<div in:fade class="center">
			<EditUser 
				user={data.user}
				showCloseButton={false}
			/>

			<div class="logoutWrapper alignCenter">
				<p class="mt">¿Quieres salir de tu cuenta?</p>
				<EButton on:click={logout} class="large">
					Log out
				</EButton>
			</div>
		</div>
	{/if}
</Tabs>

<style lang="scss">
	@import "$lib/sass/variables";

	.logoutWrapper {
		max-width: $mediaM;
		margin: var(--spacing) auto;
		padding: calc(var(--spacing)) 0;
		border-top: 1px solid var(--colorGreen);
	}
</style>