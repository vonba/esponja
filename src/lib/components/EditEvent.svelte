<script lang="ts">
	import { onMount } from 'svelte'
	import { focusOnFirstError } from '$lib/focus'
	import {createEventDispatcher} from 'svelte';
	
	const dispatch = createEventDispatcher();

	export let event: EEvent;
	if (!event) {
		event = {
			id: 0,
			userId: 0,
			venueId: 0,
			name: '',
			startDate: '', // ISO 8601 date format
			startTime: '', // ISO 8601 time format
			endDate: '', // ISO 8601 date format
			endTime: '', // ISO 8601 time format
			description: '',
			ticketLink: '',
			priceCents: 0,
		}
	}
	const isNewEvent = event.id === 0

	let focusedField: HTMLInputElement
	let message: string

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
				const res = await fetch(url, {
					method,
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(event)
				})
				const reply = await res.json()
				message = reply.message
				dispatch('saved', { reply })
			} catch (error) {
				message = 'API unavailable'
			}
		} else {
			form.classList.add('was-validated')
			focusOnFirstError(form)
		}
	}

</script>

<div class="d-flex my-3">
	<div class="card login">
		<div class="card-body">
			
			<h2>
				{#if isNewEvent}
					Nuevo evento
				{:else}
					Modificar evento
				{/if}
			</h2>

			<form id="eventForm" autocomplete="off" novalidate class="mt-3">
				<div class="mb-3">
					<label class="form-label" for="name">Nombre</label>
					<input
						bind:this={focusedField}
						bind:value={event.name}
						class="form-control"
						id="name"
						required
						placeholder="Nombre"
					/>
					<div class="invalid-feedback">Se requiere el nombre</div>
				</div>

				<div class="mb-3">
					TODO: add remaining event fields
				</div>

				{#if message}
					<p>{message}</p>
				{/if}

				<button type="button" on:click={update} class="btn btn-primary btn-lg">
					Guardar
				</button>
			</form>
		</div>
	</div>
</div>


<style lang="scss">
	.card-body {
		width: 25rem;
	}
</style>
