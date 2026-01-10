<script lang="ts">
	import { onMount } from 'svelte'
	import { page } from '$app/stores'
	import PublicLogo from '$lib/components/PublicLogo.svelte'
	import EButton from '$lib/components/EButton.svelte'

	let loading = false
	let confirming = false
	let message = ''
	let success = false
	let token = ''
	let tokenValid = false

	onMount(() => {
		token = $page.url.searchParams.get('token') || ''

		if (!token) {
			message = 'Token no válido'
			tokenValid = false
		} else {
			tokenValid = true
			confirming = true
		}
	})

	async function handleUnsubscribe() {
		loading = true
		confirming = false

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
	}
</script>

<svelte:head>
	<title>Cancelar suscripción - Esponja</title>
</svelte:head>

<PublicLogo />

<div class="unsubscribe">
	{#if confirming}
		<div class="confirmation">
			<h2>Cancelar suscripción al boletín semanal</h2>
			<p>¿Estás seguro que quieres cancelar tu suscripción al boletín de eventos de Esponja?</p>
			<p class="subdued">Ya no recibirás correos con los eventos de la semana.</p>

			<div class="buttons">
				<EButton class="large secondary" on:click={() => (window.location.href = '/eventos')}>
					Cancelar
				</EButton>
				<EButton class="large" on:click={handleUnsubscribe}>
					Confirmar cancelación
				</EButton>
			</div>
		</div>
	{:else if loading}
		<p>Procesando...</p>
	{:else if !tokenValid}
		<div class="message error">
			<h2>✗</h2>
			<p>{message}</p>
		</div>
		<EButton class="large" on:click={() => (window.location.href = '/eventos')}>
			Volver a eventos
		</EButton>
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

		.confirmation {
			h2 {
				color: var(--colorGreen);
				margin-bottom: var(--spacing);
			}

			p {
				margin-bottom: var(--spacing);
			}

			.subdued {
				color: var(--colorGray);
				font-size: 0.9em;
				margin-bottom: var(--double);
			}

			.buttons {
				display: flex;
				gap: var(--spacing);
				justify-content: center;
				margin-top: var(--double);
			}
		}

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
