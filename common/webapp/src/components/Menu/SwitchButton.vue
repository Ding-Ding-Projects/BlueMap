<template>
<div class="switch-button" @click="$emit('action')">
  <div class="label"><slot /></div>
  <SwitchHandle :on="on" />
</div>
</template>

<script>
import SwitchHandle from "./SwitchHandle.vue";
export default {
  name: "SwitchButton",
  components: {SwitchHandle},
  props: {
    on: Boolean
  }
}
</script>

<style lang="scss">
@import "/src/scss/variables.scss";


.side-menu .switch-button {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  line-height: 2em;

  min-height: $md-touch-target;
  padding: 0 0.5em;

  > .label {
    flex-grow: 1;

    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
  }

  > .switch {
    margin: 0.5em 0;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-high);
  }
}

</style>
