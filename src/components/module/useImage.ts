import type { Ref } from 'vue'
import * as fabric from 'fabric'

export function useImages(
  canvas: Ref<fabric.Canvas | null>
) {
  function triggerFileInput() {
    const input = document.createElement('input')

    input.type = 'file'
    input.accept = 'image/*'

    input.onchange = (e: Event) => {
      const file =
        (e.target as HTMLInputElement)
          .files?.[0]

      if (!file || !canvas.value) return

      const reader = new FileReader()

      reader.onload = (f) => {
        const imgElement = new Image()

        imgElement.src =
          f.target?.result as string

        imgElement.onload = () => {
          if (!canvas.value) return

          const img = new fabric.Image(
            imgElement,
            {
              left: 100,
              top: 100,
              scaleX: 0.5,
              scaleY: 0.5,
              selectable: true,
              hasControls: true,
              hasBorders: true
            }
          )

          canvas.value.add(img)
          canvas.value.setActiveObject(img)
          canvas.value.renderAll()
        }
      }

      reader.readAsDataURL(file)
    }

    input.click()
  }

  function updateOpacity(
    object: any,
    opacity: number
  ) {
    const target =
      object?.value || object

    if (!target) return

    target.set(
      'opacity',
      Number(opacity)
    )

    canvas.value?.renderAll()
  }

  return {
    triggerFileInput,
    updateOpacity
  }
}