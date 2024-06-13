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
    padding: var(--spacing);
  }
  
  header {
    display: flex;
    width: 100%;
    gap: calc(2 * var(--spacing));
    background-color: var(--colorGreen);
    color: var(--colorOffWhite);
    padding: var(--spacing);
    padding-bottom: 0;
    
    button {
      border: none;
      background: none;
      color: darker(var(--colorOffWhite));
      padding: 0;
      padding-bottom: 0.5em;
      border-bottom: 5px solid transparent;
      transition: all 0.5s;
      cursor: pointer;
      
      &:hover,
      &.active {
        color: var(--colorOffWhite);
        border-bottom-color: var(--colorOffWhite);
      }
    }
  }
</style>