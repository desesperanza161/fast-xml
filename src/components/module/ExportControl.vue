<template>
  <label>Формат Экспорт</label>
  <select v-model="format" @change="$emit('export', format)">
    <option value="png">PNG</option>
    <option value="jpeg">JPEG</option>
    <option value="svg">SVG</option>
    <option value="pdf">PDF</option>
    <option value="xml">XML</option>
  </select>
  <button @click="$emit('import')">Загрузить XML</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const format = ref('png')
defineEmits(['export', 'import'])
</script>