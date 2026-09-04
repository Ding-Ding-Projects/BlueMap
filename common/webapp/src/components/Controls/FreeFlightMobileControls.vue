<template>
  <div id="ff-mobile-controls" :class="{disabled: !enabled}">
    <div class="move-fields">
      <div class="button up-button" role="button" tabindex="0" aria-label="Move forward"
           @touchstart.passive="forward = 1; forwardPointer = $event.changedTouches[0].identifier; $event.preventDefault();"
           @keydown.enter.prevent="forward = 1" @keydown.space.prevent="forward = 1"
           @keyup.enter.prevent="forward = 0" @keyup.space.prevent="forward = 0">
        <svg viewBox="0 0 100 50">
          <path d="M6.75,48.375c-2.75,0-3.384-1.565-1.409-3.479L46.41,5.104c1.975-1.914,5.207-1.913,7.182,0l41.067,39.792
            c1.975,1.914,1.341,3.479-1.409,3.479H6.75z"/>
        </svg>
      </div>
      <div class="button down-button" role="button" tabindex="0" aria-label="Move backward"
           @touchstart.passive="forward = -1; forwardPointer = $event.changedTouches[0].identifier; $event.preventDefault();"
           @keydown.enter.prevent="forward = -1" @keydown.space.prevent="forward = -1"
           @keyup.enter.prevent="forward = 0" @keyup.space.prevent="forward = 0">
        <svg viewBox="0 0 100 50" class="down">
          <path d="M6.75,48.375c-2.75,0-3.384-1.565-1.409-3.479L46.41,5.104c1.975-1.914,5.207-1.913,7.182,0l41.067,39.792
            c1.975,1.914,1.341,3.479-1.409,3.479H6.75z"/>
        </svg>
      </div>
    </div>
    <div class="height-fields">
      <div class="button up-button" role="button" tabindex="0" aria-label="Move up"
           @touchstart.passive="up = 1; upPointer = $event.changedTouches[0].identifier; $event.preventDefault();"
           @keydown.enter.prevent="up = 1" @keydown.space.prevent="up = 1"
           @keyup.enter.prevent="up = 0" @keyup.space.prevent="up = 0">
        <svg viewBox="0 0 100 50">
          <path d="M6.75,48.375c-2.75,0-3.384-1.565-1.409-3.479L46.41,5.104c1.975-1.914,5.207-1.913,7.182,0l41.067,39.792
            c1.975,1.914,1.341,3.479-1.409,3.479H6.75z"/>
        </svg>
      </div>
      <div class="button down-button" role="button" tabindex="0" aria-label="Move down"
           @touchstart.passive="up = -1; upPointer = $event.changedTouches[0].identifier; $event.preventDefault();"
           @keydown.enter.prevent="up = -1" @keydown.space.prevent="up = -1"
           @keyup.enter.prevent="up = 0" @keyup.space.prevent="up = 0">
        <svg viewBox="0 0 100 50" class="down">
          <path d="M6.75,48.375c-2.75,0-3.384-1.565-1.409-3.479L46.41,5.104c1.975-1.914,5.207-1.913,7.182,0l41.067,39.792
            c1.975,1.914,1.341,3.479-1.409,3.479H6.75z"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "FreeFlightMobileControls",
  data() {
    return {
      enabled: false,
      forward: 0,
      forwardPointer: -1,
      up: 0,
      upPointer: -1,
    }
  },
  methods: {
    onTouchStop(evt) {
      console.log("Stop: ", evt);

      if (evt.changedTouches[0].identifier === this.forwardPointer) this.forward = 0;
      if (evt.changedTouches[0].identifier === this.upPointer) this.up = 0;
    },
    onFrame(evt) {
      let cm = this.$bluemap.mapViewer.controlsManager;
      cm.position.x += this.forward * Math.sin(cm.rotation) * evt.detail.delta * 0.02;
      cm.position.z += this.forward * -Math.cos(cm.rotation) * evt.detail.delta * 0.02;
      cm.position.y += this.up * evt.detail.delta * 0.01;
    },
    enable() {
      this.enabled = true;
    },
  },
  mounted() {
    window.addEventListener("touchstart", this.enable, { passive: true });

    window.addEventListener("touchend", this.onTouchStop);
    window.addEventListener("touchcancel", this.onTouchStop);
    this.$bluemap.events.addEventListener("bluemapRenderFrame", this.onFrame);
  },
  beforeUnmount() {
    window.removeEventListener("touchstart", this.enable);

    window.removeEventListener("touchend", this.onTouchStop);
    window.removeEventListener("touchcancel", this.onTouchStop);
    this.$bluemap.events.removeEventListener("bluemapRenderFrame", this.onFrame);
  }
}
</script>

<style lang="scss">
  @import "/src/scss/variables.scss";

  // These are floating directional actions, styled with M3 FAB anatomy
  // (primary-container fill, fully-rounded, elevation-3 at rest / elevation-4
  // on hover) rather than the flat single-colour buttons upstream shipped.
  // Sizing stays relative to viewport width (15vw), as these are large
  // thumb-zone touch targets on mobile that already exceed the 48px floor;
  // a min-width/min-height floor is added only as a safety net.
  #ff-mobile-controls {
    font-size: 15vw;

    &.disabled {
      display: none;
    }

    @media (orientation: portrait) {
      font-size: 15vh;
    }

    .button {
      width: 1em;
      height: 1em;
      margin: 0.1em;

      min-width: $md-touch-target;
      min-height: $md-touch-target;
      box-sizing: border-box;

      display: flex;
      align-items: center;
      justify-content: center;

      pointer-events: auto;
      cursor: pointer;

      border-radius: $md-shape-l;
      background-color: var(--md-sys-color-primary-container);
      box-shadow: var(--md-sys-elevation-3);
      opacity: 0.85;

      transition: box-shadow $md-duration-short $md-easing-standard,
        opacity $md-duration-short $md-easing-standard,
        background-color $md-duration-short $md-easing-standard;

      &:hover {
        box-shadow: var(--md-sys-elevation-4);
      }

      &:focus-visible {
        outline: 3px solid var(--md-sys-color-primary);
        outline-offset: 2px;
      }

      svg {
        width: 45%;
        fill: var(--md-sys-color-on-primary-container);
      }

      &:active {
        background-color: var(--md-sys-color-primary);
        opacity: 1;

        svg {
          fill: var(--md-sys-color-on-primary);
        }
      }

      svg.down {
        transform: scaleY(-1);
      }

      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    }

    .move-fields {
      position: fixed;

      bottom: 0.2em;
      left: 0.2em;

    }

    .height-fields {
      position: fixed;

      bottom: 0.2em;
      right: 0.2em;
    }

  }

</style>
