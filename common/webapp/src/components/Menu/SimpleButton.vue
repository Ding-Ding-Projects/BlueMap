<template>
  <VListItem class="simple-button" :active="active" rounded="lg" @click="$emit('action')">
    <slot />
    <template v-if="submenu" #append><span aria-hidden="true">›</span></template>
  </VListItem>
</template>
<script>
import { VListItem } from 'vuetify/components';
export default { name: 'SimpleButton', components: { VListItem }, emits: ['action'], props: { submenu: Boolean, active: Boolean } };
</script>
<style scoped>
.simple-button { min-height: 48px; white-space: normal; overflow-wrap: anywhere; }
</style>
