<script lang="ts">
	import { onMount } from 'svelte'
	import { focusOnFirstError } from '$lib/focus'
	import {createEventDispatcher} from 'svelte';
	import EButton from './EButton.svelte'
	import { getImageURL } from '$lib/file'
	
	const dispatch = createEventDispatcher();

	export let venues: [Venue] | []
	export let event: EventProperties | null
	if (!event) {
		event = {
			id: 0,
			userId: 0,
			venueId: 0,
			name: '',
			startDate: (new Date()).toISOString().split('T')[0], // YYYY-MM-DD
			startTime: '19:00:00',
			endDate: undefined,
			endTime: undefined,
			description: '',
			ticketLink: '',
			priceCents: 0,
		}
	}

	let focusedField: HTMLInputElement
	let message: string
	let error = false
	let loading = false
	let eventImageFile: HTMLInputElement | null = null
	let isEventImageSelected = false;

	// Function to handle file selection
	function handleFileChange() {
		if (eventImageFile && eventImageFile?.files && eventImageFile.files.length > 0) {
			isEventImageSelected = true;
		} else {
			isEventImageSelected = false;
		}
	}

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
				// Convert event object to form data
				const formData = new FormData();
				for (const key in event) {
					if (event.hasOwnProperty(key)) {
						// Ignore TypeScript error here, this is correct
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
				message = 'Servidor no disponible'
			}
		} else {
			form.classList.add('validationErrors')
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
				<div class="invalidFeedback">Se requiere el nombre</div>
			</div>

			<div class="inputContainer">
				<label for="image">Imagen</label>
				{#if event.imageKeyLarge}
					<div class="imageWrapper">
						<img src={getImageURL(event.imageKeyLarge)} alt="Imagen del evento" />
					</div>
				{/if}
				<EButton 
					on:click={(e) => {
						e.preventDefault()
						eventImageFile?.click()
					}}
					class={`large eventImageWrapper ${isEventImageSelected ? 'file-selected' : ''}`}
				>
					{isEventImageSelected ? 'Imagen seleccionada' : 'Subir nueva imagen'}
				</EButton>
				<!-- Hidden -->
				<input
					type="file"
					id="eventImage"
					placeholder="Nombre"
					bind:this={eventImageFile}
					on:change={handleFileChange}
				/>
			</div>
			
			<div class="inputContainer">
				<label for="startDate">Inicia</label>
				<div class="flex">
					<input
						type="date"
						bind:value={event.startDate}
						id="startDate"
						required
					/>
					<input
						type="time"
						bind:value={event.startTime}
						id="startTime"
						autocomplete="off"
					/>
				</div>
				<div class="invalidFeedback">Se requiere una fecha de inicio</div>
			</div>

			<div class="inputContainer">
				<label for="endDate">Termina</label>
				<div class="flex">
					<input
						type="date"
						bind:value={event.endDate}
						id="endDate"
						autocomplete="off"
					/>
					<input
						type="time"
						bind:value={event.endTime}
						id="endTime"
						autocomplete="off"
					/>
				</div>
				<div class="invalidFeedback">Se requiere una fecha de inicio</div>
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

			<div class="inputContainer">
				<label for="name">Descripción</label>
				<textarea
					rows=8
					bind:value={event.description}
					id="description"
					placeholder="¡Cuenta nos!"
				/>
			</div>
		</fieldset>

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
	:global(button.eventImageWrapper) {
		width: 100%;
		position: relative;
	}

	.editEvent {
		max-width: 600px;
		margin: 0 auto;
	}

	input#eventImage {
		display: none;
	}

	.buttons {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing);
		margin-top: calc(2 * var(--spacing));
		margin-bottom: calc(2 * var(--spacing));
	}

	.imageWrapper {
		overflow: hidden;
		border-radius: var(--borderRadius);
		margin-bottom: var(--spacing);

		img {
			float: left;
		}
	}
</style>
