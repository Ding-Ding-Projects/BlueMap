<template>
  <VTextField class="text-input ma-2" type="text" :model-value="value" density="comfortable" hide-details
    @input="$emit('input', $event)" @keydown.stop />
</template>
<script>
import { VTextField } from 'vuetify/components';
export default { name: 'TextInput', components: { VTextField }, emits: ['input'], props: { value: String } };
</script>
