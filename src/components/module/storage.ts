import * as fabric from 'fabric'
import { presetTemplates, type Template } from './preset'

const STORAGE_KEY = 'user_templates'

export function getAllTemplates(): Template[] {
  const userTemplates = getUserTemplates()
  return [...presetTemplates, ...userTemplates]
}

function getUserTemplates(): Template[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function saveUserTemplate(name: string, category: string, canvas: fabric.Canvas | null): boolean {
  if (!canvas) return false
  const json = canvas.toJSON()
  const newTemplate: Template = {
    id: `user_${Date.now()}`,
    name,
    category,
    data: json
  }
  const userTemplates = getUserTemplates()
  userTemplates.push(newTemplate)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userTemplates))
  return true
}

export function applyTemplate(canvas: fabric.Canvas | null, template: Template | null): void {
  if (!canvas || !template) return
  canvas.clear()
  canvas.backgroundColor = template.data.background || 'white'
  canvas.loadFromJSON(template.data, () => {
    canvas.renderAll()
  })
}

export type { Template }