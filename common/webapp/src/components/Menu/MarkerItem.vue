<template>
  <div class="marker-item" :class="{'marker-hidden': !marker.visible}">
    <div class="marker-button" :title="marker.id" @click="click(false)"
         role="button" tabindex="0"
         @keydown.enter.prevent="click(false)" @keydown.space.prevent="click(false)">
      <div class="icon" v-if="marker.type === 'player'">
        <img :src="'maps/' + mapId +  '/assets/playerheads/' + marker.playerUuid + '.png'" alt="playerhead" @error="steve">
      </div>
      <div class="info">
        <div class="label">{{markerLabel}}</div>
        <div class="stats">
          <div v-if="appState.debug">
            {{marker.type}}-marker
          </div>
          <div>
            ({{ position(marker.position.x) }} | {{ position(marker.position.y) }} | {{ position(marker.position.z) }})
          </div>
        </div>
      </div>
    </div>
    <div class="follow-player-button" :class="{active: controls.controls.followingPlayer && controls.controls.followingPlayer.id === marker.id}"
         v-if="marker.type === 'player'" @click="click(true)" :title="$t('markers.followPlayerTitle')"
         role="button" tabindex="0" :aria-label="$t('markers.followPlayerTitle')"
         @keydown.enter.prevent="click(true)" @keydown.space.prevent="click(true)">
      <svg viewBox="0 0 30 30">
        <circle fill="none" stroke-width="3" stroke-miterlimit="10" cx="15" cy="15" r="10.375"/>
        <line fill="none" stroke-width="3" stroke-miterlimit="10" x1="3.25" y1="15" x2="1.063" y2="15"/>
        <line fill="none" stroke-width="3" stroke-miterlimit="10" x1="15" y1="26.75" x2="15" y2="28.938"/>
        <line fill="none" stroke-width="3" stroke-miterlimit="10" x1="26.75" y1="15" x2="28.938" y2="15"/>
        <line fill="none" stroke-width="3" stroke-miterlimit="10" x1="15" y1="3.25" x2="15" y2="1.063"/>
        <circle stroke="none" cx="15" cy="15" r="6.042"/>
      </svg>
    </div>
  </div>
</template>

<script>
export default {
  name: "MarkerItem",
  props: {
    marker: Object,
  },
  data() {
    return {
      appState: this.$bluemap.appState,
      controls: this.$bluemap.mapViewer.controlsManager.data,
      mapId: this.$bluemap.mapViewer.data.map.id
    }
  },
  computed: {
    markerLabel() {
      switch (this.marker.type) {
        case "player" : return this.marker.name;
        default : break;
      }

      if (this.marker.label){
        let strippedLabel = /^(?:<[^>]*>\s*)*([^<>]*\S[^<>]*)(?:<|$)/gi.exec(this.marker.label);
        if (strippedLabel && strippedLabel.length > 1) {
          return strippedLabel[1];
        }
      }

      return this.marker.id;
    },
    position() {
      return (v) => {
        return Math.floor(v);
      }
    }
  },
  methods: {
    async click(follow) {
      let cm = this.$bluemap.mapViewer.controlsManager;
      
      if (cm.controls && cm.controls.stopFollowingPlayerMarker) {
        cm.controls.stopFollowingPlayerMarker();
      }

      if (this.marker.type === "player") {

        if (this.marker.foreign) {
          let matchingMap = await this.$bluemap.findPlayerMap(this.marker.playerUuid);
          if (!matchingMap) return;

          //this.$bluemap.appState.menu.closeAll();
          await this.$bluemap.switchMap(matchingMap.data.id);
        }

        if (follow && cm.controls && cm.controls.followPlayerMarker && this.marker.visible) {
          cm.controls.followPlayerMarker(this.marker);
        }

      } else if (!this.marker.visible) {
        return;
      }

      cm.position.copy(this.marker.position);
    },
    steve(event) {
      event.target.src = "assets/steve.png";
    }
  }
}
</script>

<style lang="scss">
@import "/src/scss/variables.scss";

.side-menu .marker-item {
  position: relative;
  display: flex;
  white-space: nowrap;
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

  &.marker-hidden {
    opacity: 0.5;
    filter: grayscale(1);
  }

  .marker-button {
    position: relative;
    display: flex;
    align-items: center;
    flex-grow: 1;
    min-height: $md-touch-target;
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

    &:active::before {
      opacity: $md-state-pressed;
    }

    > .info {
      flex-grow: 1;
      text-overflow: ellipsis;

      padding: 0.5em 1em;

      .label {
        font-size: var(--md-sys-typescale-body-large-size);
    line-height: var(--md-sys-typescale-body-large-line);
        color: var(--md-sys-color-on-surface);
        text-overflow: ellipsis;
        overflow: hidden;
      }

      .stats {
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

    > .icon {
      height: 2.5em;
      margin: 0.5em 0 0.5em 0.5em;
      flex-shrink: 0;

      img {
        image-rendering: pixelated;
        height: 100%;
        border-radius: $md-shape-full;
      }
    }
  }

  > .follow-player-button {
    position: relative;
    width: $md-touch-target;
    min-height: $md-touch-target;
    cursor: pointer;
    background-color: transparent;

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

    &.active {
      background-color: var(--md-sys-color-secondary-container);

      > svg {
        fill: var(--md-sys-color-on-secondary-container);
        stroke: var(--md-sys-color-on-secondary-container);
      }
    }

    > svg {
      position: relative;
      fill: var(--md-sys-color-on-surface-variant);
      stroke: var(--md-sys-color-on-surface-variant);

      top: 50%;
      transform: translate(0, -50%) scale(0.75);
    }

    &:active {
      &::before {
        opacity: $md-state-pressed;
      }
    }
  }
}
</style>