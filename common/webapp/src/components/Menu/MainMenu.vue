<template>
  <SideMenu :open="menu.isOpen"
            :title="menu.currentPage().title"
            :back="menu.pageStack.length > 1"
            @back="menu.closePage()"
            @close="menu.closeAll()">

    <div v-if="menu.currentPage().id === 'root'">
      <SimpleButton @action="menu.openPage('maps', () => $t('maps.title'))" :submenu="true">{{ $t("maps.button") }}</SimpleButton>
      <SimpleButton @action="menu.openPage('markers', () => $t('markers.title'), {markerSet: markers})" :submenu="true">{{ $t("markers.button") }}</SimpleButton>
      <SimpleButton @action="menu.openPage('settings', () => $t('settings.title'))" :submenu="true">{{ $t("settings.button") }}</SimpleButton>
      <SimpleButton @action="menu.openPage('info', () => $t('info.title'))" :submenu="true">{{ $t("info.button") }}</SimpleButton>
      <SimpleButton @action="menu.openPage('shared-annotations', () => hostingLabel)" :submenu="true">{{ hostingLabel }}</SimpleButton>
      <div v-if="$bluemap.mapViewer.data.map" class="menu-view-controls">
        <Compass :title="$t('compass.tooltip')" />
        <DayNightSwitch :title="$t('lighting.dayNightSwitch.tooltip')" />
        <ControlsSwitch />
      </div>
      <hr>
      <SimpleButton @action="goFullscreen">{{ $t("goFullscreen.button") }}</SimpleButton>
      <SimpleButton @action="$bluemap.resetCamera()">{{ $t("resetCamera.button") }}</SimpleButton>
      <SimpleButton @action="$bluemap.takeScreenshot()">{{ $t("screenshot.button") }}</SimpleButton>
      <SimpleButton @action="$bluemap.updateMap()" :title="$t('updateMap.tooltip')">{{ $t("updateMap.button") }}</SimpleButton>
    </div>

    <div v-if="menu.currentPage().id === 'maps'">
      <MapButton v-for="map of appState.maps" :key="map.id" :map="map" />
    </div>

    <MarkerSetMenu v-if="menu.currentPage().id === 'markers'" :menu="menu" />

    <SharedAnnotations v-show="menu.currentPage().id === 'shared-annotations'" />
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
import { hostingText } from '../Hosting/messages.mjs';
import SideMenu from "./SideMenu.vue";
import SimpleButton from "./SimpleButton.vue";
import SettingsMenu from "./SettingsMenu.vue";
import {MainMenu} from "../../js/MainMenu";
import MarkerSetMenu from "./MarkerSetMenu.vue";
import MapButton from "./MapButton.vue";

export default {
  name: "MainMenu",
  components: {Compass, DayNightSwitch, ControlsSwitch, SharedAnnotations, MapButton, MarkerSetMenu, SettingsMenu, SimpleButton, SideMenu},
  props: {
    menu: MainMenu
  },
  data() {
    return {
      appState: this.$bluemap.appState,
      markers: this.$bluemap.mapViewer.markers.data,
    }
  },
  computed: { hostingLabel() { return hostingText(this.$i18n.locale, "title"); } },
  methods: {
    goFullscreen() {
      document.body.requestFullscreen();
    }
  }
}
</script>

<style lang="scss">
.menu-view-controls { display:flex; flex-wrap:wrap; gap:4px; padding:8px; }
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