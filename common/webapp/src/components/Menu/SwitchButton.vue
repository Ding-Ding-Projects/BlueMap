<template>
  <VSwitch class="switch-button mx-3" :model-value="on" color="primary" hide-details inset @update:model-value="$emit('action')">
    <template #label><slot /></template>
  </VSwitch>
</template>
<script>
import { VSwitch } from 'vuetify/components';
export default { name: 'SwitchButton', components: { VSwitch }, emits: ['action'], props: { on: Boolean } };
</script>
