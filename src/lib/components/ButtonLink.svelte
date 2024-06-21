<script>
  export let href
</script>

<a {href} {...$$restProps}>
  <slot />
</a>

<style lang="scss">
  a {
    display: inline-block;
    text-decoration: none;
    background: var(--colorOffWhite);
    color: var(--colorGreen);
    border: 1px solid var(--colorGreen);
    border-radius: var(--borderRadius);
    padding: calc(0.5 * var(--spacing)) var(--spacing);
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 var(--colorGreen);
    transition: all 0.25s;
    cursor: pointer;
    line-height: 1;

    @media (hover: hover) {
      &:hover {
        box-shadow: none;
        transform: translate(0, 0);
      }
    }
    
    &.selected {
      color: var(--colorOffWhite);
      background: var(--colorGreen);
    }
  }

  a.icon {
    text-indent: -999em;
    background-repeat: no-repeat;
    background-position: center;
    background-size: var(--fsNormal);
    width: 30px;

    &.saveFilled {
      background-image: url('/icon-save-filled-green.svg');
    }
    &.search {
      background-image: url('/icon-search-green.svg');
    }
    &.info {
      background-image: url('/icon-info-green.svg');
    }
  }
</style>