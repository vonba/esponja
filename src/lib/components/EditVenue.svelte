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
			slug: '',
			name: '',
			addressline1: '',
			addressline2: '',
			postcode: '',
			city: 'Ciudad de México',
			state: 'Ciudad de México',
			hidden: false,
		}
	}
	
	let venueFocusedField: HTMLInputElement
	let message: string
	let error = false
	let loading = false

	const isNewVenue = venue.id === 0

	onMount(() => {
		venueFocusedField.focus()
	})

	async function update() {
		let message
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
			form.classList.add('validationErrors')
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
		<div class="inputContainer">
			<label for="name">Nombre</label>
			<input
				bind:this={venueFocusedField}
				bind:value={venue.name}
				id="name"
				required
			/>
			<div class="invalidFeedback">Se requiere el nombre</div>
		</div>

		<div class="inputContainer">
			<label for="addressline1">Dirección</label>
			<input
				bind:value={venue.addressline1}
				id="addressline1"
				required
				class="mb"
				placeholder="Calle y número"
			/>
			<div class="invalidFeedback">Se requiere la dirección</div>
			<input
				bind:value={venue.addressline2}
				id="addressline2"
				placeholder="Colonia o similar"
			/>
		</div>

		<div class="inputContainer">
			<label for="postcode">Código postal</label>
			<input
				bind:value={venue.postcode}
				id="postcode"
			/>
		</div>

		{#if message}
			<p>{message}</p>
		{/if}

		<div class="buttons flex">
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
	@import "$lib/sass/variables";

	.editVenue {
		max-width: $mediaM;
		margin: 20px auto;
	}
</style>
