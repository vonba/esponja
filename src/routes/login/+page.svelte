<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { loginSession } from '../../stores'
	import { focusOnFirstError } from '$lib/focus'
	// import { initializeGoogleAccounts, renderGoogleButton } from '$lib/google'
	import EButton from '$lib/components/EButton.svelte'
	import ButtonLink from '$lib/components/ButtonLink.svelte'

	let focusedField: HTMLInputElement
	let message: string
	const credentials: Credentials = {
		email: '',
		password: ''
	}

	async function login(e: Event) {
		e.preventDefault()
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
	<form id="signIn" autocomplete="on" novalidate>
		<h1>Bienvenidx</h1>

		<fieldset>
			<div class="inputContainer">
				<label for="email">Correo electrónico</label>
				<input
					type="email"
					bind:this={focusedField}
					bind:value={credentials.email}
					required
					placeholder="Correo electrónico"
					autocomplete="email"
				/>
				<div class="invalidFeedback">Introducir correo electrónico</div>
			</div>
			<div class="inputContainer">
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
				<div class="invalidFeedback">Introducir contraseña</div>
			</div>
		</fieldset>

		<p>
			<a href="/forgot">¿Olvidaste tu contraseña?</a>
		</p>

		{#if message}
			<p class="text-danger">{message}</p>
		{/if}
		
		<EButton on:click={login}>Ingresar</EButton>
		<ButtonLink href="/info">Cancelar</ButtonLink>
	</form>
</div>

<style lang="scss">
	.loginWrapper {
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
	}
</style>
