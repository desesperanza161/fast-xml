<template>
  <div class="canvas-editor">
    <canvas id="fabric-canvas"></canvas>

    <div class="toolbar">
      <div class="group1">
        <button @click="addTextBlock">Добавить текст</button>
        <button @click="triggerFileInput">Загрузить изображение</button>
        <button @click="deleteSelectedObject" class="delete-bin">Очистить</button>
      </div>
      <!--добавка для перемещения текста-->
      <div v-if="showTextWindow" class="draggable-dialog"
      ref="dialogRef" :style="dialogStyle">
      <div class="dialog-head" @mousedown="startDrag">
        <span>Введите текст</span>
        <button class="close-btn" @click="showTextWindow = false"></button>
      </div>
      <div class="dialog-body">
        <input type="text" v-model="newTextValue"
        placeholder="Введите текст" autofocus />
      </div>
      <div class="dialog-footsteps">
      <button @click="confirmAddText">Добавить</button>
      <button @click="showTextWindow = false">Отменить</button>
  </div>
  </div>


      <div class="export">
      <label>Формат Экспорт</label>
      <select v-model="exportFormat" @change="handleExport">
        <option value="svg">"Экспорт SVG"</option>
        <option value="jpeg"> Экспорт JPEG</option>
        <option value="xml">Экспорт XML</option>
        <option value="png">Экспорт PNG</option>
        <option value="pdf">Экспорт PDF</option>
      </select>
      <button @click="triggerXmlInput">Загрузить XML</button>
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

<!--Подкидываем текстовый редактор \=_=/-->

<div class="text-edit">
<!--типы текста-->
<div class="toolbar" v-if="editor">
  <button @click="editor.chain().focus().toggleBold().run()"
  :class="{'is-active': editor.isActive('bold')}"> :Жирный</button>
  <button @click="editor.chain().focus().toggleItalic().run()"
  :class="{'is-active': editor.isActive('italic')}">Курсив</button>
  <button @click="editor.chain().focus().setParagraph().run()"
  :class="{'is-active': editor.isActive('paragraph')}">Обычный</button>
  <button @click="editor.chain().focus().toggleHeading({level: 1}).run()"
  :class="{'is-active': editor.isActive('heading', {level: 1})}">Заголовок</button>
</div>
<!--Меню-->
<editor-content :editor="editor" class="editor-box" />
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
import { ref, onMounted, watch, computed, type CSSProperties } from 'vue'           
import * as fabric from 'fabric'
import jsPDF from 'jspdf'  
import{useEditor, EditorContent} from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

const editor = useEditor({
  content: '<p> Привет, <strong>мир!</strong></p>',
  extensions: [
    StarterKit,
  ],
})

//////        Типы экспорта
/////          :()
const exportFormat = ref('')  
const handleExport = () => {
  switch (exportFormat.value) {
    case 'png': exportToPNG(); break
    case 'jpeg': exportToJPEG(); break
    case 'svg': exportToSVG(); break
    case 'pdf': exportToPDF(); break
    case 'xml': exportToXML(); break
    default: return
  }  exportFormat.value = ''  
}

const canvas = ref<fabric.Canvas | null>(null)
const selectedSize = ref('800x600')
const customWidth = ref(800)
const customHeight = ref(600)
const selectedTemplate = ref('')


function addTextBlock() {
newTextValue.value='Новый текст'
showTextWindow.value= true
}
function confirmAddText(){
if(!canvas.value) return
const finalText = newTextValue.value.trim() || 'Новый текст'
const text = new fabric.Textbox(finalText, {
  left: 50,
  top:50,
  fontSize:24,
  fontFamily: 'Arial',
  fill: '#000000'
})
canvas.value.add(text)
canvas.value.renderAll()
showTextWindow.value = false
}

const showTextWindow = ref(false)
const newTextValue = ref('Новый текст')
const dialogRef = ref<HTMLElement | null>(null)
const dialogPosition =ref({
  x: window.innerWidth /2-150,
  y: window.innerHeight / 2-100})
const dragState = ref({isDragging: false, startX:0, startY:0, startLeft:0, startTop:0})

const dialogStyle = computed(()=>({
  left: `${dialogPosition.value.x}px`,
  top:`${dialogPosition.value.y}px`,
  position:'fixed' as const,
  zIndex: 1000
}))
const startDrag=(e: MouseEvent) =>{
  if (!dialogRef.value) return
  dragState.value = {
    isDragging: true,
    startX: e.clientX,
    startY: e.clientY,
    startLeft: dialogPosition.value.x,
    startTop: dialogPosition.value.y
  }

document.addEventListener('mousemove', onDrag)
document.addEventListener('mouseup', stopDrag)
}
const onDrag = (e: MouseEvent) => {
  if (dragState.value.isDragging) return
  const dx = e.clientX - dragState.value.startX
  const dy = e.clientY - dragState.value.startY
  dialogPosition.value = {
    x: dragState.value.startLeft + dx,
    y: dragState.value.startTop + dy
  }
}
const stopDrag = () => {
  dragState.value.isDragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
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
</fabricCanvas>`       
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

const exportToSVG=() => {
  if (!canvas.value) return
  const svgString = canvas.value.toSVG()
  downloadFile(svgString,'canvas.svg', 'image/svg+xml')
}

const exportToJPEG=() => {
  if (!canvas.value) return
  const dataURL = canvas.value.toDataURL({format: 'jpeg',  multiplier: 1})
  downloadFile(dataURL,'canvas.jpeg', 'image/jpeg')
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
//страницы всех мастей
//
//BY
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
      height = 595       
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


const loadTemplate = () => {
  if (!selectedTemplate.value || !canvas.value) return
  console.log('Загружаем шаблон:', selectedTemplate.value)
}
const selectedFabricText = ref<fabric.Textbox | null>(null)
  const updateTipTapFromFabric = (textObj: fabric.Textbox) => {
    if (!editor.value) return
    const content = `<p>${textObj.text?.replace(/\n/g, '<br>')}</p>`
    editor.value.commands.setContent(content)
  }
  const updateFabricFromTipTap = () => {
    if (!selectedFabricText.value || !editor.value) return
    const plainText = editor.value.getHTML().replace(/<[^>]*>/g, '')
    selectedFabricText.value.set('text', plainText)
    selectedFabricText.value.canvas?.renderAll()
  }

onMounted(() => {
  const fabricCanvas = new fabric.Canvas('fabric-canvas', {
    width: 800,
    height: 600,
    backgroundColor: 'white'
  })
  canvas.value = fabricCanvas
  changePageSize()

  const onSelectionChange = () => {
    const active = canvas.value?.getActiveObject()
    if (active && active.type === 'textbox') {
      selectedFabricText.value = active as any
     //<!-- updateTipTapFromFabric(selectedFabricText.value) -->
 }
else {
      selectedFabricText.value = null
      if (editor.value) editor.value.commands.setContent('<p> Выделить текст на холсте</p>')
}
  }
  canvas.value.on('selection:created',onSelectionChange)
  canvas.value.on('selection:created', onSelectionChange)
  canvas.value.on('selection:created', onSelectionChange)
});

     watch(editor,(newEditor) => {
    if (newEditor){
      newEditor.on('update', updateFabricFromTipTap)
  }
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
.text-editor {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px;
}
.toolbar{
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}
.toolbar button{
  padding: 6px 12px;
  background: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}
.toolbar button.is-active{
  background: #007bff;
  color: white;
  border-color: #0062cc;
}
.editor-box{
  min-height: 150px;
  outline: none;
}
.draggable-dialog{
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  width: 320px;
  overflow: hidden;
  user-select: none;
}
.dialog-head{
  background: #2c3e50;
  color: white;
  padding: 12px 16px;
  cursor: move;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dialog-head span{
  font-weight:bold;
}
.close-btn{
  background:none;
  border:none;
  color:white;
  font-size: 24px;
  cursor: pointer;
  padding: 0 6px;
}
.dialog-body {
  padding: 20px;
}
.dialog-body input{
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
}
.dialog-footsteps{
  padding: 12px 16px;
  text-align: right
}
.dialog-footsteps button{
  margin-left: 10px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.dialog-footsteps button:first-child{
  background: #3498db;
  color: white;
}
.dialog-footsteps button:last-child{
  background: #e74c3c;
  color: white;
}
</style> 