<script lang="ts">
	import EditEvent from "$lib/components/EditEvent.svelte"
	import PublicLogo from "$lib/components/PublicLogo.svelte"
	import { loginSession } from "../../stores"
  
  // Props
  export let data: SuggestEventPageData
  const { venues } = data

  // States
  let eventSaved = false;

  let user: User;
  loginSession.subscribe(value => {
    user = value;
  });
</script>

<svelte:head>
	<title>Agregar tu evento – Evento</title>
</svelte:head>

<PublicLogo />


<div class="editEventWrapper">
  <div class="intro">
    <h1>Agregar tu evento</h1>
  
    <p>
      Si hay un evento de música alternativa en la CDMX que sientas que deberíamos publicar, ¡cuéntanos por acá! 
    </p>
    <p>
      Por ejemplo:<br />
      •Si eres artista y vas a tocar<br />
      •Si vas a un concierto que no está publicado en Esponja<br />
      •Si estás organizando cualquier evento relacionado con la música alternativa y lo quieres visibilizar
    </p>
  
    <p>
      No garantizamos que se va a publicar, pero vamos a considerar todos los eventos que se nos manden a través de este formulario.
    </p>
  
    <p>
      Si organizas eventos regularmente, o si eres una de esas personas que siempre saben dónde están los buenos toquines, escríbenos a <a href="mailto:hola@esponja.mx">hola@esponja.mx</a>
      para solicitar tu cuenta de administrador, con la cual podrás libremente publicar y modificar eventos en Esponja.
    </p>

    <p>
      <i>
        ¿Ya tienes tu cuenta?<br />
        Por favor usa la <a href="/admin">administración</a> para agregar tus eventos.
      </i>
    </p>
  </div>

  {#if eventSaved}
    <div class="eventSaved">
      <h2>¡Gracias!</h2>
      <p>
        Tue evento fue guardado y pronto lo revisaremos.
        Si se publica, te llegará una notificación al correo que proporcionaste.
      </p>
    </div>

  {:else}
    {#if user}
      <div class="emptyList">
        <h2>Ya tienes cuenta</h2>
          Puedes agregar eventos desde la <a href="/admin">administración</a>
      </div>

    {:else}
      <EditEvent 
        showAdminOptions={false} 
        showTitle={false} 
        showCloseButton={false} 
        {venues} 
        event={null}
        on:saved={() => eventSaved = true}
      />
    {/if}

  {/if}
</div>

<style lang="scss">
  @import "$lib/sass/variables";

  h1 {
    margin-bottom: 20px;
  }

  .editEventWrapper {
    border-top: 1px solid var(--colorGreen);
    padding: 20px 0;
    margin-top: 20px;

    p {
      text-align: justify;
    }

    .intro {
      padding: var(--spacing);
    }

    :global(.editEvent) {
      max-width: unset;
      width: 100%;
    }

    @media (max-width: $mediaL) {
      .intro,
      :global(.editEvent) {
        max-width: $mediaM;
      }
      
      :global(.editEvent) {
        // Avoid centering the form
        margin-left: 0;
        margin-right: 0;
      }
    }

    @media (min-width: $mediaL) {
      max-width: unset;
      display: grid;
      grid-template-columns: minmax(33%, $mediaM) minmax(33%, $mediaM) 1fr;

      .intro {
        padding-right: var(--double);
      }

      :global(.editEvent) {
        margin-top: 0;
        border: 1px solid var(--colorGreen);
        border-radius: var(--borderRadius);
        padding: 20px;
      }
    }
  }

  .eventSaved {
    border: 1px solid var(--colorGreen);
    border-radius: var(--borderRadius);
    padding: var(--spacing);
  }
</style>