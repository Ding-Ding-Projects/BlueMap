<template>
  <Transition name="side-menu" @enter="buttonEnterAnimation(); $emit('enter', $event)">
    <VSheet class="side-menu" v-show="open" elevation="3" role="region" :aria-label="title">
      <MenuButton :close="open && rendered" :back="back" @action="$emit('back', $event)" />
      <MenuButton class="full-close" v-if="open && back" :close="true" @action="$emit('close', $event)" />
      <div class="title">{{ title }}</div>
      <div class="content">
        <slot />
      </div>
    </VSheet>
  </Transition>
</template>

<script>
import { VSheet } from 'vuetify/components';
import MenuButton from "../ControlBar/MenuButton.vue";

export default {
  name: "SideMenu",
  components: {MenuButton, VSheet},
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

  width: calc(100% - 24px);
  max-width: 22em;
  height: calc(100% - 24px);
  margin: 12px;

  // Contour: a floating M3 side sheet, an opaque surface-container-low plane with the
  // extra-large corner and level-1 elevation, held off the screen edge so the map reads round
  // it. It is opaque by construction: nothing behind it is ever read through it.
  border-radius: $md-shape-xl;
  box-shadow: var(--md-sys-elevation-1);

  background-color: var(--md-sys-color-surface-container-low);

  @media (max-width: $mobile-break) {
    width: 100%;
    max-width: unset;
    height: 100%;
    margin: 0;
    border-radius: 0;
  }
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
