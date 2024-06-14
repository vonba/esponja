<script lang="ts">
	import type { LayoutServerData } from './$types'
	import { beforeNavigate } from '$app/navigation'
	import { loginSession } from '../stores'

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
