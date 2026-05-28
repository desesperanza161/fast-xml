<template>
  <div class="canvas-editor">
    <canvas id="fabric-canvas"></canvas>

    <div class="toolbar">
      <div class="group1">
        <button @click="addTextBlock">Добавить текст</button>
        <button @click="triggerFileInput">Загрузить изображение</button>
        <button @click="deleteSelectedObject" class="delete-bin">Очистить</button>
      </div>
      <div class="group2">
        <button @click="exportToXML">Экспорт XML</button>
        <button @click="triggerXmlInput">Загрузить XML</button>
        <button @click="exportToPNG">Экспорт PNG</button>
        <button @click="exportToPDF">Экспорт PDF</button>
      </div>
      <div class="group3">
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

    <div class="templates">
      <label>Шаблоны:</label>
      <select @change="loadTemplate" v-model="selectedTemplate">
        <option value="">Выберите шаблон</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'           // исправлено: onMound → onMounted
import * as fabric from 'fabric'
import jsPDF from 'jspdf'                      // добавлен импорт

const canvas = ref<fabric.Canvas | null>(null)
const selectedSize = ref('800x600')
const customWidth = ref(800)
const customHeight = ref(600)
const selectedTemplate = ref('')

// исправлена функция addTextBlock (убрано this, добавлена работа с canvas)
function addTextBlock() {
  if (!canvas.value) return
  const text = new fabric.Textbox('Новый текст', {
    left: 50, top: 50, fontSize: 24, fontFamily: 'Arial', fill: '#000000'
  })
  canvas.value.add(text)
  canvas.value.renderAll()
}

const triggerFileInput = () => {
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
        const img = new fabric.Image(imgElement, {
          left: 100, top: 100, scaleX: 0.5, scaleY: 0.5
        })
        canvas.value?.add(img)
        canvas.value?.renderAll()
      }
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

// добавлена недостающая функция удаления
const deleteSelectedObject = () => {
  if (!canvas.value) return
  const obj = canvas.value.getActiveObject()
  if (obj) {
    canvas.value.remove(obj)
    canvas.value.discardActiveObject()
    canvas.value.renderAll()
  }
}

const exportToXML = () => {
  if (!canvas.value) return
  const json = canvas.value.toJSON()
  const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<fabricCanvas>
  <data><![CDATA[${JSON.stringify(json)}]]></data>
</fabricCanvas>`        // исправлено: обратные кавычки вместо одинарных
  downloadFile(xmlString, 'canvas.xml', 'application/xml')
}

const triggerXmlInput = () => {
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
          canvas.value?.loadFromJSON(json, () => {
            canvas.value?.renderAll()
          })
        }
      } catch (err) {
        console.error('Ошибка загрузки XML', err)
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

const exportToPNG = () => {
  if (!canvas.value) return
  const dataURL = canvas.value.toDataURL({ format: 'png', multiplier: 1 })
  downloadFile(dataURL, 'canvas.png', 'image/png')
}

const exportToPDF = () => {
  if (!canvas.value) return
  const dataURL = canvas.value.toDataURL({ format: 'png', multiplier: 1 })
  const img = new Image()
  img.src = dataURL
  img.onload = () => {
    const pdf = new jsPDF({
      orientation: img.width > img.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [img.width, img.height]
    })
    pdf.addImage(dataURL, 'PNG', 0, 0, img.width, img.height)
    pdf.save('canvas.pdf')
  }
}

const newProject = () => {
  if (!canvas.value) return
  canvas.value.clear()
  canvas.value.backgroundColor = 'white'
  selectedSize.value = '800x600'
  changePageSize()
  canvas.value.renderAll()
}

const downloadFile = (content: string | Blob, filename: string, mimeType?: string) => {  // убран тип DataURL
  let blob: Blob
  if (typeof content === 'string') {
    blob = new Blob([content], { type: mimeType || 'text/plain' })
  } else {
    blob = content as Blob
  }
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const changePageSize = () => {
  if (!canvas.value) return
  let width = 800
  let height = 600
  switch (selectedSize.value) {
    case 'a4-portret':
      width = 595
      height = 842
      break
    case 'a4-albom':
      width = 842
      height = 595       // исправлено: было 542
      break
    case 'a5':
      width = 420
      height = 595
      break
    case 'Letter':
      width = 612
      height = 792
      break
    case 'custom':
      width = customWidth.value
      height = customHeight.value
      break
    default:
      width = 800
      height = 600
  }
canvas.value.setDimensions({ width, height })
  canvas.value.renderAll()
}

const applyCustomSize = () => {
  if (selectedSize.value === 'custom') {
    changePageSize()
  }
}

// добавлена недостающая функция загрузки шаблона (заглушка)
const loadTemplate = () => {
  if (!selectedTemplate.value || !canvas.value) return
  console.log('Загружаем шаблон:', selectedTemplate.value)
}

onMounted(() => {
  const fabricCanvas = new fabric.Canvas('fabric-canvas', {
    width: 800,
    height: 600,
    backgroundColor: 'white'
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
.group1, .group2, .group3 {
  display: flex;
  gap: 8px;
}
.size-style, .templates {
  margin-top: 10px;
}
</style>