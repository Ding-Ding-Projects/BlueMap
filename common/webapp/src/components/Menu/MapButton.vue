<template>
  <div class="map-button" :class="{selected: map.id === selectedMapId}" @click="switchMap(map.id)" :title="map.id"
       role="button" tabindex="0" :aria-pressed="map.id === selectedMapId"
       @keydown.enter.prevent="switchMap(map.id)" @keydown.space.prevent="switchMap(map.id)">
    <span class="sky" :style="{color: 'rgb(' + map.skyColor.r * 255 + ',' + map.skyColor.g * 255 + ',' + map.skyColor.b * 255 + ')'}">&bull;</span>
    <span class="name">{{map.name}}</span>
  </div>
</template>

<script>
export default {
  name: "MapButton",
  props: {
    map: Object,
  },
  data() {
    return {
      mapViewer: this.$bluemap.mapViewer.data,
      appState: this.$bluemap.appState,
    }
  },
  computed: {
    selectedMapId() {
      return this.mapViewer.map ? this.mapViewer.map.id : null;
    }
  },
  methods: {
    switchMap(mapId) {
      this.$bluemap.switchMap(mapId);
    }
  }
}
</script>

<style lang="scss">
@import "../../scss/variables.scss";

.side-menu .map-button {
  position: relative;
  cursor: pointer;
  user-select: none;

  display: flex;
  align-items: center;
  gap: 0.75em;

  min-height: $md-touch-target;
  padding: 0 1em;

  font-size: var(--md-sys-typescale-body-large-size);
    line-height: var(--md-sys-typescale-body-large-line);
  color: var(--md-sys-color-on-surface);

  white-space: nowrap;
  overflow-x: hidden;
  text-overflow: ellipsis;

  transition: background-color $md-duration-short $md-easing-standard;
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-color: currentColor;
    opacity: 0;
    pointer-events: none;
    transition: opacity $md-duration-short $md-easing-standard;
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }

  &.selected {
    font-weight: 600;
    background-color: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);
  }

  &:hover::before {
    opacity: $md-state-hover;
  }

  &:focus-visible {
    outline: 3px solid var(--md-sys-color-primary);
    outline-offset: -3px;
    z-index: 1;
  }
  &:focus-visible::before {
    opacity: $md-state-focus;
  }

  &:active::before {
    opacity: $md-state-pressed;
  }

  .sky {
    flex-shrink: 0;
    border-radius: $md-shape-full;

    width: 0.6em;
    height: 0.6em;
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .id {
    font-style: italic;
    color: var(--md-sys-color-on-surface-variant);

    margin: 0 0.5em;
  }
}
</style>