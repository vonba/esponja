<script lang="ts">
</script>

<button on:click {...$$restProps}>
  <slot />
</button>

<style lang="scss">
  @import "$lib/sass/variables";

  button {
    font-size: var(--fsNormal);
    background: var(--colorOffWhite);
    color: var(--colorGreen);
    border: 1px solid var(--colorGreen);
    border-radius: var(--borderRadius);
    padding: calc(0.5 * var(--spacing)) var(--spacing);
    height: calc(var(--fsNormal) + var(--spacing) + 2px);
    box-shadow: 2px 2px 0 var(--colorGreen);
    transform: translate(-2px, -2px);
    transition: transform 0.25s, background-color 0.5s, color 0.25s, box-shadow 0.25s;
    cursor: pointer;
    line-height: 1;
    white-space: nowrap;

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        box-shadow: none;
        transform: translate(0, 0);
      }
    }

    &:disabled {
      opacity: 0.8;
      cursor: not-allowed;
    }
    
    &.selected {
      color: var(--colorOffWhite);
      background-color: var(--colorGreen);

      &.cross {
        background-image: url('/icon-close-offwhite.svg');
        background-repeat: no-repeat;
        padding-right: 20px;
        background-size: 10px;
        background-position: calc(100% - 5px) center;
      }
    }

    &.large {
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.5;
      font-style: italic;
      height: auto;
      text-align: center;
    }
  }

  button.icon {
    text-indent: -999em;
    background-repeat: no-repeat;
    background-position: center;
    background-size: var(--fsNormal);
    width: 30px;

    &.saveFilled {
      background-image: url('/icon-save-filled-green.svg');
      background-size: 12px;
    }
    &.saveOutline {
      background-image: url('/icon-save-outline-green.svg');
      background-size: 12px;
    }
    &.search {
      background-image: url('/icon-search-green.svg');
    }
    &.info {
      background-image: url('/icon-info-green.svg');
    }
    &.grid {
      background-image: url('/icon-grid-green.svg');
    }
    &.list {
      background-image: url('/icon-list-green.svg');
    }
    &.edit {
      background-image: url('/icon-edit-green.svg');
    }
    &.delete {
      background-image: url('/icon-delete-green.svg');
    }
    &.share {
      background-image: url('/icon-share-green.svg');
    }
    &.close {
      background-image: url('/icon-cross-green.svg');
    }
    
    &.selected {
      &.grid {
        background-image: url('/icon-grid-offwhite.svg');
      }
      &.list {
        background-image: url('/icon-list-offwhite.svg');
      }
    }
  }
</style>