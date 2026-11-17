<template>
  <VApp id="app" :theme="appState.theme === 'light' ? 'light' : 'dark'" :class="{'theme-light': appState.theme === 'light', 'theme-dark': appState.theme === 'dark', 'theme-contrast': appState.theme === 'contrast'}">
    <FreeFlightMobileControls v-if="mapViewer.mapState === 'loaded' && appState.controls.state === 'free'" />
    <ZoomButtons v-if="showMapMenu && appState.controls.showZoomButtons && appState.controls.state !== 'free'" />
    <ControlBar />
    <div v-if="mapViewer.mapState !== 'loaded'" class="map-state-message" :class="mapViewer.mapState" :role="mapViewer.mapState === 'errored' ? 'alert' : 'status'">
      <VProgressCircular v-if="mapViewer.mapState !== 'errored'" indeterminate size="24" width="3" color="primary" aria-hidden="true" />
      <svg v-else class="map-state-message__icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.1"/></svg>
      <span>{{ $t("map." + mapViewer.mapState) }}</span>
    </div>
    <MainMenu :menu="appState.menu" />
  </VApp>
</template>

<script>
import { VApp, VProgressCircular } from 'vuetify/components';
import ControlBar from "./components/ControlBar/ControlBar.vue";
import MainMenu from "./components/Menu/MainMenu.vue";
import FreeFlightMobileControls from "./components/Controls/FreeFlightMobileControls.vue";
import ZoomButtons from "./components/Controls/ZoomButtons.vue";

export default {
  name: 'App',
  components: {
    VApp, VProgressCircular,
    FreeFlightMobileControls,
    MainMenu,
    ControlBar,
    ZoomButtons
  },
  computed: {
    showMapMenu() {
      return this.mapViewer.mapState === "loading" || this.mapViewer.mapState === "loaded";
    }
  },
  data() {
    return {
      appState: this.$bluemap.appState,
      mapViewer: this.$bluemap.mapViewer.data
    }
  }
}
</script>

<style lang="scss">
@import "/src/scss/variables.scss";

  @import "./scss/global.scss";

  #map-container {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  #app {
    position: absolute;
    width: 100%;
    height: 100%;

    z-index: 10000; // put over bluemap markers

    pointer-events: none;

    // M3 surface background / on-surface text and the body-large type role,
    // established once at the shell root so every descendant inherits it.
    // The shell overlays terrain. Only controls paint surfaces, not this full-screen layer.
    background-color: transparent;
    color: var(--md-sys-color-on-surface);

    font-size: 1rem;
    line-height: var(--md-sys-typescale-body-large-line);
    letter-spacing: var(--md-sys-typescale-body-large-tracking);
    @media (max-width: $mobile-break) {
      font-size: 1.5rem;
    }

    // Loading and error status: a small opaque card, so it reads over any terrain.
    .map-state-message {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      gap: 16px;
      max-width: calc(100vw - 32px);
      box-sizing: border-box;
      padding: 16px 24px;
      border-radius: $md-shape-l;
      background-color: var(--md-sys-color-surface-container);
      color: var(--md-sys-color-on-surface);
      box-shadow: var(--md-sys-elevation-3);
      font-size: var(--md-sys-typescale-body-large-size);
      line-height: var(--md-sys-typescale-body-large-line);
      pointer-events: auto;

      &.errored {
        background-color: var(--md-sys-color-error-container);
        color: var(--md-sys-color-on-error-container);
      }

      &__icon {
        width: 24px;
        height: 24px;
        flex: 0 0 24px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
      }
    }
  }
</style>
