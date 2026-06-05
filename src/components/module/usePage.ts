import type { Ref } from 'vue'
import * as fabric from 'fabric'

export function usePage(
  canvas: Ref<fabric.Canvas | null>,
  selectedSize: Ref<string>,
  customWidth: Ref<number>,
  customHeight: Ref<number>
) {
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
  return {
    changePageSize,
    applyCustomSize
  }
}