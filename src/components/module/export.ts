import * as fabric from 'fabric'
import jsPDF from 'jspdf'

type CanvasType = any

function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType?: string
): void {
  let blob: Blob

  if (typeof content === 'string') {
    blob = new Blob(
      [content],
      { type: mimeType || 'text/plain' }
    )
  } else {
    blob = content
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

export function exportToPNG(
  canvas: CanvasType
): void {
  if (!canvas) return

  const dataURL = canvas.toDataURL({
    format: 'png',
    multiplier: 1
  })

  const response = fetch(dataURL)
  response.then(async (res) => {
    const blob = await res.blob()
    downloadFile(blob, 'canvas.png')
  })
}

export function exportToJPEG(
  canvas: CanvasType
): void {
  if (!canvas) return

  const dataURL = canvas.toDataURL({
    format: 'jpeg',
    multiplier: 1
  })

  const response = fetch(dataURL)

  response.then(async (res) => {
    const blob = await res.blob()
    downloadFile(blob, 'canvas.jpeg')
  })
}

export function exportToSVG(
  canvas: CanvasType
): void {
  if (!canvas) return

  const svgString = canvas.toSVG()

  downloadFile(
    svgString,
    'canvas.svg',
    'image/svg+xml'
  )
}

export function exportToPDF(
  canvas: CanvasType
): void {
  if (!canvas) return

  const dataURL = canvas.toDataURL({
    format: 'png',
    multiplier: 1
  })

  const img = new Image()

  img.src = dataURL

  img.onload = () => {
    const pdf = new jsPDF({
      orientation:
        img.width > img.height
          ? 'landscape'
          : 'portrait',

      unit: 'px',

      format: [
        img.width,
        img.height
      ]
    })

    pdf.addImage(
      dataURL,
      'PNG',
      0,
      0,
      img.width,
      img.height
    )

    pdf.save('canvas.pdf')
  }
}

export function exportToXML(
  canvas: CanvasType,
  settings?: {
    editorTheme?: string
  }
): void {

  if (!canvas) return

  const projectData = {

    canvas: canvas.toJSON(),

    page: {
      width: canvas.width,
      height: canvas.height,

      backgroundColor:
        canvas.backgroundColor || '#ffffff'
    },

    ui: {
      editorTheme:
        settings?.editorTheme || 'light'
    }
  }

  const xmlString =
`<?xml version="1.0" encoding="UTF-8"?>
<fabricCanvas>
  <data><![CDATA[
${JSON.stringify(projectData)}
  ]]></data>
</fabricCanvas>`

  downloadFile(
    xmlString,
    'canvas.xml',
    'application/xml'
  )
}