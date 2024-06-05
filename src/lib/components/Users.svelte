<script lang="ts">
  import { invalidateAll } from "$app/navigation";
	import { fade } from "svelte/transition"
	import EditUser from "./EditUser.svelte"

  export let users

  let showCreateUser = false
  let showEditUser = false
  let editUser: User = null;

  const disableUser = (userId: number) => {
    // TODO: update user and set as disabled
    console.log('disable user with id ' + userId)
  }
</script>

<ul class="users">
  {#if showCreateUser}
    <div in:fade>
      <EditUser 
        user={null} 
        on:saved={(result) => {
          // const newUser = result.detail.reply.user
          invalidateAll();
          showCreateUser = false
        }}
      />
      <button on:click={() => showCreateUser = false}>Cancelar</button>
    </div>
  
  {:else if showEditUser}
    <div in:fade>
      <EditUser 
        user={editUser}
        on:saved={(result) => {
          invalidateAll();
          showCreateUser = false
        }}
      />
      <button on:click={() => showEditUser = false}>Cancelar</button>
    </div>

  {:else}
    <div in:fade>
      <button on:click={() => showCreateUser = true}>Nuevo usuario</button>
      {#each users as user (user.id)}
      <li>
        {user.firstName} {user.lastName}<br />
        {user.email}
        <div class="actions">
          <button on:click={() => {
            editUser = user
            showEditUser = true
          }}>
            Edit
          </button>
          <button on:click={() => disableUser(user.id) }>Disable</button>
        </div>
      </li>
      {/each}
    </div>
    
  {/if}

</ul>