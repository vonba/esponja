<script lang="ts">
	import type { LayoutServerData } from './$types'
	import { beforeNavigate } from '$app/navigation'
	import { loginSession } from '../stores'
	import LikedEventsPopup from '$lib/components/LikedEventsPopup.svelte';

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

<LikedEventsPopup />

<footer id="siteFooter">
	<div class="contentWrapper">
		<img src="/esponja-logo-offwhite.svg" alt="Esponja logo" />
	
		<p>
			Esponja es una plataforma gratuita y sin fines de lucro 
			para publicar eventos de música alternativa en la Ciudad de México.
		</p>
	
		Contacto: <a href="mailto:hola@esponja.mx">hola@esponja.mx</a>
	</div>
</footer>

<style lang="scss">
	* {
		--footerHeight: 300px;
	}

	main {
		min-height: calc(100vh - var(--footerHeight) - 1px);
	}

	#siteFooter {
		background-color: var(--colorGreen);
		color: var(--colorOffWhite);
		padding: var(--spacing);
		padding-top: 40px;
		height: var(--footerHeight);
		
		img {
			height: 40px;
			margin: 20px 0;
		}

		a {
			color: var(--colorOffWhite);
		}

		.contentWrapper {
			padding: var(--spacing);
			border-radius: var(--borderRadius);
			max-width: 24em;
			text-align: center;
			margin: 0 auto;
		}
	}
</style>
