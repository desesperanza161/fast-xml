<template>
  <div
    class="canvas-editor"
    :class="{ dark: editorTheme === 'dark' }"
  >
    <div class="header">
      <h1>Быстрые отчеты</h1>
      <p>Наш отчет — ваше время</p>
    </div>

    <div class="editor-layout">
      <!-- Левая панель: свойства выбранного объекта -->
      <div class="left-panel">
        <div v-if="selectedObject" class="properties-panel">
          <h3>Свойства</h3>
          <div v-if="selectedObject.type === 'textbox'">
            <label>Текст:</label>
            <textarea v-model="editableText" @input="updateText"></textarea>

            <label>Шрифт:</label>
            <select v-model="selectedFont" @change="updateFont">
              <option>Arial</option>
              <option>Times New Roman</option>
              <option>Courier New</option>
              <option>Verdana</option>
            </select>

            <label>Размер (px):</label>
            <input type="number" v-model="selectedFontSize" @change="updateFontSize" />

            <label>Цвет:</label>
            <div class="text-style-buttons">
              <button @click="toggleBold">Жирный</button>
              <button @click="toggleItalic">Курсив</button>
              <button @click="toggleUnderline">Подчеркнуть</button>
              <input type="color" v-model="selectedColor" @change="updateColor" />

              <label>Выравнивание:</label>
              <select v-model="selectedTextAlign" @change="updateTextAlign">
                <option value="left">По левому краю</option>
                <option value="center">По центру</option>
                <option value="right">По правому краю</option>
              </select>
            </div>
          </div>

          <div v-if="selectedObject.type === 'image'">
            <label>Прозрачность:</label>
            <input type="range" min="0" max="1" step="0.01" v-model="selectedOpacity" @input="updateOpacity" />
          </div>
        </div>
      </div>

      <!-- Центральная область: холст -->
      <div class="canvas-container">
        <canvas id="fabric-canvas"></canvas>
      </div>

      <!-- Правая панель: инструменты и настройки -->
      <div class="side-panel">
        <CanvasButtons
          @add-text="addTextBlock"
          @load-image="triggerFileInput"
          @delete-object="deleteSelectedObject"
        />

        <div class="theme-switch">
          <label>Тема</label>
          <select v-model="editorTheme">
            <option value="light">Светлая</option>
            <option value="dark">Тёмная</option>
          </select>
        </div>

        <!-- Блок шаблонов -->
        <div class="templates-section">
          <label>Шаблоны</label>
          <select v-model="selectedTemplateId" @change="loadTemplateById(selectedTemplateId)">
            <option value="">-- Выберите шаблон --</option>
            <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">
              {{ tpl.name }}
            </option>
          </select>
          <div class="template-buttons">
            <button @click="saveCurrentAsTemplate">Сохранить как шаблон</button>
            <button v-if="userTemplateId" @click="loadUserTemplate" class="user-template-btn">
              Мой шаблон
            </button>
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

        <ExportControl @export="handleExport" @import="triggerXmlInput" />

        <button @click="newProject">Новый проект</button>

        <div class="background-settings">
          <label>Цвет фона:</label>
          <input type="color" v-model="backgroundColor" @input="updateBackgroundColor" />
        </div>
      </div>
    </div>

    <TextDialog
      :show="showTextWindow"
      v-model:text="newTextValue"
      @confirm="confirmAddText"
      @close="showTextWindow = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as fabric from 'fabric'
import CanvasButtons from './module/CanvasButtons.vue'
import ExportControl from './module/ExportControl.vue'
import TextDialog from './module/TextDialog.vue'
import {
  exportToPNG,
  exportToJPEG,
  exportToSVG,
  exportToPDF,
  exportToXML
} from './module/export'

const canvas = ref<fabric.Canvas | null>(null)
const selectedSize = ref('800x600')
const customWidth = ref(800)
const customHeight = ref(600)
const selectedTemplate = ref('')
const showTextWindow = ref(false)
const newTextValue = ref('Новый текст')
const backgroundColor = ref('#ffffff')
const selectedObject = ref<any>(null)
const editableText = ref('')
const selectedFont = ref('Arial')
const selectedFontSize = ref(24)
const selectedColor = ref('#000000')
const selectedTextAlign = ref('left')
const selectedOpacity = ref(1)
const editorTheme = ref('light')
const isBold = ref(false)
const isItalic = ref(false)
const isUnderline = ref(false)

// Переменные для работы с шаблонами
const templates = ref<Array<{ id: string; name: string; data: any }>>([])
const selectedTemplateId = ref('')
const userTemplateId = ref<string | null>(null)

// --- Основные функции ---
function handleExport(format: string) {
  switch (format) {
    case 'png': exportToPNG(canvas.value); break
    case 'jpeg': exportToJPEG(canvas.value); break
    case 'svg': exportToSVG(canvas.value); break
    case 'pdf': exportToPDF(canvas.value); break
    case 'xml': exportToXML(canvas.value, { editorTheme: editorTheme.value }); break
  }
}

function loadObjectProperties() {
  if (!selectedObject.value) return
  if (selectedObject.value.type === 'textbox') {
    editableText.value = selectedObject.value.text || ''
    selectedFont.value = selectedObject.value.fontFamily || 'Arial'
    selectedFontSize.value = selectedObject.value.fontSize || 24
    selectedColor.value = selectedObject.value.fill || '#000000'
    selectedTextAlign.value = selectedObject.value.textAlign || 'left'
    isBold.value = selectedObject.value.fontWeight === 'bold'
    isItalic.value = selectedObject.value.fontStyle === 'italic'
    isUnderline.value = !!selectedObject.value.underline
  } else if (selectedObject.value.type === 'image') {
    selectedOpacity.value = selectedObject.value.opacity || 1
  }
}

function updateBackgroundColor(event?: Event) {
  if (!canvas.value) return
  canvas.value.set('backgroundColor', backgroundColor.value)
  canvas.value.renderAll()
}

function updateText(event?: Event) {
  if (selectedObject.value?.type === 'textbox') {
    selectedObject.value.set('text', editableText.value)
    canvas.value?.renderAll()
  }
}

function updateFont(event?: Event) {
  if (selectedObject.value?.type === 'textbox') {
    selectedObject.value.set('fontFamily', selectedFont.value)
    canvas.value?.renderAll()
  }
}

function updateFontSize(event?: Event) {
  if (selectedObject.value?.type === 'textbox') {
    selectedObject.value.set('fontSize', selectedFontSize.value)
    canvas.value?.renderAll()
  }
}

function updateColor(event?: Event) {
  if (selectedObject.value?.type === 'textbox') {
    selectedObject.value.set('fill', selectedColor.value)
    canvas.value?.renderAll()
  }
}

function updateTextAlign(event?: Event) {
  if (selectedObject.value?.type === 'textbox') {
    selectedObject.value.set('textAlign', selectedTextAlign.value)
    canvas.value?.renderAll()
  }
}

function toggleBold(event?: Event) {
  if (selectedObject.value?.type !== 'textbox') return
  isBold.value = !isBold.value
  selectedObject.value.set('fontWeight', isBold.value ? 'bold' : 'normal')
  canvas.value?.renderAll()
}

function toggleItalic(event?: Event) {
  if (selectedObject.value?.type !== 'textbox') return
  isItalic.value = !isItalic.value
  selectedObject.value.set('fontStyle', isItalic.value ? 'italic' : 'normal')
  canvas.value?.renderAll()
}

function toggleUnderline(event?: Event) {
  if (selectedObject.value?.type !== 'textbox') return
  isUnderline.value = !isUnderline.value
  selectedObject.value.set('underline', isUnderline.value)
  canvas.value?.renderAll()
}

function updateOpacity(event?: Event) {
  if (selectedObject.value?.type === 'image') {
    selectedObject.value.set('opacity', selectedOpacity.value)
    canvas.value?.renderAll()
  }
}

function changePageSize(event?: Event) {
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

function applyCustomSize(event?: Event) {
  if (selectedSize.value === 'custom') changePageSize()
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Delete') {
    deleteSelectedObject()
    event.preventDefault()
  }
}

function addTextBlock() {
  if (!canvas.value) return
  const canvasWidth = canvas.value.getWidth()
  const canvasHeight = canvas.value.getHeight()
  const textbox = new fabric.Textbox('Введите текст', {
    left: 0, top: 0, width: 300, fontSize: 24, editable: true
  })
  canvas.value.add(textbox)
  const objWidth = textbox.width || 300
  const objHeight = textbox.height || 24
  textbox.set({
    left: (canvasWidth - objWidth) / 2,
    top: (canvasHeight - objHeight) / 2
  })
  canvas.value.setActiveObject(textbox)
  canvas.value.renderAll()
  textbox.enterEditing()
  textbox.selectAll()
}

function confirmAddText() {
  if (!canvas.value) return
  const canvasWidth = canvas.value.getWidth()
  const canvasHeight = canvas.value.getHeight()
  const finalText = newTextValue.value.trim() || 'Новый текст'
  const text = new fabric.Textbox(finalText, {
    left: 0, top: 0, fontSize: 24, fontFamily: 'Arial', fill: '#000000',
    hasControls: true, hasBorders: true, cornerSize: 8,
    transparentCorners: false, cornerColor: '#3498db', borderColor: '#3498db',
    lockScalingX: false, lockScalingY: false
  })
  ;(text as any).setControlsVisibility({
    tl: true, tr: true, bl: true, br: true,
    ml: true, mr: true, mt: true, mb: true
  })
  canvas.value.add(text)
  const objWidth = text.width || 300
  const objHeight = text.height || 24
  text.set({
    left: (canvasWidth - objWidth) / 2,
    top: (canvasHeight - objHeight) / 2
  })
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
        if (!cdata) return
        const project = JSON.parse(cdata)
        canvas.value?.loadFromJSON(project.canvas, () => {
          if (project.page) {
            canvas.value?.setDimensions({ width: project.page.width, height: project.page.height })
            canvas.value?.set('backgroundColor', project.page.backgroundColor)
            backgroundColor.value = project.page.backgroundColor
            selectedSize.value = 'custom'
            customWidth.value = project.page.width
            customHeight.value = project.page.height
          }
          if (project.ui) {
            editorTheme.value = project.ui.editorTheme || 'light'
          }
          canvas.value?.renderAll()
        })
      } catch (err) {
        console.error('Ошибка загрузки XML', err)
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

function newProject() {
  if (!canvas.value) return
  canvas.value.clear()
  canvas.value.set('backgroundColor', '#ffffff')
  selectedSize.value = '800x600'
  changePageSize()
  canvas.value.renderAll()
  backgroundColor.value = '#ffffff'
  editorTheme.value = 'light'
}

// --- Функции для работы с шаблонами ---
function loadTemplatesFromStorage() {
  const stored = localStorage.getItem('editor_templates')
  if (stored) {
    try {
      templates.value = JSON.parse(stored)
      const userTpl = templates.value.find(t => t.id === 'user_template')
      if (userTpl) userTemplateId.value = userTpl.id
    } catch(e) { console.error(e) }
  }
  if (templates.value.length === 0) {
    templates.value = [
      { id: 'demo1', name: 'Демо 1 (заголовок)', data: null },
      { id: 'demo2', name: 'Демо 2 (изображение)', data: null }
    ]
    saveTemplatesToStorage()
  }
}

function saveTemplatesToStorage() {
  localStorage.setItem('editor_templates', JSON.stringify(templates.value))
}

function saveCurrentAsTemplate() {
  if (!canvas.value) return
  const name = prompt('Введите название шаблона:', 'Мой шаблон')
  if (!name) return
  const canvasJSON = canvas.value.toJSON
  const templateData = {
    canvas: canvasJSON,
    page: {
      width: canvas.value.getWidth(),
      height: canvas.value.getHeight(),
      backgroundColor: backgroundColor.value
    },
    ui: { editorTheme: editorTheme.value }
  }
  const id = 'user_template'
  const existingIndex = templates.value.findIndex(t => t.id === id)
  const newTemplate = { id, name, data: templateData }
  if (existingIndex !== -1) {
    templates.value[existingIndex] = newTemplate
  } else {
    templates.value.push(newTemplate)
  }
  userTemplateId.value = id
  selectedTemplateId.value = id
  saveTemplatesToStorage()
  alert('Шаблон сохранён!')
}

function loadTemplateById(templateId: string) {
  if (!canvas.value || !templateId) return
  const template = templates.value.find(t => t.id === templateId)
  if (!template || !template.data) {
    if (templateId === 'demo1') createDemoTemplate1()
    else if (templateId === 'demo2') createDemoTemplate2()
    else alert('Шаблон не содержит данных')
    return
  }
  const data = template.data
  canvas.value.loadFromJSON(data.canvas, () => {
    if (data.page) {
      canvas.value?.setDimensions({ width: data.page.width, height: data.page.height })
      canvas.value?.set('backgroundColor', data.page.backgroundColor)
      backgroundColor.value = data.page.backgroundColor
      selectedSize.value = 'custom'
      customWidth.value = data.page.width
      customHeight.value = data.page.height
    }
    if (data.ui) editorTheme.value = data.ui.editorTheme || 'light'
    canvas.value?.renderAll()
  })
}

function loadUserTemplate() {
  if (userTemplateId.value) loadTemplateById(userTemplateId.value)
  else alert('Нет сохранённого шаблона. Сначала сохраните текущий проект как шаблон.')
}

function createDemoTemplate1() {
  if (!canvas.value) return
  canvas.value.clear()
  canvas.value.set('backgroundColor', '#ffffff')
  canvas.value.renderAll()
  const text = new fabric.Textbox('Демо-заголовок\nНажмите для редактирования', {
    left: 100, top: 100, width: 400, fontSize: 32, fill: '#2c3e50'
  })
  canvas.value.add(text)
  canvas.value.renderAll()
  backgroundColor.value = '#ffffff'
  selectedSize.value = '800x600'
  changePageSize()
  editorTheme.value = 'light'
}

function createDemoTemplate2() {
  if (!canvas.value) return
  canvas.value.clear()
  canvas.value.set('backgroundColor', '#f0f0f0')
  canvas.value.renderAll()
  const rect = new fabric.Rect({ left: 150, top: 150, width: 200, height: 150, fill: '#bdc3c7', stroke: '#2c3e50', strokeWidth: 2 })
  const text = new fabric.Textbox('Область для изображения', { left: 160, top: 200, fontSize: 14, fill: '#2c3e50', width: 180, textAlign: 'center' })
  canvas.value.add(rect)
  canvas.value.add(text)
  canvas.value.renderAll()
  backgroundColor.value = '#f0f0f0'
  selectedSize.value = 'a4-portret'
  changePageSize()
  editorTheme.value = 'light'
}

onMounted(() => {
  const fabricCanvas = new fabric.Canvas('fabric-canvas', {
    width: 800, height: 600, backgroundColor: 'white'
  })
  canvas.value = fabricCanvas
  changePageSize()
  loadTemplatesFromStorage()

  fabricCanvas.on('selection:created', (e) => {
    selectedObject.value = e.selected[0]
    loadObjectProperties()
  })
  fabricCanvas.on('selection:updated', (e) => {
    selectedObject.value = e.selected[0]
    loadObjectProperties()
  })
  fabricCanvas.on('selection:cleared', () => {
    selectedObject.value = null
  })

  window.addEventListener('keydown', handleKeyDown)
})
</script>
<style scoped>
* {
  box-sizing: border-box;
}

.canvas-editor {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100vh;
  padding: 20px;
  background: #f5f5f5;
  color: #000;
  transition: background 0.3s ease, color 0.3s ease;
}

/* Шапка */
.header {
  text-align: center;
  margin-bottom: 10px;
}

.header h1 {
  margin: 0;
  font-size: 28px;
  color: inherit;
}

.header p {
  margin: 5px 0 0;
  color: inherit;
  opacity: 0.8;
}

/* Основной layout: левая панель — холст — правая панель */
.editor-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

/* Левая панель (свойства выбранного объекта) */
.left-panel {
  width: 280px;
  flex-shrink: 0;
  padding: 15px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: background 0.3s ease, border-color 0.3s ease;
}

/* Центральная область с холстом */
.canvas-container {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #e0e0e0;
  border-radius: 12px;
  padding: 10px;
}

#fabric-canvas {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-radius: 4px;
  background: white;
}

/* Правая панель (инструменты и настройки) */
.side-panel {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 15px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: background 0.3s ease, border-color 0.3s ease;
}

/* Общие стили для элементов форм */
.side-panel label,
.left-panel label {
  font-weight: 500;
  margin-top: 10px;
  margin-bottom: 4px;
  display: block;
  font-size: 14px;
}

.side-panel select,
.side-panel input,
.side-panel button,
.left-panel select,
.left-panel input,
.left-panel button,
.left-panel textarea {
  width: 100%;
  padding: 8px 10px;
  margin-top: 4px;
  margin-bottom: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  transition: all 0.2s;
}

.side-panel button,
.left-panel button {
  background: #3498db;
  color: white;
  border: none;
  cursor: pointer;
  font-weight: bold;
}
.templates-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.template-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.template-buttons button {
  flex: 1;
  background: #9b59b6;
}

.template-buttons button.user-template-btn {
  background: #e67e22;
}

.template-buttons button:hover {
  filter: brightness(0.9);
}

.canvas-editor.dark .template-buttons button {
  background: #8e44ad;
}
.canvas-editor.dark .template-buttons button.user-template-btn {
  background: #d35400;
}

.side-panel button:hover,
.left-panel button:hover {
  background: #2980b9;
}

.side-panel textarea,
.left-panel textarea {
  resize: vertical;
  min-height: 80px;
}

/* Специфичные блоки */
.theme-switch select,
.size-style select,
.background-settings input {
  width: 100%;
}

.size-style {
  display: flex;
  flex-direction: column;
}

.background-settings {
  display: flex;
  flex-direction: column;
}

.text-style-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
}

.text-style-buttons button {
  width: auto;
  flex: 1 0 auto;
  background: #ecf0f1;
  color: #2c3e50;
  border: 1px solid #bdc3c7;
}

.text-style-buttons button:hover {
  background: #d5dbdb;
}

.text-style-buttons input[type="color"] {
  width: 50px;
  height: 38px;
  padding: 2px;
}

.text-style-buttons select {
  width: auto;
  flex: 2;
}

/* Панель свойств */
.properties-panel h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  border-bottom: 2px solid #3498db;
  display: inline-block;
  padding-bottom: 4px;
}

/* Кнопка нового проекта */
.side-panel button:last-of-type {
  background: #2ecc71;
}

.side-panel button:last-of-type:hover {
  background: #27ae60;
}

/* Тёмная тема */
.canvas-editor.dark {
  background: #121212;
  color: #eee;
}

.canvas-editor.dark .left-panel,
.canvas-editor.dark .side-panel {
  background: #1e1e1e;
  border-color: #444;
  color: #eee;
}

.canvas-editor.dark select,
.canvas-editor.dark input,
.canvas-editor.dark textarea {
  background: #2c2c2c;
  border-color: #555;
  color: #eee;
}

.canvas-editor.dark button {
  background: #3a6ea5;
  color: white;
}

.canvas-editor.dark button:hover {
  background: #2c5282;
}

.canvas-editor.dark .text-style-buttons button {
  background: #2c3e50;
  color: #ecf0f1;
  border-color: #1a2632;
}

.canvas-editor.dark .text-style-buttons button:hover {
  background: #1e2b38;
}

.canvas-editor.dark .properties-panel h3 {
  border-bottom-color: #3a6ea5;
}

/* Адаптивность для узких экранов */
@media (max-width: 900px) {
  .editor-layout {
    flex-direction: column;
  }
  
  .left-panel,
  .side-panel {
    width: 100%;
  }
  
  .canvas-container {
    width: 100%;
    overflow-x: auto;
  }
}
</style>