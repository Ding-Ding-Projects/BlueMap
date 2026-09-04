<template>
  <div class="number-input">
    <label>
      <span class="label">{{label}}</span>
      <input type="number"
             v-bind:value="format(value)"
             v-on:input="$emit('input', $event)"
             v-on:keydown="$event.stopPropagation()"
             :aria-label="label"
      >
    </label>
  </div>
</template>

<script>
export default {
  name: "NumberInput",
  props: {
    label: String,
    value: Number
  },
  computed: {
    format() {
      return (value) => {
        return Math.floor(value);
      }
    }
  }
}
</script>

<style lang="scss">
  @import "/src/scss/variables.scss";

  // M3 outlined text field. There is no floating label here (the field is a
  // compact coordinate entry inside the control bar), so the "x"/"y"/"z"
  // designator is rendered as a small permanent leading label instead, styled
  // in label-medium on the on-surface-variant role, matching M3's supporting
  // text colour.
  .number-input {
    pointer-events: auto;

    display: flex;
    align-items: center;

    box-sizing: border-box;
    height: 100%;
    min-height: 2em;

    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    border: 1px solid var(--md-sys-color-outline);
    border-radius: $md-shape-xs;

    transition: border-color $md-duration-short $md-easing-standard,
      border-width $md-duration-short $md-easing-standard;

    &:focus-within {
      border-width: 2px;
      border-color: var(--md-sys-color-primary);
      padding: 0; // border growth is absorbed by box-sizing, not by padding
    }

    label {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      cursor: text;
    }

    .label {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.25em;
      padding: 0 8px;

      font-size: var(--md-sys-typescale-label-medium-size);
      line-height: var(--md-sys-typescale-label-medium-line);
      font-weight: var(--md-sys-typescale-label-medium-weight);
      letter-spacing: var(--md-sys-typescale-label-medium-tracking);
      color: var(--md-sys-color-on-surface-variant);
      text-transform: uppercase;
    }

    input {
      height: 100%;
      width: calc(100% - 2em);
      padding: 0 16px 0 0;

      background-color: transparent;
      color: inherit;
      border: none;
      outline: none;

      font-size: var(--md-sys-typescale-body-large-size);
      line-height: var(--md-sys-typescale-body-large-line);
      letter-spacing: var(--md-sys-typescale-body-large-tracking);

      // remove number spinner firefox
      -moz-appearance: textfield;

      // remove number spinner webkit
      &::-webkit-inner-spin-button,
      &::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    }
  }
</style>
