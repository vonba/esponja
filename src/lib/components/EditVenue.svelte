<script lang="ts">
	import { onMount } from 'svelte'
	import { focusOnFirstError } from '$lib/focus'
	import {createEventDispatcher} from 'svelte';
	import EButton from './EButton.svelte'
	
	const dispatch = createEventDispatcher();

	export let venue: Venue;
	if (!venue) {
		venue = {
			id: 0,
			name: '',
			addressline1: '',
			addressline2: '',
			postcode: '',
			city: '',
			hidden: false,
		}
	}
	
	let focusedField: HTMLInputElement
	let message: string
	let error = false
	let loading = false

	const isNewVenue = venue.id === 0

	onMount(() => {
		focusedField.focus()
	})

	async function update() {
		message = ''
		const form = <HTMLFormElement>document.getElementById('venueForm')

		if (form.checkValidity()) {
			const url = '/api/v1/venue'
			const method = isNewVenue ? 'POST' : 'PUT'

			try {
				loading = true
				error = false
				const res = await fetch(url, {
					method,
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(venue)
				})
				const reply = await res.json()
				message = reply.message
				if (res.ok) {
					dispatch('saved', { reply })
				} else {
					error = true
				}
				loading = false;
			} catch (error) {
				message = 'Servidor no disponible'
			}
		} else {
			form.classList.add('was-validated')
			focusOnFirstError(form)
		}
	}

</script>

<div class="editVenue">
	
	<h2>
		{#if isNewVenue}
			Nuevo foro
		{:else}
			Modificar foro
		{/if}
	</h2>

	<form id="venueForm" autocomplete="off" novalidate class="mt-3">
		<div class="mb-3">
			<label class="form-label" for="name">Nombre</label>
			<input
				bind:this={focusedField}
				bind:value={venue.name}
				class="form-control"
				id="name"
				required
				placeholder="Nombre"
			/>
			<div class="invalid-feedback">Se requiere el nombre</div>
		</div>

		<div class="mb-3">
			<label class="form-label" for="addressline1">Dirección</label>
			<input
				bind:value={venue.addressline1}
				class="form-control"
				id="addressline1"
			/>
			<input
				bind:value={venue.addressline2}
				class="form-control"
				id="addressline2"
			/>
		</div>

		<div class="mb-3">
			<label class="form-label" for="postcode">Código postal</label>
			<input
				bind:value={venue.postcode}
				class="form-control"
				id="postcode"
			/>
		</div>

		<div class="mb-3">
			<label class="form-label" for="postcode">Ciudad</label>
			<input
				bind:value={venue.city}
				class="form-control"
				id="city"
			/>
		</div>

		{#if message}
			<p>{message}</p>
		{/if}

		<div class="buttons">
			<EButton type="button" on:click={update} disabled={loading} class="large">
				{#if loading}
					Cargando...
				{:else}
					Guardar
				{/if}
			</EButton>
			<EButton type="button" on:click={() => dispatch('cancel')} class="large">
				Cerrar
			</EButton>
		</div>
	</form>
</div>

<style lang="scss">
</style>
