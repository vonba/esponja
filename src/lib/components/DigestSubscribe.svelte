<script lang="ts">
	import { fade } from 'svelte/transition'
	import EButton from './EButton.svelte'

	let email = ''
	let loading = false
	let message = ''
	let messageType: 'success' | 'error' | 'info' = 'info'
	let isSubscribed = false
	let visible = true

	function handleClose() {
		visible = false
	}

	async function handleSubmit() {
		if (!email) {
			message = 'Por favor ingresa tu correo electrónico'
			messageType = 'error'
			return
		}

		loading = true
		message = ''

		try {
			const response = await fetch('/api/v1/digest-subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			})

			const data = await response.json()

			if (response.ok) {
				message = data.message
				messageType = 'success'
				isSubscribed = true
				email = ''

				// Auto-hide after 5 seconds on success
				setTimeout(() => {
					visible = false
				}, 5000)
			} else {
				message = data.message || 'Error al suscribirse'
				messageType = 'error'
			}
		} catch (err) {
			console.error('Subscribe error:', err)
			message = 'Error de conexión. Por favor intenta de nuevo.'
			messageType = 'error'
		} finally {
			loading = false
		}
	}
</script>

{#if visible}
	<div class="digestSubscribe" transition:fade={{ duration: 300 }}>
		<button class="closeButton" on:click={handleClose} aria-label="Cerrar">✕</button>

		<h3>Boletín Semanal</h3>
		<p>
			Recibe cada miércoles los eventos de la semana<br class="mobileOnly" />
			en tu correo.
		</p>

		{#if !isSubscribed}
			<form on:submit|preventDefault={handleSubmit}>
				<div class="inputContainer">
					<input
						type="email"
						bind:value={email}
						placeholder="tu@correo.com"
						disabled={loading}
						required
					/>
				</div>
				<EButton type="submit" disabled={loading}>
					{loading ? 'Suscribiendo...' : 'Suscribirme'}
				</EButton>
			</form>
		{/if}

		{#if message}
			<div class="message {messageType}">
				{message}
			</div>
		{/if}
	</div>
{/if}

<style lang="scss">
	@use "$lib/sass/variables" as *;

	br.mobileOnly {
		@media (min-width: $mediaM) {
			display: none;
		}
	}

	.digestSubscribe {
		position: relative;
		border: 1px solid var(--colorGreen);
		border-radius: var(--borderRadius);
		padding: var(--double);
		margin: var(--double) 0;
		text-align: center;
		background-color: var(--colorOffWhite);

		@media (max-width: $mediaM) {
			margin-top: 4em;
		}

		h3 {
			margin: 0 0 0.5em 0;
			color: var(--colorGreen);
			font-size: var(--fsTitleMedium);
		}

		p {
			margin: 0 0 1em 0;
		}

		.closeButton {
			position: absolute;
			top: var(--spacing);
			right: var(--spacing);
			background: none;
			border: none;
			font-size: 1.5em;
			color: var(--colorGreen);
			cursor: pointer;
			padding: 0;
			width: 30px;
			height: 30px;
			display: flex;
			align-items: center;
			justify-content: center;
			line-height: 1;
			opacity: 0.6;
			transition: opacity 0.2s;

			&:hover {
				opacity: 1;
			}
		}

		form {
			display: flex;
			gap: var(--spacing);
			align-items: center;
			justify-content: center;
		}

		.inputContainer {
			margin: 0;
			padding: 0;
			flex: 1;
			max-width: 300px;

			input {
				width: 100%;
			}
		}

		.message {
			margin-top: var(--spacing);
			padding: var(--spacing);
			border-radius: var(--borderRadius);

			&.success {
				background-color: #e8f5e9;
				color: var(--colorGreen);
			}

			&.error {
				background-color: #ffebee;
				color: var(--colorRed);
			}

			&.info {
				background-color: #e3f2fd;
				color: var(--colorBlue);
			}
		}
	}
</style>
