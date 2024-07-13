<script lang="ts">
	import { onMount } from 'svelte'
	import { focusOnFirstError } from '$lib/focus'
	import {createEventDispatcher} from 'svelte';
	import EButton from './EButton.svelte'
	import { getImageURL } from '$lib/file'
	import { toSlug } from '$lib/strings'
	import { fade, slide } from 'svelte/transition'
	import EditVenue from './EditVenue.svelte'
	import { invalidateAll } from '$app/navigation'

	const dispatch = createEventDispatcher();

	// Props
	export let showTitle = true
	export let showCloseButton = true
	export let showAdminOptions = true
	export let venues: [VenueProperties] | []
	export let event: EEvent
	export let noFocusOnMount = false
	
	// Default event
	if (!event) {
		event = {
			id: 0,
			userId: 0,
			name: '',
			slug: '',
			startDate: (new Date()).toISOString().split('T')[0], // YYYY-MM-DD
			startTime: '19:00:00',
			endDate: undefined,
			endTime: undefined,
			description: '',
			ticketLink: '',
			price: undefined,
			hidden: false,
			published: true,
			addressLine1: '',
		}
	}

	// States
	let focusedField: HTMLInputElement
	let message: string
	let error = false
	let loading = false
	let eventImageFile: HTMLInputElement | null = null
	let isEventImageSelected = false
	let isSlugManuallyEdited = false
	let isConfirmedToPublish = false
	let showCreateVenue = false
	let newVenueAdded = false
	let showCustomAddress = !!event.addressLine1
	let isFree = !!!event.price // True if there's no price set
	const isNewEvent = event?.id === 0

	// Observables
	// Convert name to slug, unless slug has been manually edited
	$: if(isNewEvent && !isSlugManuallyEdited) event.slug = toSlug(event.name)
	// If there's a custom address, unset the venue id
	$: if(event.addressLine1) event.venueId = undefined

	// ====== HANDLERS ======

	// Focus first field when loading
	onMount(() => {
		if (!noFocusOnMount) focusedField.focus()
	})

	// Function to handle file selection
	function handleFileChange() {
		if (eventImageFile && eventImageFile?.files && eventImageFile.files.length > 0) {
			isEventImageSelected = true;
		} else {
			isEventImageSelected = false;
		}
	}

	// Handle form submit
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
						// Having to do some freaky typescript here to suppress warnings :(
						// We are just copying each value from event to formData
						formData.append(key, event[key as keyof EventProperties] as unknown as string);
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

	// Handle manual editing of slug
	function handleSlugInput(e: Event) {
		isSlugManuallyEdited = true;
		const input = e.target as HTMLInputElement;
		if (event) event.slug = input.value;
	}

	// Delete event permanently
	const handleDeleteEvent = async (event: EventProperties) => {
		if (!event.hidden && event.published) {
			message = 'No se permite borrar eventos publicados'
		}

		const body = JSON.stringify({id: event.id})
		try {
			loading = true
			const res = await fetch("/api/v1/event", {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body,
			})
			const reply = await res.json()
			message = reply.message
			if (res.ok) {
				dispatch('deleted', { reply })
			} else {
				error = true
			}
			loading = false
		} catch (error) {
			message = 'Servidor no disponible'
		}
	}

</script>

<div class="editEvent">
	{#if showTitle}
		<h2 class="title">
			{#if isNewEvent}
				Nuevo evento
			{:else}
				Modificar evento
			{/if}
		</h2>
	{/if}

	{#if !isNewEvent && !event.published}
		<p>
			<i>
				<strong>¡Ojo!</strong> Este evento fue creado por el público. Puede ser spam o tener datos incorrectos.
				Si tienes dudas, bórralo o comunícate con el creador.
			</i>
		</p>
	{/if}

	<form id="eventForm" class={showAdminOptions ? '' : 'public'} autocomplete="off" novalidate enctype="multipart/form-data">
		<fieldset disabled={loading}>
			<div class="inputContainer">
				<label for="name">Nombre del evento *</label>
				<input
					bind:this={focusedField}
					bind:value={event.name}
					id="name"
					required
					maxlength="255"
				/>
				<div class="invalidFeedback">Se requiere el nombre</div>
			</div>

			{#if !showAdminOptions}
				<div class="inputContainer">
					<label for="name">Tu nombre *</label>
					<input
						bind:value={event.submitterName}
						id="name"
						required
						maxlength="255"
					/>
					<div class="invalidFeedback">Se requiere tu nombre</div>
				</div>

				<div class="inputContainer">
					<label for="name">Tu correo *</label>
					<input
						type="email"
						bind:value={event.submitterEmail}
						id="name"
						required
						maxlength="255"
					/>
					<div class="invalidFeedback">Se requiere tu correo</div>
				</div>
			{/if}

			{#if showAdminOptions && event.submitterName}
				<p>
					<strong>Creado por</strong><br />
					{event.submitterName}<br />
					<a href="mailto:{event.submitterEmail}">{event.submitterEmail}</a>
				</p>
			{/if}

			<div class="inputContainer url">
				<label for="name">URL *</label>
				{#if !isNewEvent}
					<p><i>Evita cambiar el URL después de publicar el evento</i></p>
				{/if}
				<div class="flex alignCenter">
					<b>esponja.mx/evento/</b>
					<input
						value={event.slug}
						on:input={handleSlugInput}
						id="slug"
						required
						placeholder="URL"
						maxlength="120"
					/>
				</div>
				<div class="invalidFeedback">Se requiere un URL</div>
			</div>

			<div class="inputContainer image">
				<label for="image">Imagen *</label>
				<p>Recomendamos una imagen con poco texto</p>
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
					bind:this={eventImageFile}
					on:change={handleFileChange}
				/>
				<div class="invalidFeedback">Se requiere una imagen</div>
			</div>
			
			<div class="inputContainer date">
				<label for="startDate">Inicia *</label>
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

			<div class="inputContainer date">
				<label for="endDate">Termina</label>
				<p>(Opcional)</p>
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
			</div>
	
			<div class="inputContainer venue">
				{#if !showCustomAddress}
					<label for="venueId">Foro *</label>
					<select
						bind:value={event.venueId}
						id="venueId"
					>
						{#each venues as venue (venue?.id)}
							<option value={venue?.id}>{venue?.name}</option>
						{/each}
					</select>
				{/if}
				
				{#if newVenueAdded}
					<p class="mt">
						Ya se agregó el nuevo foro
					</p>

				{:else if !showCustomAddress}
					<p class="mt">¿No encuentras el foro que buscas?</p>
					<div class="flex alignCenter">
						{#if showAdminOptions}
							<EButton
								on:click={(e) => {
									e.preventDefault()
									showCreateVenue = true
								}}
							>
								Nuevo foro
							</EButton>
						{/if}
						<EButton on:click={(e) => {
							e.preventDefault()
							showCustomAddress = true
						}}>
							Introducir dirección
						</EButton>
					</div>
				{/if}

			</div>

			{#if showCustomAddress}
				<div class="customAddress" in:fade out:slide>
					<div class="inputContainer">
						<label for="addressLine1">Dirección *</label>
						<input
							bind:value={event.addressLine1}
							id="addressLine1"
							class="mb"
							required
							maxlength="255"
							placeholder="Calle y número"
						/>
						<div class="invalidFeedback">Se requiere la primera línea</div>
						<input
							bind:value={event.addressLine2}
							id="addressLine2"
							maxlength="255"
							placeholder="(Opcional)"
						/>
					</div>

					<div class="inputContainer">
						<label for="addressLine1">Código postal</label>
						<input
							bind:value={event.addressPostCode}
							id="addressPostCode"
							maxlength="20"
						/>
					</div>

					<EButton class="close" on:click={(e) => {
						e.preventDefault()
						event.addressLine1 = ''
						event.addressLine2 = ''
						event.addressPostCode = ''
						showCustomAddress = false
					}}>
						Quitar dirección
					</EButton>
				</div>
			{/if}

			<div class="inputContainer description">
				<label for="name">Descripción *</label>
				<textarea
					rows=8
					bind:value={event.description}
					id="description"
					required
					placeholder="¡Cuéntanos! Puedes incluir ligas en la descripción."
				/>
			</div>

			<div class="inputContainer flex alignCenter">
				<input
					type="checkbox"
					bind:checked={isFree}
					id="isFree"
				/>
				<label for="isFree">
					Entrada libre
				</label>
			</div>

			{#if !isFree}
				<div class="inputContainer price">
					<label for="price">Precio</label>
					<p>Si existe un rango de precios, puedes ingresar también el precio máximo. Si no, omítalo.</p>
					<div class="flex">
						<input
							bind:value={event.price}
							type="number"
							min="1"
							max="999999"
							id="price"
							placeholder="Precio (normal)"
						/>
						<input
							bind:value={event.priceMax}
							type="number"
							min="1"
							max="999999"
							placeholder="Precio (máximo)"
						/>
					</div>
				</div>

				<div class="inputContainer ticketLink">
					<label for="price">Link para comprar boletos</label>
					<input
						bind:value={event.ticketLink}
						id="ticketLink"
						maxlength="2083"
						placeholder="https://example.com"
					/>
				</div>
			{/if}

		</fieldset>

		{#if showAdminOptions && (event.published || isConfirmedToPublish)}
			<p>
				Si aún estás revisando el evento, lo puedes guardar como borrador. Los borradores no están visible al público.
			</p>
			<div class="inputContainer flex alignCenter">
				<input
					type="checkbox"
					bind:checked={event.hidden}
					id="hidden"
				/>
				<label for="hidden">
					Borrador (no visible)
				</label>
			</div>
		{/if}

		{#if !isNewEvent && !event.published && !isConfirmedToPublish}
			<div class="confirmBeforePublishing justifyCenter" in:fade>
				<h2>¿Quieres borrar este evento?</h2>
				<p>Este evento fue creado a través del formulario público. Si algo no está bien, aquí lo puedes borrar de forma permanente.</p>
				<div class="flex justifyCenter">
					<EButton on:click={() => handleDeleteEvent(event)} class="large">Borrar</EButton>
					<EButton on:click={() => isConfirmedToPublish = true} class="large">No borrar</EButton>
				</div>
			</div>
		{/if}

		{#if message}
			<p class="message">{message}</p>
		{/if}

		{#if event.published || isConfirmedToPublish}
			<div class="invalidFeedback">No se pudo guardar. Por favor revisa el formulario.</div>
			<div class="buttons" in:fade>
				<EButton type="button" on:click={update} disabled={loading} class="large">
					{#if loading}
						Cargando...
					{:else}
						Guardar
					{/if}
				</EButton>
				{#if showCloseButton}
				<EButton type="button" on:click={() => dispatch('cancel')} class="large">
					Cerrar
				</EButton>
				{/if}
			</div>
		{/if}

	</form>
</div>

{#if showCreateVenue}
  <div in:fade class="overlay alignCenter">
    <EditVenue 
      venue={null} 
      on:saved={(reply) => {
        invalidateAll();
				const newId = reply?.detail?.reply?.newId
				if (newId) {
					event.venueId = newId
					newVenueAdded = true
				}
        showCreateVenue = false
      }}
      on:cancel={() => showCreateVenue = false}
    />
  </div>
{/if}

<style lang="scss">
	@import "$lib/sass/variables";

	:global(button.eventImageWrapper) {
		width: 100%;
		position: relative;
		margin-top: var(--spacing);
	}

	form {
		p {
			font-style: italic;
			margin-bottom: 0.5em;
		}
	}

	.editEvent {
		max-width: $mediaM;
		margin: 20px auto;
		padding: var(--spacing);
	}

	.title {
		text-transform: uppercase;
		padding-bottom: var(--spacing);
		margin-bottom: 1em;
		border-bottom: 1px solid var(--colorGreen);
	}

	input#eventImage {
		width: 0;
		height: 0;
		border: none;
		padding: 0;
		visibility: hidden;
	}

	.buttons {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing);
		margin-top: var(--double);
		margin-bottom: var(--double);
	}

	.imageWrapper {
		overflow: hidden;
		border-radius: var(--borderRadius);
		margin-bottom: var(--spacing);

		img {
			float: left;
		}
	}

	form.public {
		.url {
			visibility: hidden;
			height: 0;
			overflow: hidden;
		}
	}

	.confirmBeforePublishing {
		border: 1px solid var(--colorGreen);
		border-radius: var(--borderRadius);
		padding: var(--double);
	}

	.customAddress {
		border: 1px solid var(--colorGreen);
		border-radius: var(--borderRadius);
		padding: var(--spacing);
		margin-bottom: var(--spacing);
		position: relative;
		padding-top: var(--double);
		
		:global(.close) {
			position: absolute;
			top: var(--spacing);
			right: var(--spacing);
		}
	}
</style>
