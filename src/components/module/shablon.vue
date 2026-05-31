<template>
    <div class="shablon">
        <label>Шаблоны:</label>
        <select v-model="selectedTemplate" @change="$emit('load', selectedTemplate)">
            <option value="">Выберите шаблон</option>
            <option v-for="tpl in templates" :key="tpl.id"> {{ tpl.name }}</option>
        </select>
    </div>
</template>

<script setup land="ts">
</script>

<style scoped>
.shablons {
    margin-top: 10px;
}
</style>