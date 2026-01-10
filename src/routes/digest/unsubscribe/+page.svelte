<script lang="ts">
	import { onMount } from 'svelte'
	import { page } from '$app/stores'
	import PublicLogo from '$lib/components/PublicLogo.svelte'
	import EButton from '$lib/components/EButton.svelte'

	let loading = true
	let message = ''
	let success = false
	let token = ''

	onMount(async () => {
		token = $page.url.searchParams.get('token') || ''

		if (!token) {
			message = 'Token no válido'
			loading = false
			return
		}

		try {
			const response = await fetch('/api/v1/digest-unsubscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token })
			})

			const data = await response.json()

			if (response.ok) {
				message = data.message
				success = true
			} else {
				message = data.message || 'Error al cancelar suscripción'
			}
		} catch (err) {
			console.error('Unsubscribe error:', err)
			message = 'Error de conexión'
		} finally {
			loading = false
		}
	})
</script>

<svelte:head>
	<title>Cancelar suscripción - Esponja</title>
</svelte:head>

<PublicLogo />

<div class="unsubscribe">
	{#if loading}
		<p>Procesando...</p>
	{:else}
		<div class="message {success ? 'success' : 'error'}">
			<h2>{success ? '✓' : '✗'}</h2>
			<p>{message}</p>
		</div>

		{#if success}
			<p>
				Lamentamos verte partir. Puedes volver a suscribirte en cualquier momento desde nuestra <a
					href="/eventos">página principal</a
				>.
			</p>
		{/if}

		<EButton class="large" on:click={() => (window.location.href = '/eventos')}>
			Volver a eventos
		</EButton>
	{/if}
</div>

<style lang="scss">
	.unsubscribe {
		max-width: 600px;
		margin: var(--double) auto;
		padding: var(--spacing);
		text-align: center;

		.message {
			padding: var(--double);
			border-radius: var(--borderRadius);
			margin-bottom: var(--double);

			h2 {
				font-size: 3em;
				margin: 0;
			}

			&.success {
				background-color: #e8f5e9;
				color: #2e7d32;
			}

			&.error {
				background-color: #ffebee;
				color: #c62828;
			}
		}

		a {
			color: var(--colorGreen);
			text-decoration: underline;
		}
	}
</style>
