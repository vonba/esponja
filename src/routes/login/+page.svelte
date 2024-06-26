<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { loginSession } from '../../stores'
	import { focusOnFirstError } from '$lib/focus'
	import EButton from '$lib/components/EButton.svelte'
	import ButtonLink from '$lib/components/ButtonLink.svelte'

	// States
	let focusedField: HTMLInputElement
	let message: string
	let loading = false
	const credentials: Credentials = {
		email: '',
		password: ''
	}

	async function login(e: Event) {
		e.preventDefault()
		message = ''
		const form = <HTMLFormElement>document.getElementById('signIn')

		if (form.checkValidity()) {
			loading = true
			try {
				await loginLocal(credentials)
			} catch (err) {
				if (err instanceof Error) {
					console.error('Login error', err.message)
					message = err.message
				}
			}
			loading = false
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
				let message = err.message
				if ('login-fail' === err.message) message = 'No pudimos autenticar el usuario'
				throw new Error(message)
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
		<h1 class="">Bienvenidx</h1>

		<fieldset disabled={loading}>
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
				<div class="invalidFeedback">Se requiere el correo electrónico</div>
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
			<p class="loginMessage">{message}</p>
		{/if}
		
		<div class="flex">
			<EButton on:click={login} disabled={loading} class="large">
				{loading ? 'Cargando...' : 'Ingresar'}
			</EButton>
			<ButtonLink href="/" class="large">Cancelar</ButtonLink>
		</div>
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

	.loginMessage {
		font-weight: bold;
	}
</style>
