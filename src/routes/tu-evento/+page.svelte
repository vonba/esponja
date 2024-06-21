<script lang="ts">
	import EditEvent from "$lib/components/EditEvent.svelte"
	import PublicLogo from "$lib/components/PublicLogo.svelte"
  
  export let data: SuggestEventPageData
  const { venues } = data
</script>

<svelte:head>
	<title>Agregar tu evento – Evento</title>
</svelte:head>

<PublicLogo />


<div class="editEventWrapper">
  <div class="intro">
    <h1>Agregar tu evento</h1>
  
    <p>
      Si hay un evento de música alternativa en la CDMX que sientes que deberíamos publicar, ¡cuéntanos por acá! 
    </p>
    <p>
      Por ejemplo:<br />
      • Si eres artista y vas a tocar<br />
      • Si tienes conocimiento de un concierto<br />
      • Si estás organizando un taller de música
    </p>
  
    <p>
      No garantizamos que se va a publicar, pero vamos a considerar todos los eventos que se nos mandan a través de este formulario.
    </p>
  
    <p>
      Si organizas eventos regularmente, o si tienes conocimiento que quieres compartir, escríbenos en <a href="mailto:hola@esponja.mx">hola@esponja.mx</a>
      para solicitar tu cuenta administrador.
    </p>
  </div>

  <EditEvent showTitle={false} {venues} event={null}  />
</div>

<style lang="scss">
  @import "$lib/sass/variables";

  h1 {
    /* margin-top: 20px; */
    /* padding: var(--spacing); */
    margin-bottom: 20px;
  }

  .editEventWrapper {
    max-width: $mediaM;
    border-top: 1px solid var(--colorGreen);
    padding: 20px var(--spacing);
    margin-top: 20px;

    p {
      text-align: justify;
    }

    @media (min-width: $mediaL) {
      max-width: unset;
      display: grid;
      grid-template-columns: minmax(33%, $mediaM) minmax(33%, $mediaM) 1fr;

      .intro {
        /* padding: calc(2 * var(--spacing)); */
        padding-left: 0;
        padding-right: 30px;
      }

      :global(.editEvent) {
        margin-top: 0;
        border: 1px solid var(--colorGreen);
        border-radius: var(--borderRadius);
        padding: 20px;
      }
    }
  }
</style>