<template>
  <VSlider class="slider mx-3" :model-value="value" :min="min" :max="max" :step="step" hide-details
    @update:model-value="$emit('update', $event)" @end="$emit('lazy', $event)">
    <template #label><span><slot />: {{ formattedValue }}</span></template>
  </VSlider>
</template>
<script>
import { VSlider } from 'vuetify/components';
export default {
  name: 'Slider', components: { VSlider }, emits: ['update', 'lazy'],
  props: { value: Number, min: Number, max: Number, step: Number, formatter: Function },
  computed: { formattedValue() {
    if (this.formatter) return this.formatter(this.value);
    const decimals = String(this.step ?? 1).split('.')[1]?.length ?? 0;
    return Number(this.value).toFixed(decimals);
  } }
};
</script>
