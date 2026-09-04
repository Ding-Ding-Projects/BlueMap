<template>
  <div class="choice-box">
    <div v-if="title" class="title">{{ title }}</div>
    <div class="choices">
      <div class="choice" v-for="choice of choices" :key="choice.id"
           :class="{selected: selection === choice.id}"
           role="button" tabindex="0" :aria-pressed="selection === choice.id"
           @click="$emit('choice', choice)"
           @keydown.enter.prevent="$emit('choice', choice)"
           @keydown.space.prevent="$emit('choice', choice)"
      >
        {{ choice.name }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ChoiceBox",
  props: {
    title: {
      type: String,
      required: false,
      default: ''
    },
    choices: Array,
    selection: String
  }
}
</script>

<style lang="scss">
  @import "../../scss/variables.scss";

  .choice-box {
    display: flex;
    flex-direction: column;

    font-size: var(--md-sys-typescale-label-large-size);
    line-height: var(--md-sys-typescale-label-large-line);
    font-weight: var(--md-sys-typescale-label-large-weight, 500);
    text-align: center;

    background-color: var(--md-sys-color-surface-container-high);
    border-radius: $md-shape-xs;
    box-shadow: var(--md-sys-elevation-2);
    overflow: hidden;

    .title, .choice {
      padding: 0.3em 0.5em;
    }

    .title {
      color: var(--md-sys-color-on-surface-variant);
      background-color: var(--md-sys-color-surface-container-highest);
    }

    .choices {
      display: flex;
      flex-grow: 1;

      .choice {
        position: relative;
        flex-grow: 1;
        min-height: $md-touch-target;
        display: flex;
        align-items: center;
        justify-content: center;

        cursor: pointer;
        user-select: none;

        color: var(--md-sys-color-on-surface);
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

        &:active::before {
          opacity: $md-state-pressed;
        }

        &.selected {
          font-weight: 600;
          color: var(--md-sys-color-on-secondary-container);
          background-color: var(--md-sys-color-secondary-container);

          &::after {
            content: "✓";
            margin-left: 0.35em;
          }
        }
      }
    }
  }
</style>