<template>
  <div class="canvas-editor">
    <canvas id="fabric-canvas"></canvas>

    <div class="toolbar">
      <button @click="addText">➕ Добавить текст</button>
      <button @click="triggerFileInput">🖼️ Загрузить изображение</button>
      <button @click="deleteSelectedObject" class="delete-btn">🗑️ Delete</button>
      <button @click="exportToXML">📄 Экспорт XML</button>
      <button @click="triggerXmlInput">📂 Загрузить XML</button>
      <button @click="exportToPNG">📸 Экспорт PNG</button>
      <button @click="exportToPDF">📑 Экспорт PDF</button>
      <button @click="newProject">🆕 Новый проект</button>
    </div>

    <div class="size-style">
      <label>Размер страницы:</label>
      <select v-model="selectedSize" @change="changePageSize">
        <option value="800x600">800x600 (по умолчанию)</option>
        <option value="a4-portret">A4 (портрет)</option>
        <option value="a4-albom">A4 (альбом)</option>
        <option value="a5">A5</option>
        <option value="Letter">Letter</option>
        <option value="custom">Свои размеры</option>
      </select>
      <div v-if="selectedSize === 'custom'">
        <input type="number" v-model="customWidth" placeholder="Ширина" />
        <input type="number" v-model="customHeight" placeholder="Высота" />
        <button @click="applyCustomSize">Применить</button>
      </div>
    </div>

    <div class="templates">
      <label>Шаблоны: </label>
      <select @change="loadTemplate" v-model="selectedTemplate">
        <option value="">-- Выберите шаблон --</option>
        <option value="/templates/template1.xml">Рекламный</option>
        <option value="/templates/template2.xml">Приглашение</option>
      </select>
    </div>

    <!-- Скрытые input'ы -->
    <input type="file" ref="fileInput" accept="image/*" style="display: none" @change="onImageSelected" />
    <input type="file" ref="xmlInput" accept=".xml" style="display: none" @change="onXmlSelected" />

    <!-- Панель свойств -->
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
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as fabric from 'fabric'
import { XMLBuilder, XMLParser } from 'fast-xml-parser'
import jsPDF from 'jspdf'

// --- Реактивные переменные ---
const canvas = ref(null)
const fileInput = ref(null)
const xmlInput = ref(null)

// Панель свойств
const selectedObject = ref(null)
const editableText = ref('')
const selectedFont = ref('Arial')
const selectedFontSize = ref(24)
const selectedColor = ref('#000000')
const selectedTextAlign = ref('left')
const selectedOpacity = ref(1)

// Размеры страницы
const selectedSize = ref('800x600')
const customWidth = ref(800)
const customHeight = ref(600)

// Шаблоны
const selectedTemplate = ref('')

// --- Инициализация холста ---
onMounted(() => {
  const fabricCanvas = new fabric.Canvas('fabric-canvas', {
    width: 800,
    height: 600,
    backgroundColor: 'white'
  })
  canvas.value = fabricCanvas

  // События выделения
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

  // Автосохранение
  fabricCanvas.on('object:added', () => saveToLocalStorage())
  fabricCanvas.on('object:removed', () => saveToLocalStorage())
  fabricCanvas.on('object:modified', () => saveToLocalStorage())
  fabricCanvas.on('canvas:cleared', () => saveToLocalStorage())

  window.addEventListener('keydown', handleKeyDown)

  // Восстановление из localStorage
  restoreFromLocalStorage()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  if (canvas.value) canvas.value.dispose()
})

// --- Загрузка свойств ---
const loadObjectProperties = () => {
  if (!selectedObject.value) return
  if (selectedObject.value.type === 'textbox') {
    editableText.value = selectedObject.value.text || ''
    selectedFont.value = selectedObject.value.fontFamily || 'Arial'
    selectedFontSize.value = selectedObject.value.fontSize || 24
    selectedColor.value = selectedObject.value.fill || '#000000'
    selectedTextAlign.value = selectedObject.value.textAlign || 'left'
  } else if (selectedObject.value.type === 'image') {
    selectedOpacity.value = selectedObject.value.opacity || 1
  }
}

// --- Применение свойств ---
const updateText = () => {
  if (selectedObject.value?.type === 'textbox') {
    selectedObject.value.set('text', editableText.value)
    canvas.value.renderAll()
  }
}
const updateFont = () => {
  if (selectedObject.value?.type === 'textbox') {
    selectedObject.value.set('fontFamily', selectedFont.value)
    canvas.value.renderAll()
  }
}
const updateFontSize = () => {
  if (selectedObject.value?.type === 'textbox') {
    selectedObject.value.set('fontSize', parseInt(selectedFontSize.value))
    canvas.value.renderAll()
  }
}
const updateColor = () => {
  if (selectedObject.value?.type === 'textbox') {
    selectedObject.value.set('fill', selectedColor.value)
    canvas.value.renderAll()
  }
}
const updateTextAlign = () => {
  if (selectedObject.value?.type === 'textbox') {
    selectedObject.value.set('textAlign', selectedTextAlign.value)
    canvas.value.renderAll()
  }
}
const updateOpacity = () => {
  if (selectedObject.value?.type === 'image') {
    selectedObject.value.set('opacity', parseFloat(selectedOpacity.value))
    canvas.value.renderAll()
  }
}

// --- Добавление текста ---
const addText = () => {
  if (!canvas.value) return
  const textbox = new fabric.Textbox('Новый текст', {
    left: 400,
    top: 300,
    width: 200,
    fontSize: 24,
    fill: '#000000',
    originX: 'center',
    originY: 'center'
  })
  canvas.value.add(textbox)
  canvas.value.renderAll()
}

// --- Загрузка изображения ---
const triggerFileInput = () => {
  fileInput.value.click()
}
const onImageSelected = (event) => {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    fabric.Image.fromURL(e.target.result, (img) => {
      const maxWidth = 600
      const maxHeight = 400
      let scale = 1
      if (img.width > maxWidth) scale = maxWidth / img.width
      if (img.height * scale > maxHeight) scale = maxHeight / img.height
      img.scale(scale)
      img.set({
        left: 400,
        top: 300,
        originX: 'center',
        originY: 'center'
      })
      canvas.value.add(img)
      canvas.value.renderAll()
    })
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}

// --- Удаление ---
const deleteSelectedObject = () => {
  if (!canvas.value) return
  const activeObject = canvas.value.getActiveObject()
  if (activeObject) {
    canvas.value.remove(activeObject)
    canvas.value.renderAll()
  } else {
    alert('Выделите объект для удаления')
  }
}
const handleKeyDown = (event) => {
  if (event.key === 'Delete') {
    deleteSelectedObject()
    event.preventDefault()
  }
}

// --- Экспорт / импорт XML ---
const exportToXML = () => {
  if (!canvas.value) return
  const json = canvas.value.toJSON(['id', 'text', 'fontFamily', 'fontSize', 'fill', 'textAlign', 'src', 'opacity'])
  const builder = new XMLBuilder({ format: true })
  const xml = builder.build({ flyer: json })
  downloadFile(xml, 'flyer.xml', 'application/xml')
}
const triggerXmlInput = () => {
  xmlInput.value.click()
}
const onXmlSelected = (event) => {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const xmlString = e.target.result
    const parser = new XMLParser()
    const parsed = parser.parse(xmlString)
    if (parsed.flyer) {
      canvas.value.loadFromJSON(parsed.flyer, () => {
        canvas.value.renderAll()
        saveToLocalStorage()
      })
    } else {
      alert('Неверный формат XML')
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}

// --- Экспорт PNG (исправленный) ---
const exportToPNG = () => {
  if (!canvas.value) return
  canvas.value.renderAll()
  const nativeCanvas = canvas.value.getElement()
  const dataURL = nativeCanvas.toDataURL('image/png')
  downloadFile(dataURL, 'flyer.png', 'image/png')
}

// --- Экспорт PDF ---
const exportToPDF = () => {
  if (!canvas.value) return
  canvas.value.renderAll()
  const imgData = canvas.value.getElement().toDataURL('image/png')
  const { width, height } = canvas.value.getDimensions()
  const pdf = new jsPDF({ unit: 'px', format: [width, height] })
  pdf.addImage(imgData, 'PNG', 0, 0, width, height)
  pdf.save('flyer.pdf')
}

// --- Управление размерами ---
const changePageSize = () => {
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
  canvas.value.setBackgroundColor('white', () => canvas.value.renderAll())
  saveToLocalStorage()
}
const applyCustomSize = () => {
  if (customWidth.value > 0 && customHeight.value > 0) {
    selectedSize.value = 'custom'
    changePageSize()
  } else {
    alert('Введите корректные размеры')
  }
}

// --- localStorage ---
const saveToLocalStorage = () => {
  if (!canvas.value) return
  const json = canvas.value.toJSON(['id', 'text', 'fontFamily', 'fontSize', 'fill', 'textAlign', 'src', 'opacity'])
  localStorage.setItem('flyer_backup', JSON.stringify(json))
}
const restoreFromLocalStorage = () => {
  const saved = localStorage.getItem('flyer_backup')
  if (saved && canvas.value) {
    if (confirm('Найден сохранённый проект. Восстановить?')) {
      const json = JSON.parse(saved)
      canvas.value.loadFromJSON(json, () => {
        canvas.value.renderAll()
      })
    }
  }
}
const newProject = () => {
  if (confirm('Очистить холст? Все несохранённые изменения будут потеряны.')) {
    canvas.value.clear()
    canvas.value.setBackgroundColor('white', () => canvas.value.renderAll())
    localStorage.removeItem('flyer_backup')
  }
}

// --- Шаблоны ---
const loadTemplate = async () => {
  if (!selectedTemplate.value) return
  try {
    const response = await fetch(selectedTemplate.value)
    const xmlString = await response.text()
    const parser = new XMLParser()
    const parsed = parser.parse(xmlString)
    if (parsed.flyer) {
      canvas.value.loadFromJSON(parsed.flyer, () => {
        canvas.value.renderAll()
        saveToLocalStorage()
      })
    } else {
      alert('Неверный формат шаблона')
    }
  } catch (err) {
    console.error(err)
    alert('Ошибка загрузки шаблона')
  }
  selectedTemplate.value = ''
}

// --- Вспомогательная функция ---
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}
</script>

<style scoped>
.canvas-editor {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px;
}
canvas {
  border: 1px solid #ccc;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
.toolbar, .size-style, .templates {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8px;
}
button {
  padding: 8px 16px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  background-color: #f0f0f0;
  transition: 0.2s;
}
button:hover {
  background-color: #e0e0e0;
}
.delete-btn {
  background-color: #ffe0e0;
  color: #c00;
}
.delete-btn:hover {
  background-color: #ffc0c0;
}
.properties-panel {
  position: fixed;
  right: 20px;
  top: 80px;
  width: 260px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 10;
}
.properties-panel h3 {
  margin-top: 0;
}
.properties-panel label {
  display: block;
  margin-top: 10px;
  font-weight: bold;
  font-size: 0.9rem;
}
.properties-panel textarea,
.properties-panel select,
.properties-panel input[type="text"],
.properties-panel input[type="number"],
.properties-panel input[type="color"] {
  width: 100%;
  margin-top: 4px;
  padding: 4px;
  box-sizing: border-box;
}
</style>