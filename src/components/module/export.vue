<template>
<label> Формат экспорта</label>
<select v-model="selectedFormat">
    <option value="png">PNG</option>
    <option value="pdf">PDF</option>
    <option value="svg">SVG</option>
    <option value="jpeg">JPEG</option>
    <option value="xml">XML</option>
</select>
<button @click="$emit('export', selectedFormat)">Экспорт</button>
<button @click="$emit('import-xml')">Загрузить XML</button>
</template>

<script setup lang="ts">
import {ref} from 'vue'
const selectedFormat=ref('png')
defineEmits<{
    (e: 'export', format: string): void
    (e: 'import-xml'): void
}>()
</script>


<style>
</style>