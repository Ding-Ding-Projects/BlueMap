<template>
  <VBtn class="svg-button" icon variant="text" :active="active" :aria-label="title || undefined"
    :aria-pressed="toggle ? active : undefined" :title="title || undefined" @click="$emit('action', $event)">
    <slot />
  </VBtn>
</template>
<script>
import { VBtn } from 'vuetify/components';
export default { name: 'SvgButton', components: { VBtn }, emits: ['action'], props: { active: Boolean, toggle: Boolean, title: String } };
</script>
<style lang="scss">
.svg-button { pointer-events: auto; flex-shrink: 0; color: var(--md-sys-color-on-surface-variant); }
.svg-button svg { width: 24px; height: 24px; fill: currentColor; pointer-events: none; }
.svg-button.v-btn--active { background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); }
</style>
