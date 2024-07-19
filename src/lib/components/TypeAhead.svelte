<script lang="ts">
  type ListItem = {
    id: any,
    name: string,
  }

  type KeyboardEvent = globalThis.KeyboardEvent;

  // Props
  export let items: ListItem[]
  export let setValue: Function
  export let selectedItem: ListItem | null | undefined
  export let placeholder: string

  // State
  let searchInput: HTMLInputElement
  let selectedIndex: number | null = null
  let searchString = selectedItem ? selectedItem.name : ''
  
  $: filteredItems = items.filter(
    item => !selectedItem || item.name.toLowerCase().startsWith(searchString.toLowerCase())
  )
  $: isSearching = selectedItem ? searchString !== selectedItem.name : false
  
  const clearInput = () => {
    searchString = ""	
    searchInput.focus()
  }

  const handleBlur = () => {
    if (selectedItem) {
      searchString = selectedItem.name
    } else {
      searchString = ''
    }
  }

  const handleFocus = () => {
    if (!selectedItem) {
      isSearching = true
    }
  }
    
  const selectItem = (item: ListItem) => {
    searchString = item.name
    setValue(item.id)
    searchInput.focus()
    selectedIndex = null
  }	
    
  const navigateList = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" && (selectedIndex === null || selectedIndex <= filteredItems.length - 1)) {
      selectedIndex === null ? selectedIndex = 0 : selectedIndex += 1
    } else if (e.key === "ArrowUp" && selectedIndex !== null) {
      selectedIndex === 0 ? selectedIndex = filteredItems.length - 1 : selectedIndex -= 1
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedIndex !== null) {
        selectItem(filteredItems[selectedIndex])
      }
    } else {
      return
    }
  } 
</script>

<svelte:window on:keydown={navigateList} />

<div class="autocomplete">
  <input 
    type="text" 
    {placeholder} 
    bind:this={searchInput}
    bind:value={searchString}
    on:blur={handleBlur}
    on:focus={handleFocus}
  />

  {#if isSearching && filteredItems.length}
  <ul class="filteredItems">
      {#each filteredItems as item, i}
        <li 
          class={i === selectedIndex ? 'selected' : ''} 
          on:click={() => selectItem(item)}
        >
          {item.name}
        </li>
      {/each}			
    </ul>
  {/if}
</div>


<style lang="scss">
  .autocomplete {
    width: 100%;
  }
  
  .filteredItems {
    height: 100%;
    max-height: 400px;
    overflow-y: auto;
    list-style: none;
    padding: 0;
    background-color: var(--colorOffWhite);
    border: 1px solid var(--colorGreen);
    border-radius: var(--borderRadius);

    li {
      padding: var(--spacing);
      cursor: pointer;
    }

    li:hover,
    li.selected {
      background-color: var(--colorGreen);
      color: var(--colorOffWhite);
    }
  }
</style>