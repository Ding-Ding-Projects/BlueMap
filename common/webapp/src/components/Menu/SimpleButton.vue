<template>
  <VListItem class="simple-button" :active="active" rounded="lg" @click="$emit('action')">
    <template v-if="icon" #prepend>
      <svg class="simple-button__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path :d="icon" /></svg>
    </template>
    <slot />
    <div v-if="hint" class="simple-button__hint">{{ hint }}</div>
    <template v-if="submenu" #append><span aria-hidden="true">›</span></template>
  </VListItem>
</template>
<script>
import { VListItem } from 'vuetify/components';
export default { name: 'SimpleButton', components: { VListItem }, emits: ['action'], props: { submenu: Boolean, active: Boolean, icon: { type: String, default: '' }, hint: { type: String, default: '' } } };
</script>
<style scoped>
.simple-button { min-height: 56px; white-space: normal; overflow-wrap: anywhere; border-radius: 28px; }
/* Supporting text under the label, as in a Material 3 two-line list item. */
.simple-button__hint { font-size: var(--md-sys-typescale-body-medium-size, 0.875rem); line-height: 1.4; color: var(--md-sys-color-on-surface-variant); }
/* Contour: a leading icon on every navigation row, in the on-surface-variant role. */
.simple-button__icon { width: 24px; height: 24px; margin-inline-end: 16px; fill: var(--md-sys-color-on-surface-variant); flex: 0 0 24px; }
</style>
