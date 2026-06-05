import type { Ref } from 'vue'
import * as fabric from 'fabric'

export function useImportExport(
  canvas: Ref<fabric.Canvas | null>,
  backgroundColor: Ref<string>,
  selectedSize: Ref<string>,
  customWidth: Ref<number>,
  customHeight: Ref<number>,
  editorTheme: Ref<string>
) {
  function triggerXmlInput() {
    const input = document.createElement('input')

    input.type = 'file'
    input.accept = '.xml'

    input.onchange = (e: Event) => {
      const file =
        (e.target as HTMLInputElement)
          .files?.[0]

      if (!file || !canvas.value) return

      const reader = new FileReader()

      reader.onload = (f) => {
        try {
          const xmlString =
            f.target?.result as string

          const parser = new DOMParser()

          const xmlDoc =
            parser.parseFromString(
              xmlString,
              'application/xml'
            )

          const cdata =
            xmlDoc
              .querySelector('data')
              ?.textContent

          if (!cdata) return

          const project =
            JSON.parse(cdata)

          canvas.value?.loadFromJSON(
            project.canvas,
            () => {
              if (project.page) {
                canvas.value?.setDimensions({
                  width:
                    project.page.width,
                  height:
                    project.page.height
                })

                canvas.value?.set(
                  'backgroundColor',
                  project.page
                    .backgroundColor
                )

                backgroundColor.value =
                  project.page
                    .backgroundColor

                selectedSize.value =
                  'custom'

                customWidth.value =
                  project.page.width

                customHeight.value =
                  project.page.height
              }

              if (project.ui) {
                editorTheme.value =
                  project.ui
                    .editorTheme ||
                  'light'
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

  return {
    triggerXmlInput
  }
}