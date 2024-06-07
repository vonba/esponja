<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { loginSession } from '../../stores'
	import { focusOnFirstError } from '$lib/focus'
	import { initializeGoogleAccounts, renderGoogleButton } from '$lib/google'

	let focusedField: HTMLInputElement
	let message: string
	const credentials: Credentials = {
		email: '',
		password: ''
	}

	async function login() {
		message = ''
		const form = <HTMLFormElement>document.getElementById('signIn')

		if (form.checkValidity()) {
			try {
				await loginLocal(credentials)
			} catch (err) {
				if (err instanceof Error) {
					console.error('Login error', err.message)
					message = err.message
				}
			}
		} else {
			form.classList.add('.validationErrors')
			focusOnFirstError(form)
		}
	}

	onMount(() => {
		// initializeGoogleAccounts()
		// renderGoogleButton()

		focusedField.focus()
	})

	async function loginLocal(credentials: Credentials) {
		try {
			const res = await fetch('/auth/login', {
				method: 'POST',
				body: JSON.stringify(credentials),
				headers: {
					'Content-Type': 'application/json'
				}
			})
			const fromEndpoint = await res.json()
			if (res.ok) {
				loginSession.set(fromEndpoint.user)
				const { role } = fromEndpoint.user
				const referrer = $page.url.searchParams.get('referrer')
				if (referrer) {
					goto(referrer)
				} else {
					goto('/')
				}
			} else {
				throw new Error(fromEndpoint.message)
			}
		} catch (err) {
			if (err instanceof Error) {
				console.error('Login error', err)
			}
		}
	}
</script>

<svelte:head>
	<title>Esponja Admin – Ingresar</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="loginWrapper">
	<h2>Ingresar</h2>
	
	<form id="signIn" autocomplete="on" novalidate>
		<fieldset>
			<div>
				<label for="email">Email</label>
				<input
					type="email"
					bind:this={focusedField}
					bind:value={credentials.email}
					required
					placeholder="Email"
					autocomplete="email"
				/>
				<div class="invalidFeedback">Email address required</div>
			</div>
			<div>
				<label for="password">Password</label>
				<input
					type="password"
					bind:value={credentials.password}
					required
					minlength="8"
					maxlength="80"
					placeholder="Contraseña"
					autocomplete="current-password"
				/>
				<div class="invalidFeedback">Password with 8 chars or more required</div>
				<div class="form-text">
					Password minimum length 8, must have one capital letter, 1 number, and one unique
					character.
				</div>
			</div>
		</fieldset>

		<div>
			<a href="/forgot">¿Olvidaste tu contraseña?</a>
		</div>

		{#if message}
			<p class="text-danger">{message}</p>
		{/if}
		<div class="d-grid gap-2">
			<button on:click|preventDefault={login} class="btn btn-primary btn-lg">Ingresar</button>
		</div>
	</form>
</div>

<style lang="scss">
	
</style>
