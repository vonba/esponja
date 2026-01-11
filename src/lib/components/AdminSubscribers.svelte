<script lang="ts">
	import { fade } from "svelte/transition"
	import EButton from "./EButton.svelte"

	// Props
	export let subscribers: SubscriberProperties[] | []

	// States
	let filterMode = 'active'

	// Observables
	$: filteredSubscribers = subscribers.filter(
		sub => filterMode === 'active' ? sub.active : !sub.active
	)
	$: activeCount = subscribers.filter(s => s.active).length
	$: inactiveCount = subscribers.filter(s => !s.active).length

	function formatDate(isoDate: string): string {
		const date = new Date(isoDate)
		return date.toLocaleDateString('es-MX', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
	}
</script>

<div in:fade>
	<div class="tools">
		<div class="statusOptions flex">
			<EButton
				on:click={() => filterMode='active'}
				class={filterMode === 'active' ? 'selected' : ''}
			>
				Activos ({activeCount})
			</EButton>
			<EButton
				on:click={() => filterMode='inactive'}
				class={filterMode === 'inactive' ? 'selected' : ''}
			>
				Inactivos ({inactiveCount})
			</EButton>
		</div>
	</div>

	<ul class="subscribers">
		{#each filteredSubscribers as subscriber (subscriber.id)}
			<li>
				<strong>{subscriber.email}</strong><br />
				<span class="date">Suscrito: {formatDate(subscriber.subscribedAt)}</span>
			</li>
		{/each}
	</ul>
	{#if !filteredSubscribers.length}
		<div class="emptyList">
			No hay suscriptores del tipo seleccionado
		</div>
	{/if}
</div>

<style lang="scss">
	@use "$lib/sass/variables" as *;

.tools {
	padding: var(--spacing);
	display: flex;
	justify-content: space-between;
	border-bottom: 1px solid var(--colorGreen);
}

ul.subscribers {
	list-style: none;
	margin: 0;
	padding: 0;

	li {
		padding: var(--spacing);
		margin-bottom: var(--spacing);

		.date {
			color: var(--colorGray);
			font-size: 0.9em;
		}
	}

	@media (min-width: $mediaM) {
		display: grid;
		grid-template-columns: 1fr 1fr;
	}

	@media (min-width: $mediaL) {
		grid-template-columns: 1fr 1fr 1fr;
	}

	@media (min-width: $mediaXL) {
		grid-template-columns: 1fr 1fr 1fr 1fr;
	}
}
</style>
