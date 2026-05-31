<template>
<buttons @click="$emit('add-text')">Добавить текст</buttons>
<buttons @click="$emit('load-image')">Загрузить изображение</buttons>
<buttons @click="$emit('delete-object')" class="delete-bin"> Очистить</buttons>
</template>


<script setup lang="ts">
defineEmits<{
    (e: 'add-text'): void
    (e: 'load-image'): void
    (e: 'delete-object'): void
}>()
</script>


<style scoped>
.delete-bin{
      background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;

}</style>


