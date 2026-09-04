<template>
<div class="slider">
  <div class="label"><slot />: <span class="value">{{formatter(value)}}</span></div>
  <label>
    <input type="range" :min="min" :max="max" :step="step" :value="value" @input="$emit('update', parseFloat($event.target.value))" @change="$emit('lazy', parseFloat($event.target.value))">
  </label>
</div>
</template>

<script>

function countDecimals(value) {
  if(Math.floor(value) === value) return 0;
  return value.toString().split(".")[1].length || 0;
}

export default {
  name: "Slider",
  props: {
    value: Number,
    min: Number,
    max: Number,
    step: Number,
    formatter: {
      type: Function,
      default: function(value) {
        return parseFloat(value).toFixed(countDecimals(this.step));
      }
    }
  }
}
</script>

<style lang="scss">
@import "/src/scss/variables.scss";

// M3 slider: 4px inactive/active track ($md-shape-full), 20x20 round handle in
// primary with a 40px state-layer halo. The active-track fill (the portion left
// of the handle) is approximated with a background gradient, since a plain
// range input has no DOM hook to size a separate "active" track element.
.side-menu .slider {
  line-height: 2em;
  padding: 0 0.5em;
  min-height: $md-touch-target;
  display: flex;
  flex-direction: column;
  justify-content: center;

  &:hover {
    background-color: var(--md-sys-color-surface-container-high);
  }

  > .label {
    > .value {
      float: right;
    }
  }

  > label {
    display: block;

    > input {
      appearance: none;
      -moz-appearance: none;
      -webkit-appearance: none;
      outline: none;

      width: 100%;
      height: 4px;
      margin: 22px 0;

      border-radius: $md-shape-full;
      overflow: visible;
      background-color: var(--md-sys-color-surface-container-highest);

      transition: background-color $md-duration-short $md-easing-standard;

      &::-webkit-slider-thumb {
        appearance: none;
        -moz-appearance: none;
        -webkit-appearance: none;
        outline: none;

        width: 20px;
        height: 20px;
        margin-top: 0;

        border-radius: 50%;
        border: none;

        background-color: var(--md-sys-color-primary);
        box-shadow: 0 0 0 0 transparent;

        cursor: pointer;

        transition: box-shadow $md-duration-short $md-easing-standard;
      }

      &::-moz-range-thumb {
        width: 20px;
        height: 20px;

        border-radius: 50%;
        border: none;

        background-color: var(--md-sys-color-primary);
        box-shadow: 0 0 0 0 transparent;

        cursor: pointer;

        transition: box-shadow $md-duration-short $md-easing-standard;
      }

      &::-moz-range-progress {
        background-color: var(--md-sys-color-primary);
        border-radius: $md-shape-full;
        height: 4px;
      }

      &::-moz-range-track {
        background-color: var(--md-sys-color-surface-container-highest);
        border-radius: $md-shape-full;
        height: 4px;
      }

      &:hover,
      &:focus-visible {
        &::-webkit-slider-thumb {
          box-shadow: 0 0 0 10px color-mix(in srgb, var(--md-sys-color-primary) #{$md-state-hover * 100%}, transparent);
        }
        &::-moz-range-thumb {
          box-shadow: 0 0 0 10px color-mix(in srgb, var(--md-sys-color-primary) #{$md-state-hover * 100%}, transparent);
        }
      }

      &:active {
        &::-webkit-slider-thumb {
          box-shadow: 0 0 0 10px color-mix(in srgb, var(--md-sys-color-primary) #{$md-state-pressed * 100%}, transparent);
        }
        &::-moz-range-thumb {
          box-shadow: 0 0 0 10px color-mix(in srgb, var(--md-sys-color-primary) #{$md-state-pressed * 100%}, transparent);
        }
      }

      &:focus-visible {
        outline: 3px solid var(--md-sys-color-primary);
        outline-offset: 2px;
      }

      @media (prefers-reduced-motion: reduce) {
        transition: none;

        &::-webkit-slider-thumb,
        &::-moz-range-thumb {
          transition: none;
        }
      }
    }
  }
}
</style>
