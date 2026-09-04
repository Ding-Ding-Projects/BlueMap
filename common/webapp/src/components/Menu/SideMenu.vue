<template>
  <Transition name="side-menu" @enter="buttonEnterAnimation(); $emit('enter', $event)">
    <div class="side-menu" v-if="open">
      <MenuButton :close="open && rendered" :back="back" @action="$emit('back', $event)" />
      <MenuButton class="full-close" v-if="open && back" :close="true" @action="$emit('close', $event)" />
      <div class="title">{{ title }}</div>
      <div class="content">
        <slot />
      </div>
    </div>
  </Transition>
</template>

<script>
import MenuButton from "../ControlBar/MenuButton.vue";

export default {
  name: "SideMenu",
  components: {MenuButton},
  props: {
    title: {
      type: String,
      default: "Menu"
    },
    open: {
      type: Boolean,
      default: true
    },
    back: Boolean
  },
  data() {
    return {
      rendered: false
    }
  },
  methods: {
    async buttonEnterAnimation() {
      this.rendered = false;
      await this.$nextTick();
      await this.$nextTick();
      this.rendered = true;
    }
  }
}
</script>

<style lang="scss">
@import "/src/scss/variables.scss";

.side-menu {
  position: fixed;
  top: 0;
  left: 0;

  overflow: hidden;

  pointer-events: auto;

  width: 100%;
  max-width: 20em;
  height: 100%;

  // M3 side sheet: a surface-container plane at elevation 1, square against the
  // screen edge and rounded only on the inner corners, which is what distinguishes
  // a docked sheet from a floating dialog.
  border-radius: 0 $md-shape-l $md-shape-l 0;
  box-shadow: var(--md-sys-elevation-1);

  background-color: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface);

  &-enter-active, &-leave-active {
    transition: opacity $md-duration-long $md-easing-standard;
  }

  @media (prefers-reduced-motion: reduce) {
    &-enter-active, &-leave-active {
      transition: none;
    }
  }

  &-enter, &-leave-to {
    opacity: 0;
    pointer-events: none;

    * {
      pointer-events: none !important;
    }
  }

  > .menu-button {
    position: absolute;
    top: 0;
    left: 0;

    margin: 0.5em;

    @media (max-width: $mobile-break) {
      margin: 0;
    }

    &.full-close {
      right: 0;
      left: unset;
    }
  }

  > .title {
    // M3 gives a sheet header the title-large role, and a real divider rather than
    // a background change, so the header reads as one plane with the list.
    font-size: var(--md-sys-typescale-title-large-size);
    line-height: var(--md-sys-typescale-title-large-line);
    font-weight: 500;
    text-align: center;
    color: var(--md-sys-color-on-surface);

    background-color: inherit;
    border-bottom: solid 1px var(--md-sys-color-outline-variant);

    padding: 0.5em;
    @media (max-width: $mobile-break) {
      padding: 0;
    }
  }

  > .content {
    position: relative;

    overflow-y: auto;
    overflow-x: hidden;

    padding: 0.5em;

    height: calc(100% - 4em - 1px);
    @media (max-width: $mobile-break) {
      height: calc(100% - 3em - 1px);
    }

    hr {
      // A divider is a hairline in the outline-variant role, not a 2px slab in a
      // background colour.
      border: none;
      border-bottom: solid 1px var(--md-sys-color-outline-variant);
      margin: 8px 0;
    }
  }
}
</style>