<template>
  <div id="app">
    <CanvasEditor />
  </div>
</template>

<script setup lang="ts">
import CanvasEditor from './components/CanvasEditor.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #f0f0f0;
  font-family: sans-serif;
}

#app {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
</style>