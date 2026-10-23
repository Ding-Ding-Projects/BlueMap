<template>
  <VApp id="app" :theme="appState.theme === 'light' ? 'light' : 'dark'" :class="{'theme-light': appState.theme === 'light', 'theme-dark': appState.theme === 'dark', 'theme-contrast': appState.theme === 'contrast'}">
    <FreeFlightMobileControls v-if="mapViewer.mapState === 'loaded' && appState.controls.state === 'free'" />
    <ZoomButtons v-if="showMapMenu && appState.controls.showZoomButtons && appState.controls.state !== 'free'" />
    <ControlBar />
    <VAlert v-if="mapViewer.mapState !== 'loaded'" class="map-state-message" :type="mapViewer.mapState === 'errored' ? 'error' : 'info'" variant="tonal" role="status">{{ $t("map." + mapViewer.mapState) }}</VAlert>
    <MainMenu :menu="appState.menu" />
  </VApp>
</template>

<script>
import { VApp, VAlert } from 'vuetify/components';
import ControlBar from "./components/ControlBar/ControlBar.vue";
import MainMenu from "./components/Menu/MainMenu.vue";
import FreeFlightMobileControls from "./components/Controls/FreeFlightMobileControls.vue";
import ZoomButtons from "./components/Controls/ZoomButtons.vue";

export default {
  name: 'App',
  components: {
    VApp, VAlert,
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

    .map-state-message {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1em;
      text-align: center;
    }
  }
</style>
