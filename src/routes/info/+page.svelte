<script>
	import ButtonLink from "$lib/components/ButtonLink.svelte"
import PublicLogo from "$lib/components/PublicLogo.svelte"
	import { fade } from "svelte/transition"

</script>

<svelte:head>
	<title>Acerca de Esponja</title>
</svelte:head>

<PublicLogo />

<section class="pageContent" in:fade>
	<h2>¿Qué es Esponja?</h2>
	<p>
		Esponja es una plataforma <strong>gratuita</strong> y sin fines de lucro para publicar eventos de música alternativa en la Ciudad de México.
		Fue realizada como un apoyo para <strong>la comunidad artística</strong> de la ciudad, y busca ser <strong>una alternativa</strong> a las redes sociales, para que lxs artistas y los foros puedan visibilizar sus eventos, sin depender de algoritmos con poca transparencia y sin tener que pagar por las publicaciones.
	</p>
	
	<h2>¿Quieres publicar un evento?</h2>
	<p>
		Ingresa los datos del evento aquí.
	</p>
	<p>
		<ButtonLink href="/sugerir">Cuéntanos</ButtonLink>
	</p>
	
	<h2>Contacto</h2>
	<p>
		¿Tienes dudas? ¿Quieres ayudar a actualizar Esponja? Nos puedes contactar en <a href="mailto:hola@esponja.mx">hola@esponja.mx</a>
	</p>

	<p>
		<ButtonLink href="/admin">Soy admin</ButtonLink>
	</p>
</section>

<style lang="scss">
	.pageContent {
		padding: var(--spacing);

		p {
			text-align: justify;
		}
	}
</style>