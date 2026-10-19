// Shrinks a photo in the browser before upload: max 1000px on the long edge, JPEG.
// Phone photos are often 3-8 MB; this brings them to a few hundred KB.
export async function compress(file: Blob, max = 1000, quality = 0.82): Promise<Blob> {
  const bmp = await createImageBitmap(file) // honours EXIF rotation
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * scale)
  const h = Math.round(bmp.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(bmp, 0, 0, w, h)
  bmp.close?.()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', quality)
  )
}
