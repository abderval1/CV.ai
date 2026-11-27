import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image blob'));
    reader.readAsDataURL(blob);
  });
}

async function resolveImageAsDataUrl(src: string): Promise<string | null> {
  if (!src || src.startsWith('data:')) return src || null;

  try {
    const directRes = await fetch(src, { mode: 'cors' });
    if (directRes.ok) {
      const blob = await directRes.blob();
      return await blobToDataUrl(blob);
    }
  } catch {
    // Fallback to backend image proxy
  }

  try {
    const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(src)}`);
    if (proxyRes.ok) {
      const blob = await proxyRes.blob();
      return await blobToDataUrl(blob);
    }
  } catch {
    // Ignore proxy failure
  }

  return null;
}

async function inlineCloneImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute('src') || img.src;
      if (!src || src.startsWith('data:')) return;
      const dataUrl = await resolveImageAsDataUrl(src);
      if (dataUrl) {
        img.setAttribute('src', dataUrl);
      }
      img.removeAttribute('loading');
    })
  );
}

export async function exportElementToPdf(
  sourceSelector: string,
  filename: string
): Promise<void> {
  const sourceEl = document.querySelector(sourceSelector) as HTMLElement | null;
  if (!sourceEl) {
    throw new Error('Documento não encontrado para exportação em PDF.');
  }

  // Render an isolated 210mm (794px) light-mode A4 clone off-screen so:
  // 1) Mobile viewports (<768px) or hidden mobile preview tabs export exact A4 desktop layouts
  // 2) Screen zoom transforms do not shrink or crop the PDF
  // 3) Dark UI theme classes never bleed into the PDF
  const stage = document.createElement('div');
  stage.setAttribute('aria-hidden', 'true');
  stage.style.position = 'fixed';
  stage.style.left = '-16000px';
  stage.style.top = '0';
  stage.style.width = '794px';
  stage.style.backgroundColor = '#ffffff';
  stage.style.color = '#0f172a';
  stage.style.colorScheme = 'light';
  stage.style.zIndex = '-1';
  stage.style.pointerEvents = 'none';
  stage.style.overflow = 'visible';

  const clone = sourceEl.cloneNode(true) as HTMLElement;
  clone.classList.add('pdf-capture-sheet');
  clone.style.transform = 'none';
  clone.style.width = '794px';
  clone.style.maxWidth = '794px';
  clone.style.margin = '0';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';
  clone.style.border = 'none';
  clone.style.minHeight = '1123px';

  // Remove interactive screen-only outlines / editable highlights
  clone.querySelectorAll('[contenteditable]').forEach((node) => {
    node.removeAttribute('contenteditable');
  });

  stage.appendChild(clone);
  document.body.appendChild(stage);

  try {
    await inlineCloneImages(clone);
    if (document.fonts?.ready) {
      await document.fonts.ready.catch(() => {});
    }
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );

    const captureHeight = Math.max(clone.scrollHeight, clone.offsetHeight, 1123);

    const canvas = await toCanvas(clone, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      width: 794,
      height: captureHeight,
      cacheBust: false,
      style: {
        margin: '0',
        transform: 'none'
      }
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidthMm = 210;
    const pageHeightMm = 297;
    const pageHeightPx = Math.floor(canvas.width * (pageHeightMm / pageWidthMm));

    if (canvas.height <= pageHeightPx + 16) {
      const renderedHeightMm = Math.min(pageHeightMm, (canvas.height / canvas.width) * pageWidthMm);
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidthMm, renderedHeightMm, undefined, 'FAST');
    } else {
      let offsetY = 0;
      let pageIndex = 0;

      while (offsetY < canvas.height - 4) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - offsetY);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;

        const ctx = pageCanvas.getContext('2d');
        if (!ctx) break;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          offsetY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

        const sliceMm = (sliceHeight / canvas.width) * pageWidthMm;
        if (pageIndex > 0) pdf.addPage('a4', 'portrait');
        pdf.addImage(
          pageCanvas.toDataURL('image/png'),
          'PNG',
          0,
          0,
          pageWidthMm,
          sliceMm,
          undefined,
          'FAST'
        );

        offsetY += sliceHeight;
        pageIndex += 1;
      }
    }

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  } finally {
    document.body.removeChild(stage);
  }
}
