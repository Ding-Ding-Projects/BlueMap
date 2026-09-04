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

  /*
   * A Material Design 3 filled text field, adapted for a compact coordinate entry.
   *
   * It was an outlined field before, and outlined is the variant that reads as a plain HTML
   * input when it is small: a thin rectangle with a border is what every unstyled `<input>`
   * on the web looks like, so nothing about it said the interface had been designed. Filled
   * is the variant Material specifies for dense inline entry, and it is the one that reads
   * as deliberate at this size, because the field is a *surface* rather than an outline.
   *
   * Three pieces of the anatomy do the work and all three were missing:
   *
   * The surface itself, a container role rather than a border, so the field sits in the
   * elevation order of the bar around it instead of being drawn on top of it.
   *
   * The activation indicator - a line along the bottom edge that thickens and takes the
   * primary role on focus. Material's filled field is identified by that line, and a focus
   * ring alone is the browser default rather than a design.
   *
   * A hover state layer, at the specified 0.08. Its absence is why the field felt inert:
   * everything else in this bar answers the pointer and this did not.
   *
   * The one deliberate departure from the specification: Material's filled field has square
   * bottom corners, because it normally sits in a form on a flat page. This one sits inside
   * a fully rounded toolbar, where square corners read as a fragment of a different
   * interface, so it takes the small shape on all four. The activation indicator is inset to
   * match, which keeps the line reading as part of the field rather than as an underline
   * that has escaped it.
   */
  .number-input {
    pointer-events: auto;
    position: relative;
    isolation: isolate;
    overflow: hidden;

    display: flex;
    align-items: center;

    box-sizing: border-box;
    height: 100%;
    min-height: 2em;

    background-color: var(--md-sys-color-surface-container-highest);
    color: var(--md-sys-color-on-surface);
    border: none;
    border-radius: $md-shape-s;

    transition: background-color $md-duration-short $md-easing-standard;

    // The state layer. An overlay of the foreground colour rather than a second colour
    // chosen by hand, so it can never drift from the field's own palette.
    &::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: -1;
      background-color: var(--md-sys-color-on-surface);
      opacity: 0;
      transition: opacity $md-duration-short $md-easing-standard;
      pointer-events: none;
    }

    &:hover::before {
      opacity: $md-state-hover;
    }

    // The activation indicator: what identifies a filled field. At rest it is a hairline in
    // the outline role; on focus it thickens and takes primary, which is the whole signal.
    &::after {
      content: "";
      position: absolute;
      left: 4px;
      right: 4px;
      bottom: 0;
      height: 1px;
      background-color: var(--md-sys-color-outline);
      transition: height $md-duration-short $md-easing-standard,
        background-color $md-duration-short $md-easing-standard;
      pointer-events: none;
    }

    &:focus-within::after {
      height: 2px;
      background-color: var(--md-sys-color-primary);
    }

    &:focus-within::before {
      opacity: $md-state-focus;
    }

    @media (prefers-reduced-motion: reduce) {
      &, &::before, &::after {
        transition: none;
      }
    }

    label {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      cursor: text;
    }

    // The designator, in place of a floating label. A compact field inside a toolbar has no
    // room for one, and Material's guidance is that a field must be identified either way -
    // so the "x"/"z" is a permanent leading label in label-medium on the supporting-text
    // role, which is what a floating label settles into anyway.
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
