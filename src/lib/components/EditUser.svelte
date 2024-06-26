<script lang="ts">
	import { onMount } from 'svelte'
	import { focusOnFirstError } from '$lib/focus'
	import { loginSession } from '../../stores'
	import {createEventDispatcher} from 'svelte';
	import EButton from './EButton.svelte'
	
	const dispatch = createEventDispatcher();

	export let showCloseButton = true
	export let user: User;
	if (!user) {
		user = {
			id: 0,
			role: 'contributor',
			firstName: '',
			lastName: '',
			password: '',
			email: '',
			blocked: false,
		}
	}
	$: isNewUser = user.id === 0
	$: isOwnUser = !isNewUser && user.id === $loginSession?.id

	let focusedField: HTMLInputElement
	let message: string
	let confirmPassword: HTMLInputElement

	onMount(() => {
		focusedField.focus()
	})

	async function update() {
		message = ''
		const form = <HTMLFormElement>document.getElementById('profile')

		if (!passwordMatch()) {
			confirmPassword.classList.add('is-invalid')
			return
		}

		if (form.checkValidity()) {
			// Use API route for update and auth route for creating
			const url = !isNewUser ? '/api/v1/user' : '/auth/register'
			const method = !isNewUser ? 'PUT' : 'POST'

			try {
				const res = await fetch(url, {
					method,
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(user)
				})
				const reply = await res.json()
				message = reply.message
				if (isOwnUser) {
					$loginSession = JSON.parse(JSON.stringify(user))
				}
				if (res.ok) {
					if (user) {
						// Reset password fields to be sure
						user.password = ''
						confirmPassword.value = ''
					}
					dispatch('saved', { reply })
				}
			} catch (error) {
				message = 'API unavailable'
			}
		} else {
			form.classList.add('validationErrors')
			focusOnFirstError(form)
		}
	}

	const passwordMatch = () => {
		return !user.password || user?.password === confirmPassword?.value
	}
</script>

<div class="editUser">
	
	<h2>
		{#if isOwnUser}
			Modificar tu cuenta
		{:else if !isNewUser}
			Modificar usuario
		{:else}
			Nuevo usuario
		{/if}
	</h2>

	<form id="profile" autocomplete="on" novalidate class="mt-3">
		<div class="inputContainer">
			<label for="email">Correo electrónico</label>
			<input
				bind:this={focusedField}
				type="email"
				bind:value={user.email}
				required
				placeholder="Correo electrónico"
				id="email"
				autocomplete="email"
			/>
			<div class="invalidFeedback">Se requiere dirección de correo electrónico</div>
		</div>
		
		{#if isNewUser || isOwnUser}
			<div class="inputContainer">
				<label for="password">Contraseña</label>
				<input
					type="password"
					id="password"
					bind:value={user.password}
					minlength="8"
					maxlength="80"
					placeholder="Contraseña"
				/>
				<div class="invalidFeedback">Se requiere una contraseña con 8 caracteres o más</div>
				<div class="form-text">
					Mínimo 8 caracteres, una letra mayúscula, un número y un carácter especial.
				</div>
			</div>
			<div class="inputContainer">
				<label for="password">Confirmar contraseña</label>
				<input
					type="password"
					id="passwordConfirm"
					bind:this={confirmPassword}
					required={!!(user.password)}
					minlength="8"
					maxlength="80"
					placeholder="Contraseña (de nuevo)"
					autocomplete="new-password"
				/>
			</div>
		{/if}

		<div class="inputContainer">
			<label for="firstName">Nombre</label>
			<input
				bind:value={user.firstName}
				id="firstName"
				required
				placeholder="Nombre"
				autocomplete="given-name"
			/>
			<div class="invalidFeedback">Se requiere el nombre</div>
		</div>
		<div class="inputContainer">
			<label for="lastName">Apellido</label>
			<input
				bind:value={user.lastName}
				id="lastName"
				required
				placeholder="Apellido"
				autocomplete="family-name"
			/>
			<div class="invalidFeedback">Se requiere el apellido</div>
		</div>

		<div class="inputContainer flex alignCenter">
			<input
				type="checkbox"
				bind:checked={user.blocked}
				id="hidden"
			/>
			<label for="hidden">
				Bloquear
			</label>
		</div>

		{#if user.blocked}
			Al bloquear un usuario, este ya no podrá ingresar.
		{/if}

		{#if message}
			<p>{message}</p>
		{/if}

		<div class="buttons flex">
			<EButton type="button" class="large" on:click={update}>
				Guardar
			</EButton>
			{#if showCloseButton}
				<EButton type="button" class="large" on:click={() => dispatch('cancel')}>
					Cancelar
				</EButton>
			{/if}
		</div>
	</form>
</div>

<style lang="scss">
	@import "$lib/sass/variables";

	.editUser {
		max-width: $mediaM;
		margin: 20px auto;
	}
</style>
