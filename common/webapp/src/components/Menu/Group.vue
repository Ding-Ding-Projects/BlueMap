<template>
  <div class="group">
    <span class="title">{{ title }}</span>
    <div class="content">
      <slot/>
    </div>
  </div>
</template>

<script>
export default {
  name: "Group",
  props: {
    title: String
  }
}
</script>

<style lang="scss">
@import "../../scss/variables.scss";

.side-menu .group {
  position: relative;
  margin: 1.5em 0 0.5em;
  padding-top: 0.75em;
  border-top: solid 1px var(--md-sys-color-outline-variant);

  > .title {
    display: block;
    font-size: var(--md-sys-typescale-title-medium-size);
    line-height: var(--md-sys-typescale-title-medium-line);
    font-weight: var(--md-sys-typescale-title-medium-weight, 500);
    color: var(--md-sys-color-on-surface-variant);
    padding: 0 0 0.5em;
  }

  &:first-child {
    margin-top: 1em;
  }

  > .content {
    max-height: 15em;
    overflow-y: auto;
  }
}
</style>