<script lang="ts">
	import type { PageData } from './$types'
	import { onMount } from 'svelte'
	import { focusOnFirstError } from '$lib/focus'
	import EButton from '$lib/components/EButton.svelte'

	export let data: PageData

	let focusedField: HTMLInputElement
	let password: string
	let confirmPassword: HTMLInputElement
	let message: string
	let loading = false
	let done = false

	onMount(() => {
		focusedField.focus()
	})

	const passwordMatch = () => {
		if (!password) password = ''
		return password == confirmPassword.value
	}

	const resetPassword = async () => {
		message = ''
		const form = <HTMLFormElement>document.getElementById('reset')

		if (!passwordMatch()) {
			confirmPassword.classList.add('is-invalid')
		}

		if (form.checkValidity()) {
			const url = `/auth/reset`
			const res = await fetch(url, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					token: data.token,
					password
				})
			})

			if (res.ok) {
				message = 'Tu contraseña fue cambiada'
				done = true
			} else {
				const body = await res.json()
				message = body.message
			}
		} else {
			form.classList.add('validationErrors')
			focusOnFirstError(form)
		}
	}
</script>

<svelte:head>
	<title>Esponja Admin – Cambiar tu contraseña</title>
</svelte:head>

<div class="changePasswordWrapper">
	<form id="reset" autocomplete="on" novalidate>
		
		{#if !done}
			<h1>Cambiar mi contraseña</h1>
			
			<p>Ingresa tu nueva contraseña</p>
			
			<fieldset disabled={loading}>
				<div class="inputContainer">
					<label for="password">Contraseña</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						bind:this={focusedField}
						minlength="8"
						maxlength="80"
					/>
					<div class="invalidFeedback">La contraseña debe tener un mínimo de 8 carácteres</div>
				</div>

				<div class="inputContainer">
					<label for="passwordConfirm">Contraseña (repetir)</label>
					<input
						id="passwordConfirm"
						type="password"
						required={!!password}
						bind:this={confirmPassword}
						minlength="8"
						maxlength="80"
					/>
					<div class="invalidFeedback">Las contraseñas deben coincidir</div>
				</div>
			</fieldset>

			<EButton 
				on:click={resetPassword}
				class="large mt"
				disabled={loading}
			>
				Guardar
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
	.changePasswordWrapper {
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
