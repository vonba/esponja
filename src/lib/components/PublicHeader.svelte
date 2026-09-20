<!-- Sticky header shared by the public events views and the venue listing (/foros) -->
<script lang="ts">
	import EButton from "./EButton.svelte"
	import ButtonLink from "./ButtonLink.svelte"
	import PublicLogo from "./PublicLogo.svelte"
	import SearchEvents from "./SearchEvents.svelte"
	import { lastEventsPath } from "../../stores"

  // Props
  export let section: 'eventos' | 'foros' = 'eventos'
  export let eventTimeWindow: string | undefined = undefined
  export let setEventTimeWindow: ((timeWindow: string) => void) | null = null
  export let handleSearchChange: (searchString: string) => void

  // State
  let isSearchVisible = false

  const toggleSearch = () => {
    isSearchVisible = !isSearchVisible
    handleSearchChange('')
  }

  const selectTimeWindow = (timeWindow: string) => setEventTimeWindow?.(timeWindow)
</script>

<section class="homeHeader">
	<PublicLogo on:click={() => selectTimeWindow('')} />

	<nav id="eventsNavigation" class="{section} {isSearchVisible ? 'searchVisible' : ''}">
		{#if section === 'eventos'}
			<EButton
				on:click={() => selectTimeWindow('')}
				class={[undefined, '', 'eventos'].includes(eventTimeWindow) ? 'selected' : ''}
			>
				Todo
			</EButton>
			<EButton
				on:click={() => selectTimeWindow('hoy')}
				class={'hoy' === eventTimeWindow ? 'selected cross' : ''}
			>
				Hoy
			</EButton>
			<EButton
				on:click={() => selectTimeWindow('manana')}
				class={'manana' === eventTimeWindow ? 'selected cross' : ''}
			>
				Mañana
			</EButton>
			<EButton
				on:click={() => selectTimeWindow('semana')}
				class={'semana' === eventTimeWindow ? 'selected cross' : ''}
			>
				Esta semana
			</EButton>
		{:else}
			<ButtonLink href={$lastEventsPath} class="eventsLink">
				Eventos
			</ButtonLink>
		{/if}
		<div class="smallButtons">
			<div class="more">
				<ButtonLink
					href="/foros"
					class="venuesLink {section === 'foros' ? 'selected' : ''}"
					aria-current={section === 'foros' ? 'page' : undefined}
				>
					Foros
				</ButtonLink>
				<SearchEvents {isSearchVisible} {toggleSearch} {handleSearchChange} />
			</div>
		</div>
	</nav>
</section>

<div class="links">
	<a href="/info">
		¿Qué es Esponja?
	</a>
		&nbsp; &nbsp;
	<a href="/tu-evento">
		Agregar tu evento
	</a>
</div>

<style lang="scss">
	@use "$lib/sass/variables" as *;

	.homeHeader {
		position: sticky;
		top: 0;
		background-color: var(--colorOffWhite);
		z-index: 10;
		padding-bottom: var(--spacing);
		border-bottom: 1px solid var(--colorGreen);

		@media (min-width: $mediaL) {
			display: flex;
			justify-content: space-between;
			align-items: flex-end;
		}
	}

	#eventsNavigation {
		display: flex;
		justify-content: flex-end;
		width: 100%;
		margin-top: 20px;
		padding: 0 var(--spacing);
		gap: var(--spacing);
		height: 2em;
		transition: all 0.5s;

		:global(button:not(.icon)) {
			flex-grow: 1;
		}

		@media (min-width: $mediaL) {
			width: 80%;
			max-width: 40em;

			&.searchVisible {
				max-width: 50em;
			}
		}

		@media (max-width: $mediaM) {
			&.searchVisible {
				.more {
					width: 100%;

					:global(.searchWrapper) {
						flex-grow: 1;
					}
				}
			}
		}

		// On the venue listing there are only three controls, so keep them on one row
		&.foros {
			.smallButtons {
				@media (max-width: $mediaM) {
					position: static;
					width: auto;
					margin-top: 0;
					padding: 0;
					border-bottom: none;
				}
			}
		}
	}

	#eventsNavigation :global(a.eventsLink) {
		text-align: center;
	}

	// Section links get an icon to set them apart from the date filters
	#eventsNavigation :global(a.eventsLink),
	#eventsNavigation :global(a.venuesLink) {
		padding-left: calc(var(--fsNormal) + 1.5 * var(--spacing));
		background-repeat: no-repeat;
		background-size: auto var(--fsNormal);
		background-position: calc(0.75 * var(--spacing)) center;
	}

	#eventsNavigation :global(a.eventsLink) {
		background-image: url('/icon-date-green.svg');
	}

	#eventsNavigation :global(a.venuesLink) {
		background-image: url('/icon-venue-green.svg');
	}

	#eventsNavigation :global(a.venuesLink.selected) {
		background-color: var(--colorGreen);
		background-image: url('/icon-venue-offwhite.svg');
	}

	.smallButtons {
		.more {
			display: flex;
			gap: var(--spacing);
		}
		display: flex;
		gap: var(--spacing);

		@media (max-width: $mediaM) {
			width: 100%;
			position: absolute;
			right: 0;
			margin-top: 28px;
			justify-content: space-between;
			background-color: var(--colorOffWhite);
			padding: var(--spacing);
			border-bottom: 1px solid var(--colorGreen);
		}
	}

	.links {
		position: fixed;
		bottom: 0;
		right: 0;
		text-transform: uppercase;
		font-style: italic;
		font-weight: bold;
		z-index: 10;

		a {
			text-decoration: none;

			&:hover {
				text-decoration: underline;
			}
		}

		// Small screens: banner at the bottom
		@media (max-width: $mediaL) {
			width: 100%;
			text-align: center;
			padding: var(--spacing);
			background-color: var(--colorGreen);
			color: var(--colorOffWhite);

			a {
				color: var(--colorOffWhite);
			}
		}

		// Desktop: top right link
		@media (min-width: $mediaL) {
			bottom: unset;
			top: var(--spacing);
			right: var(--spacing);
		}
	}
</style>
