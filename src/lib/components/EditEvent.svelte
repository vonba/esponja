<script lang="ts">
	import { onMount } from 'svelte'
	import { focusOnFirstError } from '$lib/focus'
	import {createEventDispatcher} from 'svelte';
	import EButton from './EButton.svelte'
	
	const dispatch = createEventDispatcher();

	export let venues: [Venue] | []

	export let event: EEvent
	if (!event) {
		event = {
			id: 0,
			userId: 0,
			venueId: 0,
			name: '',
			startDate: '2024-07-16', // ISO 8601 date format
			startTime: '19:00:00', // ISO 8601 time format
			endDate: '2024-07-16', // ISO 8601 date format
			endTime: '02:00:00', // ISO 8601 time format
			description: '',
			ticketLink: '',
			priceCents: 0,
		}
	}
	let focusedField: HTMLInputElement
	let message: string
	let error = false
	let loading = false

	const isNewEvent = event?.id === 0

	onMount(() => {
		focusedField.focus()
	})

	async function update() {
		message = ''
		const form = <HTMLFormElement>document.getElementById('eventForm')

		if (form.checkValidity()) {
			const url = '/api/v1/event'
			const method = isNewEvent ? 'POST' : 'PUT'

			try {
				const formData = new FormData();
				// formData.append('event', JSON.stringify(event));
				for (const key in event) {
					if (event.hasOwnProperty(key)) {
						formData.append(key, event[key]);
					}
				}

				// Check for file upload
				const eventImageInput = <HTMLInputElement>document.getElementById('eventImage');
				if (eventImageInput.files && eventImageInput.files[0]) {
					formData.append('eventImage', eventImageInput.files[0]);
				}

				loading = true
				error = false
				const res = await fetch(url, {
					method,
					// headers: {
					// 	'Content-Type': 'application/json'
					// },
					body: formData,
				})
				const reply = await res.json()
				message = reply.message
				if (res.ok) {
					dispatch('saved', { reply })
				} else {
					error = true
				}
				loading = false
			} catch (error) {
				message = 'API unavailable'
			}
		} else {
			form.classList.add('was-validated')
			focusOnFirstError(form)
		}
	}

</script>

<div class="editEvent">
	<h2>
		{#if isNewEvent}
			Nuevo evento
		{:else}
			Modificar evento
		{/if}
	</h2>

	<form id="eventForm" autocomplete="off" novalidate enctype="multipart/form-data">
		<fieldset disabled={loading}>
			<div class="inputContainer">
				<label for="name">Nombre</label>
				<input
					bind:this={focusedField}
					bind:value={event.name}
					id="name"
					required
					placeholder="Nombre"
				/>
				<div class="invalid-feedback">Se requiere el nombre</div>
			</div>

			<div class="inputContainer">
				<label for="image">Imagen</label>
				<input
					type="file"
					id="eventImage"
					placeholder="Nombre"
				/>
			</div>
	
			<div class="inputContainer">
				<label for="venueId">Foro</label>
				<select
					bind:value={event.venueId}
					id="venueId"
				>
					{#each venues as venue (venue?.id)}
						<option value={venue?.id}>{venue?.name}</option>
					{/each}
				</select>
			</div>
		</fieldset>

		{#if message}
			<p>{message}</p>
		{/if}
		
		<EButton type="button" on:click={update} disabled={loading}>
			{#if loading}
				Cargando...
			{:else}
				Guardar
			{/if}
		</EButton>
		<EButton type="button" on:click={() => dispatch('cancel')}>
			Cancelar
		</EButton>
	</form>
</div>


<style lang="scss">
</style>
