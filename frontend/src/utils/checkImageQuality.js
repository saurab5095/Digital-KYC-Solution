
export async function checkImageQuality(file) {

  if (!file) return { ok: false, reason: 'No file selected' };

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) return { ok: false, reason: 'File too large (>5MB)' };

  if (file.type === 'application/pdf') return { ok: true };

  const url = URL.createObjectURL(file);
  const img = new Image();
  const loadPromise = new Promise((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error('Failed to load image'));
  });
  img.src = url;
  try {
    await loadPromise;
  } catch (e) {
    URL.revokeObjectURL(url);
    return { ok: false, reason: 'Could not read image file' };
  }

  const minWidth = 800;
  const minHeight = 600;
  if (img.width < minWidth || img.height < minHeight) {
    URL.revokeObjectURL(url);
    return { ok: false, reason: `Low resolution (${img.width}x${img.height}). Try a clearer scan.` };
  }
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, Math.min(200, img.width), Math.min(200, img.height));
    let variance = 0;

    const data = imageData.data;
    let sum = 0, sumSq = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      const lum = 0.2126*r + 0.7152*g + 0.0722*b;
      sum += lum; sumSq += lum*lum; n++;
    }
    if (n > 0) {
      const mean = sum / n;
      variance = sumSq / n - mean*mean;
    }

    if (variance < 200) {
      URL.revokeObjectURL(url);
      return { ok: false, reason: 'Image may be blurry. Try a clearer scan or better lighting.' };
    }
  } catch (e) {
    console.warn('blur heuristic failed', e);
  }

  URL.revokeObjectURL(url);
  return { ok: true };
}
