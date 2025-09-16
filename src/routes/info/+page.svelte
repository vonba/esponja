<script>
	import ButtonLink from "$lib/components/ButtonLink.svelte"
	import PublicLogo from "$lib/components/PublicLogo.svelte"
	import { fade } from "svelte/transition"
	import { PUBLIC_DOMAIN } from '$env/static/public';
</script>

<svelte:head>
	<title>Acerca de Esponja</title>
	<meta property="og:title" content="Acerca de Esponja" />
  <meta property="og:description" content="Esponja es una plataforma gratuita y sin fines de lucro para publicar eventos de música alternativa en la Ciudad de México." />
	<meta name="description" content="Esponja es una plataforma gratuita y sin fines de lucro para publicar eventos de música alternativa en la Ciudad de México.">
	<meta property="og:image" content="{PUBLIC_DOMAIN}/esponja-preview.jpg" />
  <meta property="og:type" content="event" />
</svelte:head>

<PublicLogo frontPage={false} />

<section class="pageContent" in:fade>
	<div class="textWrapper">
		<h2>¿Qué es Esponja?</h2>
		<p>
			Esponja es una plataforma <strong>gratuita</strong> y sin fines de lucro para publicar eventos de música alternativa en la Ciudad de México.
			Fue realizada como un apoyo para <strong>la comunidad artística</strong> de la ciudad y busca ser <strong>una alternativa</strong> a las redes sociales, 
			para que lxs artistas y los foros puedan visibilizar sus eventos – sin depender de algoritmos con poca transparencia y sin tener que pagar por las publicaciones.
		</p>

		<div class="imageWrapper">
			<img src="/esponja-illustration1.png" alt="Ilustración" />
		</div>
		
		<h2>¿Quieres publicar un evento?</h2>
		<p>
			Ingresa los datos del evento aquí.<br /><br />
			<ButtonLink class="large" href="/tu-evento">Cuéntanos</ButtonLink>
		</p>
		
		<h2>Contacto</h2>
		<p>
			¿Tienes dudas? ¿Quieres ayudar a mantener Esponja actualizado para que aproveche toda la comunidad artística de tus conocimientos? Nos puedes contactar en <a href="mailto:hola@esponja.mx">hola@esponja.mx</a>
		</p>

		<h2>Créditos</h2>
		<p>
			Desarrollo por <a href="https://balthazaurus.com">Balthazaurus</a><br />
			Diseño por <a href="https://instagram.com/goodluckbalthazar">Simon Balthazar</a> 
			y <a href="https://www.instagram.com/lkiud">Leyla Udimamedova</a><br />
			Ilustración por <a href="https://linktr.ee/sexy.primes">Ksenia Kirsta</a>
		</p>
	</div>
</section>

<style lang="scss">
	@use "$lib/sass/variables" as *;

	h2 {
		font-size: var(--fsTitleBig);
	}

	.pageContent {
		border-top: 1px solid var(--colorGreen);
		padding: var(--spacing);
		padding-top: var(--double);
		margin-top: var(--spacing);
		
		p {
			max-width: 40em;
			text-align: justify;
			margin-bottom: 4em;

			@media (max-width: $mediaM) {
				&:first-of-type {
					margin-bottom: 2em;
				}
			}
		}
		
		.imageWrapper {
			text-align: center;
			margin-bottom: 2em;

			img {
				max-height: 200px;
			}
		}

		/* @media (min-width: $mediaM) {
			.imageWrapper {
				img {
					max-height: 80vh;
				}
			}
		} */
		@media (min-width: 830px) {
			.imageWrapper {
				position: fixed;
				top: 140px;
				right: 2em;

				img {
					max-height: 300px;
				}
			}
		}

		@media (min-width: 1100px) {
			.imageWrapper {
				img {
					max-height: 80vh;
				}
			}
		}

		@media (min-width: 1300px) {
			.imageWrapper {
				right: unset;
				left: 47em;
			}
		}
	}
</style>