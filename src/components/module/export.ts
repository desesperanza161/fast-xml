import * as  fabric  from 'fabric'
import jsPDF from 'jspdf'

type CanvasType = any

function downloadFile(content: string | Blob, filename: string, mimeType?: string): void {
  let blob: Blob
  if (typeof content === 'string') {
    blob = new Blob([content], { type: mimeType || 'text/plain' })
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

export function exportToPNG(canvas: CanvasType): void {
  if (!canvas) return
  const dataURL = canvas.toDataURL({ format: 'png', multiplier: 1 })
  downloadFile(dataURL, 'canvas.png', 'image/png')
}

export function exportToJPEG(canvas: CanvasType): void {
  if (!canvas) return
  const dataURL = canvas.toDataURL({ format: 'jpeg', multiplier: 1 })
  downloadFile(dataURL, 'canvas.jpeg', 'image/jpeg')
}

export function exportToSVG(canvas: CanvasType): void {
  if (!canvas) return
  const svgString = canvas.toSVG()
  downloadFile(svgString, 'canvas.svg', 'image/svg+xml')
}

export function exportToPDF(canvas: CanvasType): void {
  if (!canvas) return
  const dataURL = canvas.toDataURL({ format: 'png', multiplier: 1 })
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

export function exportToXML(canvas: CanvasType): void {
  if (!canvas) return
  const json = canvas.toJSON()
  const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<fabricCanvas>
  <data><![CDATA[${JSON.stringify(json)}]]></data>
</fabricCanvas>`
  downloadFile(xmlString, 'canvas.xml', 'application/xml')
}