<script lang="ts">
  import { invalidateAll } from "$app/navigation";
	import { fade } from "svelte/transition"
	import EditUser from "./EditUser.svelte"
	import EButton from "./EButton.svelte"

  export let users: UserProperties[]

  let showCreateUser = false
  let showEditUser = false
  let editUser: User = null;

  const roleLabels = {
    'admin': 'Administrador',
    'editor': 'Editor',
    'contributor': 'Colaborador',
  }
</script>

{#if showCreateUser}
  <div in:fade>
    <EditUser 
      user={null} 
      on:saved={() => {
        invalidateAll();
        showCreateUser = false
      }}
      on:saved={() => {
        showCreateUser = false
      }}
    />
  </div>

{:else if showEditUser}
  <div in:fade>
    <EditUser 
      user={editUser}
      on:saved={() => {
        invalidateAll();
        showEditUser = false
      }}
      on:cancel={() => {
        showEditUser = false
      }}
    />
  </div>

{:else}
  <div in:fade>
    <div class="tools">
      <EButton on:click={() => showCreateUser = true}>Nuevo usuario</EButton>
    </div>

    <ul class="users">
      {#each users as user (user.id)}
        <li>
          <strong>
            {user.firstName} {user.lastName}<br />
          </strong>
          {roleLabels[user.role]}<br />
          {user.email}
          <div class="actions">
            <EButton 
              class="icon edit"
              on:click={() => {
                editUser = user
                showEditUser = true
              }}
            >
              Modificar
            </EButton>
          </div>
        </li>
      {/each}
    </ul>
  </div>
  
{/if}

<style lang="scss">
  @import "$lib/sass/variables";

.tools {
  padding: var(--spacing);
  display: flex;
  justify-content: flex-end;
  border-bottom: 1px solid var(--colorGreen);
}

ul.users {
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    padding: var(--spacing);
    margin-bottom: var(--spacing);
  }

  @media (min-width: $mediaL) {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
</style>