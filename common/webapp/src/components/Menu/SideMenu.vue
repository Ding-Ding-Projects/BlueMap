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

  &-enter-active {
    transition: opacity $md-duration-medium-2 $md-easing-standard-decelerate,
                transform $md-duration-medium-2 $md-easing-emphasized-decelerate;
  }

  &-leave-active {
    transition: opacity $md-duration-short-4 $md-easing-standard-accelerate,
                transform $md-duration-short-4 $md-easing-standard-accelerate;
  }

  @media (prefers-reduced-motion: reduce) {
    &-enter-active, &-leave-active {
      transition: none;
    }

  }

  &-enter-from, &-leave-to {
    opacity: 0;
    transform: translateX(-16px);
    pointer-events: none;

    * {
      pointer-events: none !important;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &-enter-from, &-leave-to {
      transform: none;
    }
  }

  > .menu-button {
    position: absolute;
    top: 0;
    left: 0;

    // 8 px inset puts a 48 px button in the centre of the 64 px header on every width.
    margin: 8px;

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
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    box-sizing: border-box;
    height: 64px;
    display: flex;
    align-items: center;
    color: var(--md-sys-color-on-surface);

    background-color: inherit;
    border-bottom: solid 1px var(--md-sys-color-outline-variant);

    // Clear of the 48 px leading button, and of the trailing close button when present.
    padding: 0 64px;
  }

  > .content {
    position: relative;

    overflow-y: auto;
    overflow-x: hidden;

    padding: 0.5em;

    height: calc(100% - 64px - 1px);

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
