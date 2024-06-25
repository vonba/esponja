<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { focusOnFirstError } from '$lib/focus'
	import EButton from '$lib/components/EButton.svelte'

	let focusedField: HTMLInputElement
	let email: string
	let message: string
	let loading = false
	let done = false

	onMount(() => {
		focusedField.focus()
	})

	const sendPasswordReset = async (e: Event) => {
		e.preventDefault()
		message = ''
		const form = <HTMLFormElement>document.getElementById('forgot')

		if (form.checkValidity()) {
			const url = `/auth/forgot`
			loading = true
			const res = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email })
			})

			if (res.ok) {
				done = true
				message = '¡Listo! Revisa tu correo.'
			}
			loading = false
		} else {
			form.classList.add('validationErrors')
			focusOnFirstError(form)
		}
	}
</script>

<svelte:head>
	<title>Esponja Admin – Olvidé mi contraseña</title>
</svelte:head>

<div class="forgotWrapper">
	
	<form id="forgot" novalidate>
		
		{#if !done}
			<h1>Olvidé mi contraseña :(</h1>
			<p>
				Ingresa tu correo electrónico y te mandamos una liga para cambiar tu contraseña.
			</p>

			<fieldset disabled={loading}>
				<div class="inputContainer">
					<label for="email">Tu correo electrónico</label>
					<input
						bind:this={focusedField}
						bind:value={email}
						type="email"
						id="email"
						required
					/>
					<div class="invalidFeedback">Se requiere el correo electrónico</div>
				</div>
			</fieldset>

			<EButton 
				on:click={sendPasswordReset} 
				class="large" 
				disabled={loading}
			>
				Enviar
			</EButton>
		{/if}

		{#if message}
			<p class="message">{message}</p>
		{/if}

		<p class="justifyCenter mt">
			<a href="/login">Regresar a login</a>
		</p>
	</form>
</div>

<style lang="scss">
	.forgotWrapper {
		height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;

		form {
			border: 1px solid var(--colorGreen);
			border-radius: var(--borderRadius);
			padding: var(--double);
			margin: var(--double);
			width: 100%;
			max-width: 20em;
		}

		:global(button.large) {
			width: 100%;
		}

		.message {
			font-weight: bold;
		}
	}
</style>
