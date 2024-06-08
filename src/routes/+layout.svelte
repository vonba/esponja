<script lang="ts">
	import { onMount } from 'svelte'
	import type { LayoutServerData } from './$types'
	import { goto, beforeNavigate } from '$app/navigation'
	import { loginSession, toast } from '../stores'

	// Global styles
	import '../styles/app.scss'

	export let data: LayoutServerData

	// If returning from different website, runs once (as it's an SPA) to restore user session if session cookie is still valid
	const { user } = data
	$loginSession = user

	beforeNavigate(() => {
		let expirationDate = $loginSession?.expires ? new Date($loginSession.expires) : undefined

		if (expirationDate && expirationDate < new Date()) {
			console.log('Login session expired.')
			$loginSession = null
		}
	})
</script>

<main class="container">
	<slot />
</main>

<style lang="scss" global>

</style>
