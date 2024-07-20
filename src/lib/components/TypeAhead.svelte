<script lang="ts">
  type ListItem = {
    id: any,
    name: string,
  }

  type KeyboardEvent = globalThis.KeyboardEvent;

  // Props
  export let items: ListItem[]
  export let setValue: Function
  export let preSelectedItem: ListItem | null | undefined
  export let placeholder: string

  // State
  let searchInput: HTMLInputElement
  let optionsContainer: HTMLDivElement
  let selectedIndex: number | null = null
  let selectedItem = preSelectedItem ? {id: preSelectedItem.id, name: preSelectedItem.name} : null
  let searchString = preSelectedItem ? preSelectedItem.name : ''
  let optionsContainerFocused = false

  $: filteredItems = items.filter(
    item => !selectedItem || item.name.toLowerCase().startsWith(searchString.toLowerCase())
  )
  $: isSearching = selectedItem ? searchString !== selectedItem.name : false

  // TODO: would like to trigger then when text input blurs, to revert back to selected item.
  // However when clicking an option, blur occurs before the option is selected.
  // Unsure how to solve, have tried setting event handlers manually in onMount but it messed
  // with everything.
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

  const handleClear = () => {
    searchString = ''
    searchInput.focus()
  }
    
  const selectItem = (item: ListItem) => {
    setValue(item.id)
    selectedItem = item
    searchString = item.name
    selectedIndex = null
    isSearching = false
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
    on:focus={handleFocus}
  />
  {#if searchString !== ''}
    <button class="clear" on:click|preventDefault={handleClear}>Clear</button>
  {/if}

  {#if isSearching && filteredItems.length}
  <div class="filteredItems" bind:this={optionsContainer}>
      {#each filteredItems as item, i}
        <button 
          class={i === selectedIndex ? 'selected' : ''} 
          on:click|preventDefault={() => selectItem(item)}
        >
          {item.name}
        </button>
      {/each}			
    </div>
  {/if}
</div>


<style lang="scss">
  .autocomplete {
    width: 100%;
    position: relative;

    input {
      padding-right: 40px;
    }
  }

  .clear {
    background: transparent url('/icon-cross-green.svg') center no-repeat;
    background-size: 1em;
    width: 1em;
    height: 1em;
    position: absolute;
    right: 0.5em;
    top: 0.5em;
    appearance: none;
    border: none;
    text-indent: -9999em;
    cursor: pointer;
  }
  
  .filteredItems {
    height: 100%;
    max-height: 400px;
    overflow-y: auto;
    background-color: var(--colorOffWhite);
    border: 1px solid var(--colorGreen);
    border-radius: var(--borderRadius);

    button {
      padding: var(--spacing);
      cursor: pointer;
      appearance: none;
      width: 100%;
      border: none;
      background: transparent;
      color: var(--colorGreen);
      text-align: left;
    }

    button:hover,
    button.selected {
      background-color: var(--colorGreen);
      color: var(--colorOffWhite);
    }
  }
</style>