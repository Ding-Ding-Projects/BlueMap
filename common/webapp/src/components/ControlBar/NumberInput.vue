<template>
  <VTextField class="number-input" :label="label" type="number" :model-value="Math.floor(value)"
    density="compact" variant="filled" hide-details @input="$emit('input', $event)" @keydown.stop />
</template>
<script>
import { VTextField } from 'vuetify/components';
export default { name: 'NumberInput', components: { VTextField }, emits: ['input'], props: { label: String, value: Number } };
</script>
<style scoped>
.number-input { pointer-events: auto; min-width: 64px; flex: 1 1 0; }
</style>
