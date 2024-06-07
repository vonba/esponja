<script lang="ts">
	import { onMount } from 'svelte'
	import type { LayoutServerData } from './$types'
	import { goto, beforeNavigate } from '$app/navigation'
	import { loginSession, toast } from '../stores'

	// import { initializeGoogleAccounts } from '$lib/google'

	export let data: LayoutServerData

	// If returning from different website, runs once (as it's an SPA) to restore user session if session cookie is still valid
	const { user } = data
	$loginSession = user

	let Toast: any

	beforeNavigate(() => {
		let expirationDate = $loginSession?.expires ? new Date($loginSession.expires) : undefined

		if (expirationDate && expirationDate < new Date()) {
			console.log('Login session expired.')
			$loginSession = null
		}
	})

	const openToast = (open: boolean) => {
		if (open) {
			const toastDiv = <HTMLDivElement>document.getElementById('authToast')
			const t = new Toast(toastDiv)
			t.show()
		}
	}

	$: openToast($toast.isOpen)
</script>

<nav id="siteNavigation">
	<button>Hoy</button>
</nav>

<main class="container">
	<slot />

	<div
		id="authToast"
		class="toast position-fixed top-0 end-0 m-3"
		role="alert"
		aria-live="assertive"
		aria-atomic="true"
	>
		<div class="toast-header bg-primary text-white">
			<strong class="me-auto">{$toast.title}</strong>
			<button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
		</div>
		<div class="toast-body">
			{$toast.body}
		</div>
	</div>
</main>

<style lang="scss" global>
	* {
		box-sizing: border-box;
		// Make Retina displays crisper
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	form:not(.validationErrors) {
		.invalidFeedback {
			display: none;
		}
	}
</style>
