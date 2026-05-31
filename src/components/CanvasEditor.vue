<template>
  <div class="canvas-editor">
    <canvas id="fabric-canvas"></canvas>

    <div class="toolbar">
      <CanvasButtons
        @add-text="addTextBlock"
        @load-image="triggerFileInput"
        @delete-object="deleteSelectedObject"
      />
     <ExportControl @export="handleExport" @import="triggerXmlInput" />
      <div class="project">
        <button @click="newProject">Новый проект</button>
      </div>
    </div>

    <div class="size-style">
      <label>Размер страницы:</label>
      <select v-model="selectedSize" @change="changePageSize">
        <option value="800x600">По умолчанию</option>
        <option value="a4-portret">A4 (Портрет)</option>
        <option value="a4-albom">A4 (Альбом)</option>
        <option value="a5">A5</option>
        <option value="Letter">Письмо</option>
        <option value="custom">Свои размеры</option>
      </select>
      <div v-if="selectedSize === 'custom'">
        <input type="number" v-model="customWidth" placeholder="Ширина" />
        <input type="number" v-model="customHeight" placeholder="Высота" />
        <button @click="applyCustomSize">Применить</button>
      </div>
    </div>

    <TextDialog
      :show="showTextWindow"
      v-model:text="newTextValue"
      @confirm="confirmAddText"
      @close="showTextWindow = false"
    />

    <TemplateSelector @load="loadTemplate" v-model="selectedTemplate" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as fabric from 'fabric'
import jsPDF from 'jspdf'
import { useEditor, EditorContent } from '@tiptap/vue-3'

import CanvasButtons from './module/CanvasButtons.vue'
import ExportControl from './module/ExportControl.vue'
import TextDialog from './module/TextDialog.vue'
import TemplateSelector from './module/selector.vue'
import { exportToPNG, exportToJPEG, exportToSVG, exportToPDF, exportToXML } from './module/export'
const canvas = ref<fabric.Canvas | null>(null)
const selectedSize = ref('800x600')
const customWidth = ref(800)
const customHeight = ref(600)
const selectedTemplate = ref('')
const showTextWindow = ref(false)
const newTextValue = ref('Новый текст')

function addTextBlock() {
  newTextValue.value = 'Новый текст'
  showTextWindow.value = true
}

function confirmAddText() {
  if (!canvas.value) return
  const finalText = newTextValue.value.trim() || 'Новый текст'
  const text = new fabric.Textbox(finalText, {
    left: 50, top: 50, fontSize: 24, fontFamily: 'Arial', fill: '#000000',
    hasControls: true, hasBorders: true, cornerSize: 8,
    transparentCorners: false, cornerColor: '#3498db', borderColor: '#3498db'
  })
  canvas.value.add(text)
  canvas.value.renderAll()
  canvas.value.setActiveObject(text)
  showTextWindow.value = false
}

function triggerFileInput() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file || !canvas.value) return
    const reader = new FileReader()
    reader.onload = (f) => {
      const imgElement = new Image()
      imgElement.src = f.target?.result as string
      imgElement.onload = () => {
        const img = new fabric.Image(imgElement, { left: 100, top: 100, scaleX: 0.5, scaleY: 0.5 })
        canvas.value?.add(img)
        canvas.value?.renderAll()
      }
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

function deleteSelectedObject() {
  if (!canvas.value) return
  const obj = canvas.value.getActiveObject()
  if (obj) {
    canvas.value.remove(obj)
    canvas.value.discardActiveObject()
    canvas.value.renderAll()
  }
}

function handleExport(format: string) {
  switch (format) {
    case 'png': exportToPNG(canvas.value); break
    case 'jpeg': exportToJPEG(canvas.value); break
    case 'svg': exportToSVG(canvas.value); break
    case 'pdf': exportToPDF(canvas.value); break
    case 'xml': exportToXML(canvas.value); break
    default: console.warn('Неизвестный формат', format)
  }
}

function triggerXmlInput() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xml'
  input.onchange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file || !canvas.value) return
    const reader = new FileReader()
    reader.onload = (f) => {
      try {
        const xmlString = f.target?.result as string
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml')
        const cdata = xmlDoc.querySelector('data')?.textContent
        if (cdata) {
          const json = JSON.parse(cdata)
          canvas.value?.loadFromJSON(json, () => canvas.value?.renderAll())
        }
      } catch (err) {
        console.error('Ошибка загрузки XML', err)
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

function changePageSize() {
  if (!canvas.value) return
  let width = 800, height = 600
  switch (selectedSize.value) {
    case 'a4-portret': width = 595; height = 842; break
    case 'a4-albom': width = 842; height = 595; break
    case 'a5': width = 420; height = 595; break
    case 'Letter': width = 612; height = 792; break
    case 'custom': width = customWidth.value; height = customHeight.value; break
    default: width = 800; height = 600
  }
  canvas.value.setDimensions({ width, height })
  canvas.value.renderAll()
}

function applyCustomSize() {
  if (selectedSize.value === 'custom') changePageSize()
}

function newProject() {
  if (!canvas.value) return
  canvas.value.clear()
  canvas.value.backgroundColor = 'white'
  selectedSize.value = '800x600'
  changePageSize()
  canvas.value.renderAll()
}

function loadTemplate(templateId: string) {
  console.log('Загружаем шаблон:', templateId)
}

onMounted(() => {
  const fabricCanvas = new fabric.Canvas('fabric-canvas', {
    width: 800, height: 600, backgroundColor: 'white'
  })
  canvas.value = fabricCanvas
  changePageSize()
})
</script>

<style scoped>
.canvas-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.toolbar {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.group1, .export, .group3 {
  display: flex;
  gap: 16px;
}
.size-style, .templates {
  margin-top: 10px;
}
</style>