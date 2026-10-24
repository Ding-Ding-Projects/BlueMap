<template>
  <VBtn icon variant="text" class="compass" :title="title" :aria-label="title" @click="action">
    <svg viewBox="0 0 30 30" :style="style">
      <path class="north" d="M14.792,1.04c0.114-0.354,0.299-0.354,0.412,0l4.089,12.729c0.114,0.353-0.097,0.642-0.468,0.642
        l-7.651,0.001c-0.371,0-0.581-0.288-0.468-0.642L14.792,1.04z"/>
      <path class="south" d="M10.707,16.23c-0.114-0.353,0.097-0.642,0.468-0.642l7.651-0.001c0.371,0,0.581,0.289,0.468,0.642
        l-4.086,12.73c-0.113,0.353-0.299,0.353-0.412,0L10.707,16.23z"/>
    </svg>
  </VBtn>
</template>

<script>
  import {animate, EasingFunctions} from "../../js/util/Utils";
  import { VBtn } from 'vuetify/components';



  export default {
    name: "Compass",
    components: {VBtn},
    props: {
      title: String,
    },
    data() {
      return {
        controls: this.$bluemap.mapViewer.controlsManager.data
      }
    },
    computed: {
      style() {
        return {transform: "translate(-50%, -50%) rotate(" + (-this.controls.rotation) + "rad)"}
      }
    },
    beforeUnmount() { if (this.animation) this.animation.cancel(); },
    methods: {
      action(evt) {
        evt?.preventDefault();

        if (this.animation) this.animation.cancel();

        let startRotation = this.controls.rotation;
        this.animation = animate(t => {
          this.controls.rotation = startRotation * (1-EasingFunctions.easeOutQuad(t));
        }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 300);
      }
    }
  }
</script>

<style lang="scss">
.compass, .day-night-switch, .controls-switch { pointer-events: auto; flex-shrink: 0; }
.day-night-switch svg, .controls-switch svg { width: 24px; height: 24px; fill: currentColor; }
  @import "/src/scss/variables.scss";

  // The compass is an illustration/indicator, not a plain icon button: its
  // needle is positioned absolutely so it can be rotated independently of the
  // button's own layout. Anatomy-wise it still gets the M3 icon-button surface
  // (via VBtn) plus shape/elevation; the two-tone needle fill below is
  // chrome styling (a north/south split for legibility), not a data encoding,
  // so it is mapped onto on-surface roles like any other icon colour.
  .compass {
    overflow: visible;

    svg {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 24px;
      height: 24px;

      .north {
        fill: var(--md-sys-color-on-surface);
      }

      .south {
        fill: var(--md-sys-color-on-surface-variant);
      }
    }

    &.v-btn--active,
    &:active {
      svg {
        .north {
          fill: var(--md-sys-color-on-primary-container);
        }

        .south {
          fill: var(--md-sys-color-on-primary-container);
          opacity: 0.7;
        }
      }
    }
  }
</style>
