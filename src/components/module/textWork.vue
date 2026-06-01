<template>
  <div class="textWork">

    <div class="toolbar">
      <button @click="addTextBlock">
        Добавить текст
      </button>
    </div>

    <div
      ref="canvas"
      class="canvas"
    >

      <div
        v-for="block in textBlocks"
        :key="block.id"
        class="text-block"
        :class="{ active: activeId === block.id }"
        :style="{
          left: block.x + 'px',
          top: block.y + 'px',
          width: block.width + 'px',
          height: block.height + 'px'
        }"
        @mousedown="startDrag($event, block)"
        @click.stop="selectBlock(block.id)"
      >

        <div
          class="content"
          contenteditable="true"
          @input="updateText($event, block)"
        >
          {{ block.text }}
    </div>

        <div
          class="resize top-left"
          @mousedown.stop="startResize($event, block, 'top-left')"
        />
        <div
          class="resize top-right"
          @mousedown.stop="startResize($event, block, 'top-right')"
        />

        
        <div
          class="resize bottom-left"
          @mousedown.stop="startResize($event, block, 'bottom-left')"
        />

        
        <div
          class="resize bottom-right"
          @mousedown.stop="startResize($event, block, 'bottom-right')"
        />

      </div>

    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'

const textBlocks = ref([])
const activeId = ref(null)

let currentDrag = null
let currentResize = null

function addTextBlock() {
  textBlocks.value.push({
    id: Date.now(),
    text: 'Введите текст',
    x: 100,
    y: 100,
    width: 250,
    height: 120
  })
}

function selectBlock(id) {
  activeId.value = id
}

function updateText(event, block) {
  block.text = event.target.innerText
}

function startDrag(event, block) {
  if (
    event.target.classList.contains('resize')
  ) {
    return
  }

  currentDrag = {
    block,
    startX: event.clientX,
    startY: event.clientY,
    left: block.x,
    top: block.y
  }

  window.addEventListener('mousemove', drag)
  window.addEventListener('mouseup', stopDrag)
}

function drag(event) {
  if (!currentDrag) return

  const dx =
    event.clientX - currentDrag.startX

  const dy =
    event.clientY - currentDrag.startY

  currentDrag.block.x =
    currentDrag.left + dx

  currentDrag.block.y =
    currentDrag.top + dy
}

function stopDrag() {
  currentDrag = null

  window.removeEventListener('mousemove', drag)
  window.removeEventListener('mouseup', stopDrag)
}

function startResize(event, block, direction) {

  currentResize = {
    block,
    direction,
    startX: event.clientX,
    startY: event.clientY,
    width: block.width,
    height: block.height,
    x: block.x,
    y: block.y
  }

  window.addEventListener(
    'mousemove',
    resize
  )

  window.addEventListener(
    'mouseup',
    stopResize
  )
}

function resize(event) {

  if (!currentResize) return

  const dx =
    event.clientX - currentResize.startX

  const dy =
    event.clientY - currentResize.startY

  const block = currentResize.block

  switch (currentResize.direction) {

    case 'bottom-right':
      block.width =
        Math.max(100,
          currentResize.width + dx)

      block.height =
        Math.max(50,
          currentResize.height + dy)
      break

    case 'bottom-left':
      block.width =
        Math.max(100,
          currentResize.width - dx)

      block.height =
        Math.max(50,
          currentResize.height + dy)

      block.x =
        currentResize.x + dx
      break

    case 'top-right':
      block.width =
        Math.max(100,
          currentResize.width + dx)

      block.height =
        Math.max(50,
          currentResize.height - dy)

      block.y =
        currentResize.y + dy
      break

    case 'top-left':
      block.width =
        Math.max(100,
          currentResize.width - dx)

      block.height =
        Math.max(50,currentResize.height - dy)

      block.x =
        currentResize.x + dx

      block.y =
        currentResize.y + dy
      break
  }
}

function stopResize() {

  currentResize = null

  window.removeEventListener(
    'mousemove',
    resize
  )

  window.removeEventListener(
    'mouseup',
    stopResize
  )
}
</script>

<style scoped>
.editor-wrapper {
  width: 100%;
}

.toolbar {
  margin-bottom: 15px;
}

.toolbar button {
  padding: 10px 18px;
  cursor: pointer;
}

.canvas {
  position: relative;
  width: 100%;
  height: 800px;
  border: 2px solid #ddd;
  background: white;
  overflow: hidden;
}

.text-block {
  position: absolute;
  border: 1px dashed transparent;
  background: rgba(255,255,255,0.9);
  min-width: 100px;
  min-height: 50px;
}

.text-block.active {
  border-color: #1976d2;
}

.content {
  width: 100%;
  height: 100%;
  outline: none;
  padding: 8px;
  box-sizing: border-box;
  cursor: text;
}

.resize {
  width: 12px;
  height: 12px;
  background: #1976d2;
  position: absolute;
}

.top-left {
  top: -6px;
  left: -6px;
  cursor: nwse-resize;
}

.top-right {
  top: -6px;
  right: -6px;
  cursor: nesw-resize;
}

.bottom-left {
  bottom: -6px;
  left: -6px;
  cursor: nesw-resize;
}

.bottom-right {
  bottom: -6px;
  right: -6px;
  cursor: nwse-resize;
}

</style>