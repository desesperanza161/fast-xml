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
<button @click="$emit('import')">Загрузить XML</button>
</template>

<script setup lang="ts">
import {ref} from 'vue'
const selectedFormat=ref('png')
const handleExportChange =() =>{
    if (selectedFormat.value){
        $emit('export', selectedFormat.value)
    }
}


const $emit= defineEmits(['export', 'import'])
</script>


<style>
</style>