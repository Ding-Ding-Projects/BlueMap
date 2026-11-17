<template>
  <SideMenu :open="menu.isOpen"
            :title="menu.currentPage().title"
            :back="menu.pageStack.length > 1"
            @back="menu.closePage()"
            @close="menu.closeAll()">

    <div v-if="menu.currentPage().id === 'root'">
      <SimpleButton :icon="icons.map" @action="menu.openPage('maps', () => $t('maps.title'))" :submenu="true" :hint="currentMapName">{{ $t("maps.button") }}</SimpleButton>
      <SimpleButton :icon="icons.markers" @action="menu.openPage('markers', () => $t('markers.title'), {markerSet: markers})" :submenu="true">{{ $t("markers.button") }}</SimpleButton>
      <SimpleButton :icon="icons.settings" @action="menu.openPage('settings', () => $t('settings.title'))" :submenu="true">{{ $t("settings.button") }}</SimpleButton>
      <SimpleButton :icon="icons.info" @action="menu.openPage('info', () => $t('info.title'))" :submenu="true">{{ $t("info.button") }}</SimpleButton>
      <SimpleButton :icon="icons.annotations" @action="menu.openPage('shared-annotations', () => hostingLabel)" :submenu="true">{{ hostingLabel }}</SimpleButton>
      <SimpleButton v-if="customLayers.available" :icon="icons.layers" @action="menu.openPage('custom-layers', () => layersLabel)" :submenu="true">{{ layersLabel }}</SimpleButton>
      <div v-if="$bluemap.mapViewer.data.map" class="menu-view-controls">
        <Compass :title="$t('compass.tooltip')" />
        <DayNightSwitch :title="$t('lighting.dayNightSwitch.tooltip')" />
        <ControlsSwitch />
      </div>
      <hr>
      <SimpleButton :icon="icons.fullscreen" @action="goFullscreen">{{ $t("goFullscreen.button") }}</SimpleButton>
      <SimpleButton :icon="icons.resetCamera" @action="$bluemap.resetCamera()">{{ $t("resetCamera.button") }}</SimpleButton>
      <SimpleButton :icon="icons.screenshot" @action="$bluemap.takeScreenshot()">{{ $t("screenshot.button") }}</SimpleButton>
      <SimpleButton :icon="icons.updateMap" @action="$bluemap.updateMap()" :hint="$t('updateMap.tooltip')">{{ $t("updateMap.button") }}</SimpleButton>
    </div>

    <div v-if="menu.currentPage().id === 'maps'">
      <MapButton v-for="map of appState.maps" :key="map.id" :map="map" />
    </div>

    <MarkerSetMenu v-if="menu.currentPage().id === 'markers'" :menu="menu" />

    <SharedAnnotations v-show="menu.currentPage().id === 'shared-annotations'" />
    <CustomLayers v-show="menu.currentPage().id === 'custom-layers'" />
    <SettingsMenu v-if="menu.currentPage().id === 'settings'" />

    <div class="info-content" v-if="menu.currentPage().id === 'info'" v-html="$t('info.content', {
      version: $bluemap.settings.version
    })"></div>

  </SideMenu>
</template>

<script>
import Compass from '../ControlBar/Compass.vue';
import DayNightSwitch from '../ControlBar/DayNightSwitch.vue';
import ControlsSwitch from '../ControlBar/ControlsSwitch.vue';
import SharedAnnotations from '../Hosting/SharedAnnotations.vue';
import CustomLayers from '../Hosting/CustomLayers.vue';
import { customLayersState } from '../../js/hosting/customLayersStore.js';
import { layerText } from '../Hosting/layerMessages.mjs';
import { hostingText } from '../Hosting/messages.mjs';
import SideMenu from "./SideMenu.vue";
import SimpleButton from "./SimpleButton.vue";
import SettingsMenu from "./SettingsMenu.vue";
import {MainMenu} from "../../js/MainMenu";
import MarkerSetMenu from "./MarkerSetMenu.vue";
import MapButton from "./MapButton.vue";
import { MENU_ICONS } from "../../js/MenuIcons.js";

export default {
  name: "MainMenu",
  components: {Compass, DayNightSwitch, ControlsSwitch, SharedAnnotations, CustomLayers, MapButton, MarkerSetMenu, SettingsMenu, SimpleButton, SideMenu},
  props: {
    menu: MainMenu
  },
  data() {
    return {
      appState: this.$bluemap.appState,
      markers: this.$bluemap.mapViewer.markers.data,
      icons: MENU_ICONS,
      customLayers: customLayersState,
    }
  },
  computed: { currentMapName() { const map = this.$bluemap.mapViewer.data.map; if (!map) return ''; const entry = this.appState.maps.find(m => m.id === map.id); return entry && entry.name ? entry.name : map.id; }, layersLabel() { return layerText(this.$i18n.locale, "title"); }, hostingLabel() { return hostingText(this.$i18n.locale, "title"); } },
  methods: {
    goFullscreen() {
      document.body.requestFullscreen();
    }
  }
}
</script>

<style lang="scss">
// The view controls sit in one outlined row of 48 px targets, evenly spread.
.menu-view-controls { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 4px; margin: 8px 16px; padding: 4px; border: 1px solid var(--md-sys-color-outline-variant); border-radius: 28px; }
.menu-view-controls .controls-switch .v-btn.v-btn--active { background-color: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); }
@import "../../scss/variables.scss";

.info-content {
  font-size: var(--md-sys-typescale-body-medium-size);
    line-height: var(--md-sys-typescale-body-medium-line);
  color: var(--md-sys-color-on-surface);

  table {
    border-collapse: collapse;
    width: 100%;

    tr {
      th, td {
        padding: 0.4em 0.5em;
        border: solid 1px var(--md-sys-color-outline-variant);
      }

      th {
        font-weight: inherit;
        text-align: inherit;
        color: var(--md-sys-color-on-surface-variant);
      }
    }
  }

  .info-footer {
    text-align: center;
    color: var(--md-sys-color-on-surface-variant);
  }
}
</style>