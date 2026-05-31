<template>
  <div v-if="show" class="dialog">
    <input v-model="textValue" />
    <button @click="$emit('confirm', textValue)">OK</button>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
const props = defineProps<{ show: boolean; text: string }>()
const textValue = ref(props.text)
defineEmits(['confirm', 'close'])
</script>