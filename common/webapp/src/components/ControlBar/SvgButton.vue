<template>
  <div
    class="svg-button"
    :class="{active: active}"
    role="button"
    tabindex="0"
    :aria-label="title || undefined"
    :aria-pressed="toggle ? (active ? 'true' : 'false') : undefined"
    :title="title || undefined"
    @click="$emit('action', $event)"
    @keydown.enter.prevent="$emit('action', $event)"
    @keydown.space.prevent="$emit('action', $event)"
  >
    <slot />
  </div>
</template>

<script>
  export default {
    name: "SvgButton",
    props: {
      active: Boolean,
      toggle: Boolean,
      title: String,
    }
  }
</script>

<style lang="scss">
  @import "/src/scss/variables.scss";

  // M3 icon-button anatomy: a 48px touch target wrapping a 40px painted,
  // fully-rounded container. The state layer is a currentColor overlay
  // (::before), never a background-colour swap.
  .svg-button {
    position: relative;
    pointer-events: auto;
    cursor: pointer;
    user-select: none;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    box-sizing: border-box;
    min-width: $md-touch-target;
    min-height: $md-touch-target;
    width: $md-touch-target;
    height: $md-touch-target;

    color: var(--md-sys-color-on-surface-variant);
    background-color: transparent;
    border-radius: $md-shape-full;

    transition: color $md-duration-short $md-easing-standard,
      background-color $md-duration-short $md-easing-standard;

    &::before {
      content: "";
      position: absolute;
      inset: 4px;
      border-radius: inherit;
      background-color: currentColor;
      opacity: 0;
      pointer-events: none;
      transition: opacity $md-duration-short $md-easing-standard;
    }

    &:hover::before {
      opacity: $md-state-hover;
    }

    &:focus-visible {
      outline: 3px solid var(--md-sys-color-primary);
      outline-offset: 2px;
    }

    &:focus-visible::before {
      opacity: $md-state-focus;
    }

    &:active::before,
    &.active::before {
      opacity: $md-state-pressed;
    }

    // M3 "selected" icon button: filled with the primary container role,
    // never just a re-tinted state layer.
    &.active {
      color: var(--md-sys-color-on-primary-container);
      background-color: var(--md-sys-color-primary-container);
    }

    svg {
      position: relative;
      width: 24px;
      height: 24px;
      fill: currentColor;
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;

      &::before {
        transition: none;
      }
    }
  }
</style>
