<template>
  <select v-model="selected" @change="$emit('load', selected)">
    <option value="">Выберите шаблон</option>
  </select>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const selected = ref('')
defineEmits(['load'])
</script>