<template>
  <div class="switch" :class="{on: on}" role="switch" :aria-checked="on.toString()"></div>
</template>

<script>
export default {
  name: "SwitchHandle",
  props: {
    on: Boolean
  }
}
</script>

<style lang="scss">
@import "/src/scss/variables.scss";

// M3 switch: 52x32 track, $md-shape-full, 16px unselected / 24px selected handle
// that grows to 28px while pressed, with a 40px state-layer halo.
.side-menu .switch {
  position: relative;
  display: inline-block;
  box-sizing: border-box;

  width: 52px;
  height: 32px;

  border-radius: $md-shape-full;
  border: solid 2px var(--md-sys-color-outline);
  background-color: var(--md-sys-color-surface-container-highest);

  transition: background-color $md-duration-short $md-easing-standard,
              border-color $md-duration-short $md-easing-standard;

  flex-shrink: 0;

  // handle
  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 8px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: var(--md-sys-color-outline);
    transform: translate(0, -50%);

    transition: left $md-duration-short $md-easing-standard,
                width $md-duration-short $md-easing-standard,
                height $md-duration-short $md-easing-standard,
                background-color $md-duration-short $md-easing-standard;
  }

  // state-layer halo behind the handle
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 12px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: currentColor;
    color: var(--md-sys-color-outline);
    opacity: 0;
    transform: translate(-50%, -50%);
    pointer-events: none;

    transition: left $md-duration-short $md-easing-standard,
                opacity $md-duration-short $md-easing-standard,
                color $md-duration-short $md-easing-standard;
  }

  &.on {
    border-color: transparent;
    background-color: var(--md-sys-color-primary);

    &::before {
      left: 24px;
      width: 24px;
      height: 24px;
      background-color: var(--md-sys-color-on-primary);
    }

    &::after {
      left: 36px;
      color: var(--md-sys-color-primary);
    }
  }

  &:hover::after {
    opacity: $md-state-hover;
  }

  &:focus-visible::after,
  &:active::after {
    opacity: $md-state-pressed;
  }

  &:active::before {
    width: 28px;
    height: 28px;
  }

  &:focus-visible {
    outline: 3px solid var(--md-sys-color-primary);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &::before,
    &::after {
      transition: none;
    }
  }
}
</style>
