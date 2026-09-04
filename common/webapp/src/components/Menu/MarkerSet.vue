<template>
  <div class="marker-set" :title="markerSet.id">
    <div class="info" @click="toggle"
         role="button" tabindex="0" :aria-pressed="markerSet.toggleable ? markerSet.visible : undefined"
         @keydown.enter.prevent="toggle" @keydown.space.prevent="toggle">
      <div class="marker-set-switch">
        <div class="label">{{ label }}</div>
        <SwitchHandle :on="markerSet.visible" v-if="markerSet.toggleable"/>
      </div>
      <div class="stats">
        <div v-if="filteredMarkerCount > 0">
          {{ filteredMarkerCount }}
          {{ $t('markers.marker', filteredMarkerCount) }}
        </div>
        <div v-if="filteredMarkerSetCount > 0">
          {{ filteredMarkerSetCount }}
          {{ $t('markers.markerSet', filteredMarkerSetCount) }}
        </div>
      </div>
    </div>
    <div class="open-menu-button"
         :class="{active: active}"
         :role="active ? 'button' : undefined" :tabindex="active ? 0 : undefined"
         @click="more($event)"
         @keydown.enter.prevent="more($event)" @keydown.space.prevent="more($event)">
      <svg viewBox="0 0 30 30">
        <path d="M25.004,9.294c0,0.806-0.75,1.46-1.676,1.46H6.671c-0.925,0-1.674-0.654-1.674-1.46l0,0
	c0-0.807,0.749-1.461,1.674-1.461h16.657C24.254,7.833,25.004,8.487,25.004,9.294L25.004,9.294z"/>
        <path d="M25.004,20.706c0,0.807-0.75,1.461-1.676,1.461H6.671c-0.925,0-1.674-0.654-1.674-1.461l0,0
	c0-0.807,0.749-1.461,1.674-1.461h16.657C24.254,19.245,25.004,19.899,25.004,20.706L25.004,20.706z"/>
      </svg>
    </div>
  </div>
</template>

<script>
import SwitchHandle from "./SwitchHandle.vue";

export default {
  name: "MarkerSet",
  components: {SwitchHandle},
  props: {
    markerSet: Object,
  },
  computed: {
    filteredMarkerSetCount() {
      let count = 0;
      for (let markerSet of this.markerSet.markerSets) {
        if (markerSet.listed) count++;
      }
      return count;
    },
    filteredMarkerCount() {
      let count = 0;
      for (let marker of this.markerSet.markers) {
        if (marker.listed) count++;
      }
      return count;
    },
    label() {
      if (this.markerSet.id === "bm-players") return this.$t("players.title");
      return this.markerSet.label;
    },
    active() {
      for (let marker of this.markerSet.markers) {
        if (marker.listed) return true;
      }
      for (let markerSet of this.markerSet.markerSets) {
        if (markerSet.listed) return true;
      }
      return false;
    }
  },
  methods: {
    toggle() {
      if (this.markerSet.toggleable) {
        // eslint-disable-next-line vue/no-mutating-props
        this.markerSet.visible = !this.markerSet.visible
        this.markerSet.saveState();
      }
    },
    more(event) {
      if (this.active) {
        this.$emit('more', event);
      }
    }
  }
}
</script>

<style lang="scss">
@import "../../scss/variables.scss";

.side-menu .marker-set {
  position: relative;
  display: flex;
  user-select: none;

  border-radius: $md-shape-xs;
  overflow: hidden;

  margin: 0.25em 0;

  &:first-child {
    margin-top: 0;
  }

  &:last-child {
    margin-bottom: 0;
  }

  > .info {
    position: relative;
    flex-grow: 1;
    cursor: pointer;
    min-height: $md-touch-target;
    display: flex;
    align-items: center;

    padding: 0.5em 1em;

    font-size: var(--md-sys-typescale-body-large-size);
    line-height: var(--md-sys-typescale-body-large-line);
    color: var(--md-sys-color-on-surface);

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

    > .marker-set-switch {
      position: relative;
      width: 100%;

      .label {
        margin: 0 2.5em 0 0;
      }

      > .switch {
        position: absolute;
        top: 50%;
        right: 0;
        transform: translateY(-50%);
      }
    }

    > .stats {
      display: flex;
      font-size: var(--md-sys-typescale-body-medium-size);
    line-height: var(--md-sys-typescale-body-medium-line);
      color: var(--md-sys-color-on-surface-variant);

      > div {
        &:not(:first-child) {
          margin-left: 0.5em;
          padding-left: 0.5em;
          border-left: solid 1px var(--md-sys-color-outline-variant);
        }
      }
    }
  }

  > .open-menu-button {
    position: relative;
    width: $md-touch-target;
    min-height: $md-touch-target;

    &.active {
      cursor: pointer;

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

      > svg {
        position: relative;
        fill: var(--md-sys-color-on-surface-variant);

        top: 50%;
        transform: translate(0, -50%) scale(0.75);

        path:nth-child(1) {
          transform-origin: 15px 9px;
          transform: translate(0, 10px) rotate(-30deg);
        }

        path:nth-child(2) {
          transform-origin: 15px 21px;
          transform: translate(0, -10px) rotate(30deg);
        }
      }

      &:active::before {
        opacity: $md-state-pressed;
      }
    }

    &:not(.active) {
      svg {
        display: none;
      }
    }
  }
}
</style>