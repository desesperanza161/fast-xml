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
      <div class="canvas-container">
        <canvas id="fabric-canvas"></canvas>
      </div>
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




<div v-if="selectedObject" class="properties-panel">
  <h3>Свойства</h3>
  <div v-if="selectedObject.type === 'textbox'">
    <label>Текст:</label>
    <textarea v-model="editableText" @input="updateText"></textarea>
    <label>Шрифт:</label>
    <select v-model="selectedFont" @change="updateFont">
      <option>Arial</option><option>Times New Roman</option>
      <option>Courier New</option><option>Verdana</option>
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


    <input type="color" v-model="selectedColor" @change="updateColor" />
    <label>Выравнивание:</label>
    <select v-model="selectedTextAlign" @change="updateTextAlign">
      <option value="left">По левому краю</option>
      <option value="center">По центру</option>
      <option value="right">По правому краю</option>
    </select>
  </div>
  <div v-if="selectedObject.type === 'image'">
    <label>Прозрачность:</label>
    <input type="range" min="0" max="1" step="0.01" v-model="selectedOpacity" @input="updateOpacity" />
  </div>
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
    
  <ExportControl
    @export="handleExport"
    @import="triggerXmlInput"
  />

  <button @click="newProject">
    Новый проект
  </button>

  <div class="background-settings">
    <label>Цвет фона:</label>

    <input
      type="color"
      v-model="backgroundColor"
      @input="updateBackgroundColor"
    />
  </div>
  </div>

  <div class="size-style">
    <label>Размер страницы:</label>

    <select
      v-model="selectedSize"
      @change="changePageSize"
    >
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

function handleExport(format: string) {

  switch (format) {
    case 'png':
      exportToPNG(canvas.value)
      break

    case 'jpeg':
      exportToJPEG(canvas.value)
      break

    case 'svg':
      exportToSVG(canvas.value)
      break

    case 'pdf':
      exportToPDF(canvas.value)
      break

    case 'xml':
      exportToXML(canvas.value, {
        editorTheme: editorTheme.value
      })
      break
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
    isBold.value = selectedObject.value.fontWeight || 'bold'
    isItalic.value = selectedObject.value.fontStyle || 'italic'
    isUnderline.value = selectedObject.value.underline || true
  } else if (selectedObject.value.type === 'image') {
    selectedOpacity.value = selectedObject.value.opacity || 1
  } 
}
function updateBackgroundColor() {
  if (!canvas.value) return

  canvas.value.set('backgroundColor', backgroundColor.value)
  canvas.value.renderAll()
}

function updateText() {
  if (selectedObject.value?.type === 'textbox') {
    selectedObject.value.set('text', editableText.value)
    canvas.value?.renderAll()
  }
}
function updateFont() {
  if (selectedObject.value?.type === 'textbox') {
    selectedObject.value.set('fontFamily', selectedFont.value)
    canvas.value?.renderAll()
  }
}
function updateFontSize() {
  if (selectedObject.value?.type === 'textbox') {
    selectedObject.value.set('fontSize', selectedFontSize.value);
    canvas.value?.renderAll();
  }
}
function updateColor() {
  if (selectedObject.value?.type === 'textbox') {
    selectedObject.value.set('fill', selectedColor.value)
    canvas.value?.renderAll()
  }
}
function updateTextAlign() {
  if (selectedObject.value?.type === 'textbox') {
    selectedObject.value.set('textAlign', selectedTextAlign.value)
    canvas.value?.renderAll()
  }
}
function toggleBold() {
  if (selectedObject.value?.type !== 'textbox') return

  isBold.value = !isBold.value

  selectedObject.value.set({
    fontWeight: isBold.value ? 'bold' : 'normal'
  })

  canvas.value?.renderAll()
}

function toggleItalic() {
  if (selectedObject.value?.type !== 'textbox') return

  isItalic.value = !isItalic.value

  selectedObject.value.set({
    fontStyle: isItalic.value ? 'italic' : 'normal'
  })

  canvas.value?.renderAll()
}

function toggleUnderline() {
  if (selectedObject.value?.type !== 'textbox') return

  isUnderline.value = !isUnderline.value

  selectedObject.value.set({
    underline: isUnderline.value
  })

  canvas.value?.renderAll()
}
function updateOpacity() {
  if (selectedObject.value?.type === 'image') {
    selectedObject.value.set('opacity', selectedOpacity.value)
    canvas.value?.renderAll()
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Delete') {
    deleteSelectedObject()
    event.preventDefault()
  }
}
function addTextBlock() {
  if (!canvas.value) return

  const textbox = new fabric.Textbox('Введите текст', {
    left: 100,
    top: 100,
    width: 300,
    fontSize: 24,
    editable: true
  })

  canvas.value.add(textbox)
  canvas.value.setActiveObject(textbox)

  textbox.enterEditing()
  textbox.selectAll()
}

function confirmAddText() {
  if (!canvas.value) return
  const finalText = newTextValue.value.trim() || 'Новый текст'
  const text = new fabric.Textbox(finalText, {
    left: 50, top: 50, fontSize: 24, fontFamily: 'Arial', fill: '#000000',
    hasControls: true, hasBorders: true, cornerSize: 8,
    transparentCorners: false, cornerColor: '#3498db', borderColor: '#3498db',
    lockScalingX: false,
    lockScalingY: false
  })
  ;(text as any).setControlsVisibility({
    tl: true, tr: true, bl: true, br: true,
    ml: true, mr: true, mt: true, mb: true
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
        const xmlDoc = parser.parseFromString(
          xmlString,
          'application/xml'
        )

        const cdata =
          xmlDoc.querySelector('data')?.textContent

        if (!cdata) return

        const project = JSON.parse(cdata)

        canvas.value?.loadFromJSON(
          project.canvas,
          () => {

            if (project.page) {

              canvas.value?.setDimensions({
                width: project.page.width,
                height: project.page.height
              })

              canvas.value?.set(
                'backgroundColor',
                project.page.backgroundColor
              )

              backgroundColor.value =
                project.page.backgroundColor

              selectedSize.value = 'custom'

              customWidth.value =
                project.page.width

              customHeight.value =
                project.page.height
            }

            if (project.ui) {

              editorTheme.value =
                project.ui.editorTheme || 'light'
            }

            canvas.value?.renderAll()
          }
        )

      } catch (err) {
        console.error(
          'Ошибка загрузки XML',
          err
        )
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
  });
  canvas.value = fabricCanvas;
  changePageSize();

  fabricCanvas.on('selection:created', (e) => {
    selectedObject.value = e.selected[0];
    loadObjectProperties();
  });
  fabricCanvas.on('selection:updated', (e) => {
    selectedObject.value = e.selected[0];
    loadObjectProperties();
  });
  fabricCanvas.on('selection:cleared', () => {
    selectedObject.value = null;
  });

  window.addEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.canvas-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.canvas-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 100vh;
  padding: 10px;

  background: #f5f5f5;
  transition: background 0.3s ease;
}
.editor-layout{
  display:flex;
  gap:20px;
  align-items:flex-start;
}

.side-panel {
  width: 260px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 15px;
  border: 1px solid #444;
  border-radius: 8px;
}

.side-panel button,
.side-panel select,
.side-panel input,
.side-panel textarea {
  width: 100%;
  box-sizing: border-box;
}
.canvas-editor {
  color: #000;
}
.canvas-editor label,
.canvas-editor h1,
.canvas-editor h2,
.canvas-editor h3,
.canvas-editor p {
  color: inherit;
}
.canvas-container{
  flex:1;
}
.canvas-editor.dark {
  background: #1e1e1e;
  color: white;
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