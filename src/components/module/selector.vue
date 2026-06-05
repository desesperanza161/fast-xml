<template>
  <div class="template-selector">
    <label>Шаблоны:</label>
    <select v-model="selectedTemplateId" @change="onSelect">
      <option value="">-- Выберите шаблон --</option>
      <optgroup v-for="group in groupedTemplates" :key="group.category" :label="group.category">
        <option v-for="tpl in group.templates" :key="tpl.id" :value="tpl.id">
          {{ tpl.name }}
        </option>
      </optgroup>
    </select>
    
    <button @click="saveCurrentAsTemplate" class="save-template-btn">
      Сохранить как шаблон
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getAllTemplates, saveUserTemplate, applyTemplate, type Template } from './storage'  

const props = defineProps<{ canvas: any }>()
const emit = defineEmits(['load'])

const templates = ref<Template[]>([])
const selectedTemplateId = ref('')

const groupedTemplates = computed(() => {
  const groups: Record<string, Template[]> = {}
  templates.value.forEach((tpl: Template) => {          
    if (!groups[tpl.category]) groups[tpl.category] = []
    groups[tpl.category].push(tpl)
  })
  return Object.entries(groups).map(([category, templates]) => ({ category, templates }))
})

const loadTemplates = () => {
  templates.value = getAllTemplates()
}

const onSelect = () => {
  const template = templates.value.find((t: Template) => t.id === selectedTemplateId.value)   
  if (template && props.canvas) {
    applyTemplate(props.canvas, template)
    emit('load', template.id)
  }
}

const saveCurrentAsTemplate = () => {
  const name = prompt('Введите название шаблона:', 'Мой шаблон')
  if (!name || !props.canvas) return
  const category = prompt('Введите категорию:', 'Пользовательские')
  if (!category) return
  const success = saveUserTemplate(name, category, props.canvas)
  if (success) {
    alert('Шаблон сохранён')
    loadTemplates()
  } else {
    alert('Ошибка сохранения')
  }
}

onMounted(() => {
  loadTemplates()
})
</script>

