<script>
  export let titles, activeTab, setActiveTab
</script>

<div class="tabsContainer">
  <header>
    {#each titles as title, index}
      {#if title}
        <button 
          on:click={() => setActiveTab(index)}
          class={index === activeTab ? 'active' : ''}
        >
          {title}
        </button>
      {/if}
    {/each}
  </header>
  <div class="tabsContent">
    <slot />
  </div>
</div>

<style lang="scss">
  .tabsContainer {
    width: 100%;
  }

  .tabsContent {
    padding: 1em;
  }
  
  header {
    display: flex;
    width: 100%;
    gap: 1em;
    background-color: green;
    color: white;
    padding: 1em;
    
    button {
      border: none;
      background: none;
      color: white;
      padding: 0;
      padding-bottom: 0.5em;
      border-bottom: 2px solid transparent;
      transition: all 0.5s;
      
      &:hover,
      &.active {
        border-bottom-color: white;
      }
    }
  }
</style>