import type { Ref } from 'vue'
import * as fabric from 'fabric'

export function useText(
  canvas: Ref<fabric.Canvas | null>
) {

  function addTextBlock() {
    if (!canvas.value) return

    const textbox = new fabric.Textbox(
      'Введите текст',
      {
        left: 100,
        top: 100,
        width: 250,
        fontSize: 24,
        fontFamily: 'Arial'
      }
    )

    canvas.value.add(textbox)
    canvas.value.setActiveObject(textbox)
    canvas.value.renderAll()
  }

  function updateText(
    object: any,
    text: string
  ) {
    const target = object?.value || object

    if (!target) return

    target.set('text', text)

    canvas.value?.renderAll()
  }

  function updateFont(
    object: any,
    font: string
  ) {
    const target = object?.value || object

    if (!target) return

    target.set('fontFamily', font)

    canvas.value?.renderAll()
  }

  function updateFontSize(
    object: any,
    size: number
  ) {
    const target = object?.value || object

    if (!target) return

    target.set('fontSize', Number(size))

    canvas.value?.renderAll()
  }

  function updateColor(
    object: any,
    color: string
  ) {
    const target = object?.value || object

    if (!target) return

    target.set('fill', color)

    canvas.value?.renderAll()
  }

  return {
    addTextBlock,
    updateText,
    updateFont,
    updateFontSize,
    updateColor
  }
}