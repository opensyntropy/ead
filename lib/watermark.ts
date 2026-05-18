import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'

export async function generateWatermarkedPDF(
  pdfBytes: Uint8Array,
  email: string,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
  const watermarkText = `Licenciado para: ${email}`

  const pages = pdfDoc.getPages()
  for (let i = 1; i < pages.length; i += 10) {
    pages[i].drawText(watermarkText, {
      x: 20,
      y: 18,
      size: 8,
      font,
      color: rgb(0.15, 0.15, 0.15),
      opacity: 0.6,
    })
  }

  return pdfDoc.save()
}
