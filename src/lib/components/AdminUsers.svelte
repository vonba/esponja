<script lang="ts">
  import { invalidateAll } from "$app/navigation";
	import { fade } from "svelte/transition"
	import EditUser from "./EditUser.svelte"
	import EButton from "./EButton.svelte"

  // Props
  export let users: UserProperties[] | []

  // States
  let showCreateUser = false
  let showEditUser = false
  let editUser: User = null;
  let filterMode = 'unblocked'

    // Observables
  $: filteredUsers = users.filter(
    user => filterMode === 'blocked' ? user.blocked : !user.blocked
  )
  $: blockedCount = users.filter(u => u.blocked).length

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
      on:cancel={() => {
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
      <div class="statusOptions flex">
        <EButton
          on:click={() => filterMode='unblocked'}
          class={filterMode === 'unblocked' ? 'selected' : ''}
        >
          Con acceso
        </EButton>
        <EButton
          on:click={() => filterMode='blocked'}
          class={filterMode === 'blocked' ? 'selected' : ''}
        >
          Sin acceso ({blockedCount})
        </EButton>
      </div>
      <EButton on:click={() => showCreateUser = true}>Nuevo usuario</EButton>
    </div>

    <ul class="users">
      {#each filteredUsers as user (user.id)}
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
    {#if !filteredUsers.length}
      <div class="emptyList">
        No hay usuarios del tipo seleccionado
      </div>
    {/if}
  </div>
  
{/if}

<style lang="scss">
  @import "$lib/sass/variables";

.tools {
  padding: var(--spacing);
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid var(--colorGreen);
}

ul.users {
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    padding: var(--spacing);
    margin-bottom: var(--spacing);

    .actions {
      margin-top: var(--spacing);
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