<template>
  <input class="text-input" type="text" :value="value" @input="$emit('input', $event)" @keydown="$event.stopPropagation()">
</template>

<script>
export default {
  name: "TextInput",
  props: {
    value: String
  }
}
</script>

<style lang="scss">
@import "/src/scss/variables.scss";

// M3 outlined text field: 56px height, 1px outline, $md-shape-xs corner,
// body-large text. This component has no label slot in its markup, so only
// the field anatomy itself (not the floating-label anatomy) applies here.
.side-menu .text-input {
  box-sizing: border-box;

  width: calc(100% - 1em);
  height: 56px;
  margin: 0.5em;
  padding: 0 16px;

  background-color: transparent;
  color: var(--md-sys-color-on-surface);

  border: solid 1px var(--md-sys-color-outline);
  border-radius: $md-shape-xs;

  font-size: var(--md-sys-typescale-body-large-size);
  line-height: var(--md-sys-typescale-body-large-line);
  letter-spacing: var(--md-sys-typescale-body-large-tracking);

  transition: border-color $md-duration-short $md-easing-standard,
              border-width $md-duration-short $md-easing-standard;

  &::placeholder {
    color: var(--md-sys-color-on-surface-variant);
  }

  &:hover {
    border-color: var(--md-sys-color-on-surface);
  }

  &:focus-visible,
  &:focus {
    outline: none;
    border-width: 2px;
    border-color: var(--md-sys-color-primary);
    padding: 0 15px; // compensate the extra 1px border so text doesn't shift
  }

  &.error,
  &[aria-invalid="true"] {
    border-color: var(--md-sys-color-error);

    &:focus-visible,
    &:focus {
      border-color: var(--md-sys-color-error);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}
</style>
