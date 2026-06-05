import type { Ref } from 'vue'
import { Canvas } from 'fabric'

export function useCanvasSettings(
  canvas: Ref<Canvas | null>,
  selectedSize: Ref<string>,
  customWidth: Ref<number>,
  customHeight: Ref<number>,
  backgroundColor: Ref<string>
) {

  function updateBackgroundColor() {
    if (!canvas.value) return

    canvas.value.backgroundColor =
      backgroundColor.value

    canvas.value.renderAll()
  }

  function changePageSize() {
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
    }

    canvas.value.setDimensions({
      width,
      height
    })

    canvas.value.renderAll()
  }

  function applyCustomSize() {
    if (selectedSize.value === 'custom') {
      changePageSize()
    }
  }

  function newProject() {
    if (!canvas.value) return

    canvas.value.clear()

    canvas.value.backgroundColor =
      '#ffffff'

    selectedSize.value = '800x600'

    changePageSize()

    canvas.value.renderAll()
  }

  return {
    updateBackgroundColor,
    changePageSize,
    applyCustomSize,
    newProject
  }
}