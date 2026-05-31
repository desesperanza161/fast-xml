<template>
  <button @click="$emit('add-text')">Добавить текст</button>
  <button @click="$emit('load-image')">Загрузить изображение</button>
  <button @click="$emit('delete-object')" class="delete-bin">Очистить</button>
</template>

<script setup lang="ts">
defineEmits(['add-text', 'load-image', 'delete-object'])
</script>