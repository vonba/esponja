<script lang="ts">
	import { beforeNavigate } from '$app/navigation'
	import { loginSession } from '../stores'
	import { navigating } from '$app/stores'
	import animationData from '$lib/lottie/esponja1.json';

	// Analytics
	import { dev } from '$app/environment'
	import { inject } from '@vercel/analytics'
	inject({ mode: dev ? 'development' : 'production' })

	// Global styles
	import '../styles/app.scss'
	import ButtonLink from '$lib/components/ButtonLink.svelte'
	import LoadingIndicator from '$lib/components/LoadingIndicator.svelte'
	import Lottie from '$lib/components/Lottie.svelte'

	// NOTE the logged-in user is deliberately not loaded here. Public pages are cached by the
	// CDN and shared by every visitor, so nothing on them may depend on who is logged in. The
	// admin panel and the login page set loginSession themselves.

	beforeNavigate(() => {
		let expirationDate = $loginSession?.expires ? new Date($loginSession.expires) : undefined

		if (expirationDate && expirationDate < new Date()) {
			console.log('Login session expired.')
			$loginSession = null
		}
	})

	// Only show the loader when a navigation takes long enough to notice, so quick ones
	// (most of them, with preloading and cached data) don't flash it
	let showLoader = false
	let loaderTimeout: ReturnType<typeof setTimeout>
	$: {
		clearTimeout(loaderTimeout)
		if ($navigating) loaderTimeout = setTimeout(() => (showLoader = true), 150)
		else showLoader = false
	}
</script>

<main class="container">
	<slot />
</main>

<footer id="siteFooter">
	<div class="contentWrapper">
		<!-- <img src="/esponja-blob-offwhite.svg" alt="Esponja logo" /> -->
		 <Lottie {animationData} />
	
		<p>
			Esponja es una plataforma gratuita y sin fines de lucro 
			para publicar eventos de música alternativa en la Ciudad de México.
		</p>
		
		<p>
			Contacto: <a href="mailto:hola@esponja.mx">hola@esponja.mx</a>
		</p>

		<p>
			Desarrollado por <a href="https://balthazaurus.com">Balthazaurus</a>
		</p>

		<p>
			<ButtonLink href="/admin">Admin</ButtonLink>
		</p>
	</div>
</footer>

{#if showLoader}
	<LoadingIndicator />
{/if}


<style lang="scss">
	* {
		--footerHeight: 480px;
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
		font-style: italic;
		
		:global(.lottieContainer) {
			height: 140px;
			margin: 20px 0;
		}

		a {
			color: var(--colorOffWhite);
		}

		.contentWrapper {
			/* padding: var(--spacing); */
			border-radius: var(--borderRadius);
			max-width: 24em;
			text-align: center;
			margin: 0 auto;
		}
	}

</style>
