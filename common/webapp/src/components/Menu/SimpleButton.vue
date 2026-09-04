<template>
<div class="simple-button" :class="{active: active}" @click="$emit('action')">
  <div class="label"><slot /></div>
  <div class="submenu-icon" v-if="submenu">
    <svg viewBox="0 0 30 30">
      <path d="M25.004,9.294c0,0.806-0.75,1.46-1.676,1.46H6.671c-0.925,0-1.674-0.654-1.674-1.46l0,0
	c0-0.807,0.749-1.461,1.674-1.461h16.657C24.254,7.833,25.004,8.487,25.004,9.294L25.004,9.294z"/>
      <path d="M25.004,20.706c0,0.807-0.75,1.461-1.676,1.461H6.671c-0.925,0-1.674-0.654-1.674-1.461l0,0
	c0-0.807,0.749-1.461,1.674-1.461h16.657C24.254,19.245,25.004,19.899,25.004,20.706L25.004,20.706z"/>
    </svg>
  </div>
</div>
</template>

<script>
export default {
  name: "SimpleButton",
  props: {
    submenu: Boolean,
    active: {
      type: Boolean,
      default: false,
    }
  }
}
</script>

<style lang="scss">
@import "/src/scss/variables.scss";

// M3 list item.
//
// Upstream swapped the row's background colour on hover, and on press inverted the
// foreground and background outright - a flash of reversed colour that reads as a
// rendering fault rather than a press. M3 uses a state layer instead: one tinted
// overlay of the row's own text colour, at a spec opacity, over an unchanged
// background. The row keeps its colours and simply gains emphasis.
.side-menu .simple-button {
  position: relative;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 12px;

  // 48px is the M3 minimum target and the minimum anything on a touch screen may
  // be. The old `line-height: 2em` produced a 32px row.
  min-height: $md-touch-target;
  padding: 0 16px;
  border-radius: $md-shape-s;

  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-body-large-size);
  line-height: var(--md-sys-typescale-body-large-line);
  letter-spacing: var(--md-sys-typescale-body-large-tracking);

  // The state layer. `currentColor` means it tints correctly in every theme
  // without a per-theme hover colour needing to exist at all.
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background-color: currentColor;
    opacity: 0;
    pointer-events: none;
    transition: opacity $md-duration-short $md-easing-standard;
  }

  &:hover::before {
    opacity: $md-state-hover;
  }

  &:focus-visible::before {
    opacity: $md-state-focus;
  }

  &:active::before {
    opacity: $md-state-pressed;
  }

  // Focus must be visible on its own, not merely a slightly stronger hover: a
  // keyboard user has no pointer to tell them where they are.
  &:focus-visible {
    outline: 3px solid var(--md-sys-color-primary);
    outline-offset: 2px;
  }

  // Selected, in M3, is a container role rather than a grey wash - and it carries
  // a colour *and* a weight change, so it is not signalled by colour alone.
  &.active {
    background-color: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);
    font-weight: 500;
  }

  > .label {
    flex-grow: 1;

    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
  }

  > .submenu-icon {
    width: 24px;
    height: 24px;

    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    > svg {
      fill: var(--md-sys-color-on-surface-variant);

      path:nth-child(1) {
        transform-origin: 15px 9px;
        transform: translate(0, 10px) rotate(-30deg);
      }
      path:nth-child(2) {
        transform-origin: 15px 21px;
        transform: translate(0, -10px) rotate(30deg);
      }

      transform: scale(0.75);
    }
  }

  &.active > .submenu-icon > svg {
    fill: var(--md-sys-color-on-secondary-container);
  }

  @media (prefers-reduced-motion: reduce) {
    &::before {
      transition: none;
    }
  }
}
</style>
