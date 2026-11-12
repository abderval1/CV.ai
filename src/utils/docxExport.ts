import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
  convertMillimetersToTwip,
  ImageRun,
  HeightRule,
  Footer,
  VerticalAlign,
  ShadingType
} from 'docx';
import { CVData, CVSectionKey, TemplateStyle } from '../types/cv';
import { DEFAULT_SECTION_ORDER } from './executivePhrasing';
import { LanguageCode } from '../context/LanguageContext';
import {
  getResolvedSectionTitles,
  COVER_CHROME_LABELS
} from './cvDocumentLabels';

const A4_WIDTH_TWIP = convertMillimetersToTwip(210);
const A4_HEIGHT_TWIP = convertMillimetersToTwip(297);

function isSecVisible(cv: CVData, key: CVSectionKey): boolean {
  return cv.sectionVisibility?.[key] !== false;
}

// Blend any 6-char hex color toward white (simulates translucent white/10 cards in Word cell shading)
function blendHexWithWhite(hex: string, whiteRatio: number): string {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) || 15;
  const g = parseInt(full.slice(2, 4), 16) || 23;
  const b = parseInt(full.slice(4, 6), 16) || 42;
  const mix = (ch: number) =>
    Math.min(255, Math.max(0, Math.round(ch * (1 - whiteRatio) + 255 * whiteRatio)))
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
  return `${mix(r)}${mix(g)}${mix(b)}`;
}

// Blend any 6-char hex slightly darker or softer border color for dark sidebar dividers
function blendHexLighter(hex: string, ratio: number): string {
  return blendHexWithWhite(hex, ratio);
}

// Helper to safely parse Data URL or fetch remote URL into Uint8Array for docx ImageRun
async function getPhotoBytes(
  photoUrl?: string
): Promise<{ data: Uint8Array; type: 'png' | 'jpg' } | null> {
  if (!photoUrl) return null;
  try {
    if (photoUrl.startsWith('data:')) {
      const parts = photoUrl.split(',');
      if (parts.length !== 2) return null;
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1].toLowerCase() : 'image/jpeg';
      const binary = atob(parts[1]);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      const type: 'png' | 'jpg' = mime.includes('png') ? 'png' : 'jpg';
      return { data: array, type };
    }

    if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://') || photoUrl.startsWith('/')) {
      try {
        const res = await fetch(photoUrl, { mode: 'cors' });
        if (res.ok) {
          const buf = await res.arrayBuffer();
          const contentType = res.headers.get('content-type') || '';
          const type: 'png' | 'jpg' = contentType.includes('png') ? 'png' : 'jpg';
          return { data: new Uint8Array(buf), type };
        }
      } catch {
        // Fallback to backend proxy
      }

      try {
        const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(photoUrl)}`);
        if (proxyRes.ok) {
          const buf = await proxyRes.arrayBuffer();
          const contentType = proxyRes.headers.get('content-type') || '';
          const type: 'png' | 'jpg' = contentType.includes('png') ? 'png' : 'jpg';
          return { data: new Uint8Array(buf), type };
        }
      } catch {
        // Fallback to canvas
      }

      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const fromCanvas = await new Promise<{ data: Uint8Array; type: 'png' | 'jpg' } | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth || 200;
              canvas.height = img.naturalHeight || 200;
              const ctx = canvas.getContext('2d');
              if (!ctx) return resolve(null);
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
              const parts = dataUrl.split(',');
              if (parts.length !== 2) return resolve(null);
              const binary = atob(parts[1]);
              const array = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                array[i] = binary.charCodeAt(i);
              }
              resolve({ data: array, type: 'jpg' });
            } catch {
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = photoUrl;
        });

        if (fromCanvas) return fromCanvas;
      }
    }
  } catch (err) {
    console.warn('Could not process photo for Word document export:', err);
  }
  return null;
}

const NO_BORDER = {
  style: BorderStyle.NONE,
  size: 0,
  color: 'FFFFFF'
};

const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER
};

interface SpacingMetrics {
  pageMarginTop: number;
  pageMarginBottom: number;
  pageMarginLeft: number;
  pageMarginRight: number;
  headerAfter: number;
  sectionBefore: number;
  sectionAfter: number;
  itemBefore: number;
  itemAfter: number;
  bulletAfter: number;
  lineSpacing: number;
  summaryAfter: number;
  fontSizeTitle: number;
  fontSizeSubtitle: number;
  fontSizeHeading: number;
  fontSizeBody: number;
  fontSizeSubtext: number;
}

// Calibrated 1:1 with A4 screen sheet densities (p-12 = 12.7mm / 0.5in normal, compact, relaxed)
function getSpacingMetrics(density: 'compact' | 'normal' | 'relaxed' = 'normal'): SpacingMetrics {
  if (density === 'compact') {
    return {
      pageMarginTop: convertMillimetersToTwip(9.5),
      pageMarginBottom: convertMillimetersToTwip(9.5),
      pageMarginLeft: convertMillimetersToTwip(11),
      pageMarginRight: convertMillimetersToTwip(11),
      headerAfter: 90,
      sectionBefore: 130,
      sectionAfter: 55,
      itemBefore: 60,
      itemAfter: 25,
      bulletAfter: 28,
      lineSpacing: 276, // ~1.15x matching .cv-density-compact 1.35 CSS
      summaryAfter: 65,
      fontSizeTitle: 34, // 17pt
      fontSizeSubtitle: 20, // 10pt
      fontSizeHeading: 19, // 9.5pt
      fontSizeBody: 18, // 9pt
      fontSizeSubtext: 16 // 8pt
    };
  }
  if (density === 'relaxed') {
    return {
      pageMarginTop: convertMillimetersToTwip(16),
      pageMarginBottom: convertMillimetersToTwip(16),
      pageMarginLeft: convertMillimetersToTwip(16),
      pageMarginRight: convertMillimetersToTwip(16),
      headerAfter: 180,
      sectionBefore: 240,
      sectionAfter: 100,
      itemBefore: 120,
      itemAfter: 45,
      bulletAfter: 55,
      lineSpacing: 348, // ~1.45x matching .cv-density-relaxed 1.65 CSS
      summaryAfter: 120,
      fontSizeTitle: 44, // 22pt
      fontSizeSubtitle: 23, // 11.5pt
      fontSizeHeading: 21, // 10.5pt
      fontSizeBody: 21, // 10.5pt
      fontSizeSubtext: 18 // 9pt
    };
  }
  // Normal: mirrors web preview A4 (p-12 = 12.7mm, leading-relaxed)
  return {
    pageMarginTop: convertMillimetersToTwip(12.7),
    pageMarginBottom: convertMillimetersToTwip(12.7),
    pageMarginLeft: convertMillimetersToTwip(12.7),
    pageMarginRight: convertMillimetersToTwip(12.7),
    headerAfter: 140,
    sectionBefore: 190,
    sectionAfter: 75,
    itemBefore: 95,
    itemAfter: 35,
    bulletAfter: 40,
    lineSpacing: 312, // ~1.30x matching CSS leading-relaxed
    summaryAfter: 90,
    fontSizeTitle: 40, // 20pt (text-2xl/3xl scaled to A4)
    fontSizeSubtitle: 21, // 10.5pt
    fontSizeHeading: 20, // 10pt
    fontSizeBody: 19.5, // 9.75pt (~13.5px on A4)
    fontSizeSubtext: 17.5 // 8.75pt
  };
}

function createWatermarkNotice(fontFamily: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 140 },
    border: {
      bottom: { style: BorderStyle.DASHED, size: 6, color: 'DC2626', space: 4 },
      top: { style: BorderStyle.DASHED, size: 6, color: 'DC2626', space: 4 }
    },
    children: [
      new TextRun({
        text: '★ PRÉ-VISUALIZAÇÃO DEMONSTRATIVA · CURRÍCULO ESTRATÉGICO ★',
        bold: true,
        size: 18,
        font: fontFamily,
        color: 'DC2626'
      }),
      new TextRun({
        text: '\n(Documento de demonstração com marca de água. Ative o plano Pro ou Executive para remover a marca)',
        italics: true,
        size: 15,
        font: fontFamily,
        color: '64748B'
      })
    ]
  });
}

function formatCefrBadge(level: string): string {
  if (level.includes('Nativo') || level.includes('Native') || level.includes('C2') || level.includes('Muttersprache')) {
    return '[C2/Nativo]';
  }
  if (level.includes('C1') || level.includes('Avançado') || level.includes('Fluent')) {
    return '[C1/Avançado]';
  }
  return '[B2]';
}

// Shared 3-column bordered References table matching all Single-Column templates in CVDocumentView.tsx
function buildReferencesTable(
  cv: CVData,
  m: SpacingMetrics,
  fontFamily: string,
  monoFont: string,
  titles: ReturnType<typeof getResolvedSectionTitles>
): Table {
  const borderCell = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' };
  const borderHeaderBottom = { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' };
  const cellMargins = { top: 80, bottom: 80, left: 110, right: 110 };

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      { label: titles.tableRefName, pct: 30 },
      { label: titles.tableRefInstitution, pct: 45 },
      { label: titles.tableRefContact, pct: 25 }
    ].map(
      (col) =>
        new TableCell({
          width: { size: col.pct, type: WidthType.PERCENTAGE },
          shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
          margins: cellMargins,
          borders: {
            top: borderCell,
            bottom: borderHeaderBottom,
            left: borderCell,
            right: borderCell
          },
          children: [
            new Paragraph({
              spacing: { before: 0, after: 0 },
              children: [
                new TextRun({
                  text: col.label,
                  bold: true,
                  size: m.fontSizeSubtext,
                  font: fontFamily,
                  color: '0F172A'
                })
              ]
            })
          ]
        })
    )
  });

  const bodyRows = (cv.references || []).map((ref, idx) => {
    const fill = idx % 2 === 1 ? 'F8FAFC' : 'FFFFFF';
    return new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { fill, type: ShadingType.CLEAR },
          margins: cellMargins,
          borders: { top: borderCell, bottom: borderCell, left: borderCell, right: borderCell },
          children: [
            new Paragraph({
              spacing: { before: 0, after: 0 },
              children: [
                new TextRun({
                  text: ref.name,
                  bold: true,
                  size: m.fontSizeSubtext,
                  font: fontFamily,
                  color: '0F172A'
                })
              ]
            })
          ]
        }),
        new TableCell({
          width: { size: 45, type: WidthType.PERCENTAGE },
          shading: { fill, type: ShadingType.CLEAR },
          margins: cellMargins,
          borders: { top: borderCell, bottom: borderCell, left: borderCell, right: borderCell },
          children: [
            new Paragraph({
              spacing: { before: 0, after: 0 },
              children: [
                new TextRun({
                  text: ref.institutionAndPosition,
                  size: m.fontSizeSubtext,
                  font: fontFamily,
                  color: '334155'
                })
              ]
            })
          ]
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill, type: ShadingType.CLEAR },
          margins: cellMargins,
          borders: { top: borderCell, bottom: borderCell, left: borderCell, right: borderCell },
          children: [
            new Paragraph({
              spacing: { before: 0, after: 0 },
              children: [
                new TextRun({
                  text: ref.contact,
                  size: m.fontSizeSubtext - 0.5,
                  font: monoFont,
                  color: '1E293B'
                })
              ]
            })
          ]
        })
      ]
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows]
  });
}

// ============================================================================
// SINGLE-COLUMN EXECUTIVE ENGINE (Matches all 8 Single-Column Templates 1:1)
// ============================================================================
function buildSingleColumnCVDoc(
  cv: CVData,
  hasActivePlan: boolean,
  COLOR_PRIMARY: string,
  photoBytes: { data: Uint8Array; type: 'png' | 'jpg' } | null,
  density: 'compact' | 'normal' | 'relaxed',
  lang: LanguageCode
): Document {
  const style: TemplateStyle = cv.templateStyle || 'european_modern';
  const isHarvard = style === 'executive_harvard';
  const isEuropass = style === 'european_europass';
  const isTech = style === 'tech_modern';
  const isAts = style === 'ats_compact';
  const isMinimalist = style === 'hybrid_minimalist';
  const isAcademic = style === 'academic_lattes';
  const isClassic = style === 'un_classic';
  const isModern = style === 'european_modern';

  const titles = getResolvedSectionTitles(lang, style);
  const m = getSpacingMetrics(density);

  // Fonts matching CSS: font-serif-cv / font-mono-code / font-jakarta
  const primaryFont =
    isHarvard || isAcademic || isClassic
      ? 'Times New Roman'
      : isAts
      ? 'Consolas'
      : 'Calibri';
  const serifFont = 'Times New Roman';
  const monoFont = 'Consolas';

  // Exact colors matching CVDocumentView.tsx
  const sectionHeadingColor =
    isHarvard || isAts
      ? '020617'
      : isTech
      ? '0F766E'
      : isEuropass
      ? '003399'
      : isAcademic
      ? '0F172A'
      : isClassic
      ? '1E3A8A'
      : isMinimalist
      ? '0F172A'
      : COLOR_PRIMARY;

  const sectionBorderColor =
    isHarvard
      ? '0F172A'
      : isAts
      ? '94A3B8'
      : isTech
      ? '0D9488'
      : isEuropass
      ? '003399'
      : isMinimalist
      ? 'E2E8F0'
      : isAcademic
      ? '0F172A'
      : isClassic
      ? 'CBD5E1'
      : COLOR_PRIMARY;

  const nameColor = isEuropass ? '003399' : isAts ? '0F172A' : COLOR_PRIMARY;

  const templateSupportsPhoto =
    isEuropass || isMinimalist || isModern || isTech || isClassic || isAcademic;
  const effectivePhoto = templateSupportsPhoto ? photoBytes : null;

  const children: (Paragraph | Table)[] = [];

  if (!hasActivePlan) {
    children.push(createWatermarkNotice(primaryFont));
  }

  // Academic Lattes full-width boxed banner matching CVDocumentView lines 1363-1372
  if (isAcademic) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 110 },
        border: {
          top: { style: BorderStyle.SINGLE, size: 6, color: '475569', space: 4 },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: '475569', space: 4 }
        },
        children: [
          new TextRun({
            text: 'PLATAFORMA LATTES · CURRÍCULO DE CIÊNCIA E TECNOLOGIA',
            bold: true,
            size: 17,
            font: serifFont,
            color: '1E293B'
          }),
          new TextRun({
            text: '\nPadrão Oficial de Investigação Científica & Docência Universitária',
            italics: true,
            size: 14.5,
            font: serifFont,
            color: '64748B'
          })
        ]
      })
    );
  }

  // Build Header Content
  const headerAlign = isClassic ? AlignmentType.CENTER : AlignmentType.LEFT;
  const headerTextParagraphs: Paragraph[] = [];

  if (isEuropass) {
    headerTextParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 55 },
        children: [
          new TextRun({
            text: ' CURRICULUM VITAE EUROPASS ',
            bold: true,
            size: 16,
            font: primaryFont,
            color: 'FFFFFF',
            shading: { fill: '003399', type: ShadingType.CLEAR }
          }),
          new TextRun({
            text: `   ${titles.chrome.europassOfficial}`,
            size: 16.5,
            font: primaryFont,
            color: '64748B'
          })
        ]
      })
    );
  } else if (isTech) {
    headerTextParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 45 },
        children: [
          new TextRun({
            text: '// TECH LEAD & SYSTEMS ARCHITECTURE',
            bold: true,
            size: 17,
            font: monoFont,
            color: '0F766E'
          })
        ]
      })
    );
  } else if (isMinimalist) {
    headerTextParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: 'CURRICULUM VITAE · PADRÃO NÓRDICO',
            bold: true,
            size: 15.5,
            font: monoFont,
            color: '94A3B8'
          })
        ]
      })
    );
  } else if (isAts) {
    headerTextParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 55 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1', space: 3 } },
        children: [
          new TextRun({
            text: '[ATS COMPACT · OCR PARSER COMPLIANT]',
            size: 15.5,
            font: monoFont,
            color: '64748B'
          })
        ]
      })
    );
  } else if (isClassic) {
    headerTextParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 50 },
        children: [
          new TextRun({
            text: 'UNITED NATIONS & INTERNATIONAL COOPERATION STANDARD',
            bold: true,
            size: 16.5,
            font: serifFont,
            color: '1E3A8A'
          })
        ]
      })
    );
  }

  // Name Paragraph
  headerTextParagraphs.push(
    new Paragraph({
      alignment: headerAlign,
      spacing: { after: 25 },
      children: [
        new TextRun({
          text: (cv.personalDetails.name || 'SEU NOME COMPLETO').toUpperCase(),
          bold: true,
          size: m.fontSizeTitle,
          font: primaryFont,
          color: nameColor
        })
      ]
    })
  );

  // Title / Role Headline
  if (cv.personalDetails.title) {
    headerTextParagraphs.push(
      new Paragraph({
        alignment: headerAlign,
        spacing: { after: 45 },
        children: [
          new TextRun({
            text: cv.personalDetails.title,
            bold: true,
            italics: isHarvard,
            size: isTech ? m.fontSizeSubtitle - 1 : m.fontSizeSubtitle,
            font: isTech ? monoFont : primaryFont,
            color: isTech ? '0F766E' : isHarvard ? '334155' : '1E293B'
          })
        ]
      })
    );
  }

  // Contact Line
  const contactLineText = [
    cv.personalDetails.location,
    cv.personalDetails.phone,
    cv.personalDetails.email,
    cv.personalDetails.linkedin,
    cv.personalDetails.website
  ]
    .filter(Boolean)
    .join('  |  ');

  const headerHasBottomBorder = isModern || isHarvard || isEuropass || isTech || isClassic;
  const headerBorderSpec = isModern || isHarvard || isEuropass || isTech
    ? { style: BorderStyle.SINGLE, size: 12, color: isTech ? '0D9488' : isEuropass ? '003399' : isHarvard ? '0F172A' : COLOR_PRIMARY, space: 8 }
    : isClassic
    ? { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0', space: 8 }
    : undefined;

  headerTextParagraphs.push(
    new Paragraph({
      alignment: headerAlign,
      spacing: { after: effectivePhoto ? 0 : m.headerAfter },
      border: !effectivePhoto && headerHasBottomBorder ? { bottom: headerBorderSpec } : undefined,
      children: [
        new TextRun({
          text: contactLineText,
          size: m.fontSizeSubtext,
          font: primaryFont,
          color: '475569'
        })
      ]
    })
  );

  if (effectivePhoto) {
    const photoParagraphs: Paragraph[] = [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: isEuropass ? 25 : 0 },
        children: [
          new ImageRun({
            data: effectivePhoto.data,
            transformation: { width: 92, height: 92 },
            type: effectivePhoto.type
          })
        ]
      })
    ];
    if (isEuropass) {
      photoParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 0 },
          children: [
            new TextRun({
              text: titles.chrome.formalPhoto.toUpperCase(),
              bold: true,
              size: 14,
              font: primaryFont,
              color: '94A3B8'
            })
          ]
        })
      );
    }

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 78, type: WidthType.PERCENTAGE },
                borders: {
                  ...NO_BORDERS,
                  bottom: headerHasBottomBorder ? headerBorderSpec : NO_BORDER
                },
                verticalAlign: VerticalAlign.CENTER,
                margins: { bottom: headerHasBottomBorder ? 110 : 40 },
                children: headerTextParagraphs
              }),
              new TableCell({
                width: { size: 22, type: WidthType.PERCENTAGE },
                borders: {
                  ...NO_BORDERS,
                  bottom: headerHasBottomBorder ? headerBorderSpec : NO_BORDER
                },
                verticalAlign: VerticalAlign.CENTER,
                margins: { bottom: headerHasBottomBorder ? 110 : 40 },
                children: photoParagraphs
              })
            ]
          })
        ]
      })
    );
    children.push(new Paragraph({ spacing: { before: 0, after: m.headerAfter - 40 }, children: [] }));
  } else {
    children.push(...headerTextParagraphs);
  }

  let visibleSectionIdx = 0;

  function createSectionHeading(title: string): Paragraph {
    const idx = visibleSectionIdx++;
    const runs: TextRun[] = [];

    if (isTech) {
      runs.push(
        new TextRun({
          text: '> ',
          bold: true,
          size: m.fontSizeHeading,
          font: monoFont,
          color: '14B8A6'
        })
      );
    } else if (isMinimalist) {
      runs.push(
        new TextRun({
          text: `0${idx + 1} / `,
          bold: true,
          size: m.fontSizeHeading - 2,
          font: monoFont,
          color: '94A3B8'
        })
      );
    } else if (isAcademic) {
      const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][idx] || `${idx + 1}`;
      runs.push(
        new TextRun({
          text: `${roman}. `,
          bold: true,
          size: m.fontSizeHeading,
          font: serifFont,
          color: '0F172A'
        })
      );
    } else if (isClassic) {
      runs.push(
        new TextRun({
          text: `${idx + 1}. `,
          bold: true,
          size: m.fontSizeHeading,
          font: serifFont,
          color: '1E3A8A'
        })
      );
    }

    runs.push(
      new TextRun({
        text: title.toUpperCase(),
        bold: !isMinimalist,
        size: isTech ? m.fontSizeHeading - 0.5 : m.fontSizeHeading,
        font: isTech ? monoFont : primaryFont,
        color: sectionHeadingColor
      })
    );

    const borderSize = isTech || isEuropass ? 12 : 6;

    return new Paragraph({
      spacing: { before: m.sectionBefore, after: m.sectionAfter },
      keepNext: true,
      border: {
        bottom: { style: BorderStyle.SINGLE, size: borderSize, color: sectionBorderColor, space: 4 }
      },
      children: runs
    });
  }

  function renderSection(key: CVSectionKey): (Paragraph | Table)[] {
    if (!isSecVisible(cv, key)) return [];

    switch (key) {
      case 'summary':
        if (!cv.summary) return [];
        return [
          createSectionHeading(titles.summary),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: m.summaryAfter, line: m.lineSpacing },
            children: [
              new TextRun({
                text: cv.summary,
                size: m.fontSizeBody,
                font: primaryFont,
                color: '1E293B'
              })
            ]
          })
        ];

      case 'competencies':
        if (!cv.competencies || cv.competencies.length === 0) return [];
        if (isTech) {
          // Tech Modern 2-column bordered card grid matching CVDocumentView lines 1562-1568
          const heading = createSectionHeading(titles.competencies);
          const cardBorder = { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' };
          const cardRows: TableRow[] = [];
          for (let i = 0; i < cv.competencies.length; i += 2) {
            const left = cv.competencies[i];
            const right = cv.competencies[i + 1];
            const buildCell = (item: typeof left | undefined) =>
              item
                ? new TableCell({
                    width: { size: 49, type: WidthType.PERCENTAGE },
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: { top: cardBorder, bottom: cardBorder, left: cardBorder, right: cardBorder },
                    margins: { top: 80, bottom: 80, left: 110, right: 110 },
                    children: [
                      new Paragraph({
                        spacing: { after: 20 },
                        children: [
                          new TextRun({
                            text: item.category,
                            bold: true,
                            size: m.fontSizeSubtext,
                            font: monoFont,
                            color: '115E59'
                          })
                        ]
                      }),
                      new Paragraph({
                        spacing: { after: 0, line: m.lineSpacing - 20 },
                        children: [
                          new TextRun({
                            text: item.description,
                            size: m.fontSizeSubtext,
                            font: primaryFont,
                            color: '334155'
                          })
                        ]
                      })
                    ]
                  })
                : new TableCell({
                    width: { size: 49, type: WidthType.PERCENTAGE },
                    borders: NO_BORDERS,
                    children: [new Paragraph({ children: [] })]
                  });

            const spacerCell = new TableCell({
              width: { size: 2, type: WidthType.PERCENTAGE },
              borders: NO_BORDERS,
              children: [new Paragraph({ children: [] })]
            });

            cardRows.push(
              new TableRow({
                cantSplit: true,
                children: [buildCell(left), spacerCell, buildCell(right)]
              })
            );
            if (i + 2 < cv.competencies.length) {
              cardRows.push(
                new TableRow({
                  height: { value: 70, rule: HeightRule.EXACT },
                  children: [
                    new TableCell({ columnSpan: 3, borders: NO_BORDERS, children: [new Paragraph({ children: [] })] })
                  ]
                })
              );
            }
          }
          return [
            heading,
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: NO_BORDERS,
              rows: cardRows
            })
          ];
        } else {
          const compItems: (Paragraph | Table)[] = [createSectionHeading(titles.competencies)];
          cv.competencies.forEach((c) => {
            compItems.push(
              new Paragraph({
                spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
                indent: { left: 240, hanging: 180 },
                children: [
                  new TextRun({ text: '•  ', bold: true, size: m.fontSizeBody, font: primaryFont, color: '94A3B8' }),
                  new TextRun({ text: `${c.category}: `, bold: true, size: m.fontSizeBody, font: primaryFont, color: '0F172A' }),
                  new TextRun({ text: c.description, size: m.fontSizeBody, font: primaryFont, color: '1E293B' })
                ]
              })
            );
          });
          return compItems;
        }

      case 'experiences':
        if (!cv.experiences || cv.experiences.length === 0) return [];
        const expItems: (Paragraph | Table)[] = [createSectionHeading(titles.experiences)];
        cv.experiences.forEach((exp, expIdx) => {
          if (isTech) {
            // Tech Modern: Role @ Company (left) | [period] shaded badge (right)
            expItems.push(
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: NO_BORDERS,
                rows: [
                  new TableRow({
                    cantSplit: true,
                    children: [
                      new TableCell({
                        width: { size: 72, type: WidthType.PERCENTAGE },
                        borders: NO_BORDERS,
                        children: [
                          new Paragraph({
                            spacing: { before: expIdx === 0 ? 20 : m.itemBefore + 20, after: 20 },
                            keepNext: true,
                            children: [
                              new TextRun({
                                text: exp.role,
                                bold: true,
                                size: m.fontSizeBody + 1,
                                font: primaryFont,
                                color: '020617'
                              }),
                              new TextRun({
                                text: ` @ ${exp.company}`,
                                bold: true,
                                size: m.fontSizeBody + 0.5,
                                font: primaryFont,
                                color: '0F766E'
                              })
                            ]
                          })
                        ]
                      }),
                      new TableCell({
                        width: { size: 28, type: WidthType.PERCENTAGE },
                        borders: NO_BORDERS,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: expIdx === 0 ? 20 : m.itemBefore + 20, after: 20 },
                            keepNext: true,
                            children: [
                              new TextRun({
                                text: ` ${exp.period} `,
                                bold: true,
                                size: m.fontSizeSubtext - 0.5,
                                font: monoFont,
                                color: '475569',
                                shading: { fill: 'F1F5F9', type: ShadingType.CLEAR }
                              })
                            ]
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            );
          } else {
            // Standard 2-row header matching CVDocumentView lines 1611-1621:
            // Row 1: Company (left, bold) | Location (right, muted)
            // Row 2: Role (left, semibold, italic for Harvard) | Period (right, mono)
            expItems.push(
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: NO_BORDERS,
                rows: [
                  new TableRow({
                    cantSplit: true,
                    children: [
                      new TableCell({
                        width: { size: 68, type: WidthType.PERCENTAGE },
                        borders: NO_BORDERS,
                        children: [
                          new Paragraph({
                            spacing: { before: expIdx === 0 ? 20 : m.itemBefore + 20, after: 10 },
                            keepNext: true,
                            children: [
                              new TextRun({
                                text: exp.company,
                                bold: true,
                                size: m.fontSizeBody + 1,
                                font: primaryFont,
                                color: '020617'
                              })
                            ]
                          })
                        ]
                      }),
                      new TableCell({
                        width: { size: 32, type: WidthType.PERCENTAGE },
                        borders: NO_BORDERS,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: expIdx === 0 ? 20 : m.itemBefore + 20, after: 10 },
                            keepNext: true,
                            children: [
                              new TextRun({
                                text: exp.location || '',
                                size: m.fontSizeSubtext,
                                font: primaryFont,
                                color: '64748B'
                              })
                            ]
                          })
                        ]
                      })
                    ]
                  }),
                  new TableRow({
                    cantSplit: true,
                    children: [
                      new TableCell({
                        width: { size: 68, type: WidthType.PERCENTAGE },
                        borders: NO_BORDERS,
                        children: [
                          new Paragraph({
                            spacing: { before: 0, after: 25 },
                            keepNext: true,
                            children: [
                              new TextRun({
                                text: exp.role,
                                bold: true,
                                italics: isHarvard,
                                size: m.fontSizeBody,
                                font: primaryFont,
                                color: '1E293B'
                              })
                            ]
                          })
                        ]
                      }),
                      new TableCell({
                        width: { size: 32, type: WidthType.PERCENTAGE },
                        borders: NO_BORDERS,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 0, after: 25 },
                            keepNext: true,
                            children: [
                              new TextRun({
                                text: exp.period || '',
                                size: m.fontSizeSubtext,
                                font: monoFont,
                                color: '475569'
                              })
                            ]
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            );
          }

          if (exp.donor) {
            expItems.push(
              new Paragraph({
                spacing: { after: 25 },
                keepNext: true,
                children: [
                  new TextRun({
                    text: exp.donor,
                    italics: true,
                    size: m.fontSizeSubtext,
                    font: primaryFont,
                    color: '475569'
                  })
                ]
              })
            );
          }

          exp.highlights.forEach((h) => {
            if (!h.trim()) return;
            expItems.push(
              new Paragraph({
                spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
                indent: { left: 240, hanging: 180 },
                children: [
                  new TextRun({
                    text: isTech ? '>  ' : '•  ',
                    bold: true,
                    size: m.fontSizeBody,
                    font: isTech ? monoFont : primaryFont,
                    color: isTech ? '0D9488' : '94A3B8'
                  }),
                  new TextRun({
                    text: h,
                    size: m.fontSizeBody - 0.5,
                    font: primaryFont,
                    color: '1E293B'
                  })
                ]
              })
            );
          });
        });
        return expItems;

      case 'educations':
        if (!cv.educations || cv.educations.length === 0) return [];
        const eduItems: (Paragraph | Table)[] = [createSectionHeading(titles.educations)];
        cv.educations.forEach((edu, idx) => {
          eduItems.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: NO_BORDERS,
              rows: [
                new TableRow({
                  cantSplit: true,
                  children: [
                    new TableCell({
                      width: { size: 75, type: WidthType.PERCENTAGE },
                      borders: NO_BORDERS,
                      children: [
                        new Paragraph({
                          spacing: { before: idx === 0 ? 15 : m.itemBefore, after: 20 },
                          children: [
                            new TextRun({
                              text: edu.degree,
                              bold: true,
                              size: m.fontSizeBody,
                              font: primaryFont,
                              color: '020617'
                            }),
                            new TextRun({
                              text: ` — ${edu.institution}`,
                              size: m.fontSizeBody,
                              font: primaryFont,
                              color: '1E293B'
                            }),
                            ...(edu.gpaOrHonors
                              ? [
                                  new TextRun({
                                    text: ` (${edu.gpaOrHonors})`,
                                    italics: true,
                                    size: m.fontSizeSubtext,
                                    font: serifFont,
                                    color: '475569'
                                  })
                                ]
                              : [])
                          ]
                        })
                      ]
                    }),
                    new TableCell({
                      width: { size: 25, type: WidthType.PERCENTAGE },
                      borders: NO_BORDERS,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          spacing: { before: idx === 0 ? 15 : m.itemBefore, after: 20 },
                          children: [
                            new TextRun({
                              text: edu.period || '',
                              size: m.fontSizeSubtext,
                              font: monoFont,
                              color: '475569'
                            })
                          ]
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          );
        });
        return eduItems;

      case 'trainings':
        if (!cv.trainings || cv.trainings.length === 0) return [];
        const trainItems: (Paragraph | Table)[] = [createSectionHeading(titles.trainings)];
        cv.trainings.forEach((t) => {
          trainItems.push(
            new Paragraph({
              spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
              indent: { left: 240, hanging: 180 },
              children: [
                new TextRun({ text: '•  ', bold: true, size: m.fontSizeBody, font: primaryFont, color: '94A3B8' }),
                new TextRun({ text: t, size: m.fontSizeBody - 0.5, font: primaryFont, color: '1E293B' })
              ]
            })
          );
        });
        return trainItems;

      case 'languages':
        if (!cv.languages || cv.languages.length === 0) return [];
        const langRuns: TextRun[] = [];
        cv.languages.forEach((l, idx) => {
          langRuns.push(
            new TextRun({
              text: `• ${l.language}: `,
              bold: true,
              size: m.fontSizeBody - 0.5,
              font: primaryFont,
              color: '020617'
            }),
            new TextRun({
              text: l.level,
              size: m.fontSizeBody - 0.5,
              font: primaryFont,
              color: '334155'
            })
          );
          if (isEuropass) {
            langRuns.push(
              new TextRun({
                text: ` ${formatCefrBadge(l.level)}`,
                bold: true,
                size: m.fontSizeSubtext - 1,
                font: monoFont,
                color: '1E40AF',
                shading: { fill: 'DBEAFE', type: ShadingType.CLEAR }
              })
            );
          }
          if (idx < cv.languages.length - 1) {
            langRuns.push(
              new TextRun({
                text: '     ',
                size: m.fontSizeBody - 0.5,
                font: primaryFont
              })
            );
          }
        });
        return [
          createSectionHeading(titles.languages),
          new Paragraph({ spacing: { after: m.summaryAfter, line: m.lineSpacing }, children: langRuns })
        ];

      case 'references':
        if (!cv.references || cv.references.length === 0) return [];
        return [
          createSectionHeading(titles.references),
          buildReferencesTable(cv, m, primaryFont, monoFont, titles)
        ];

      default:
        return [];
    }
  }

  const effectiveOrder: CVSectionKey[] =
    cv.sectionOrder && cv.sectionOrder.length > 0 ? cv.sectionOrder : DEFAULT_SECTION_ORDER;

  effectiveOrder.forEach((secKey) => {
    children.push(...renderSection(secKey));
  });

  return new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: A4_WIDTH_TWIP, height: A4_HEIGHT_TWIP },
            margin: {
              top: m.pageMarginTop,
              bottom: m.pageMarginBottom,
              left: m.pageMarginLeft,
              right: m.pageMarginRight
            }
          }
        },
        children
      }
    ]
  });
}

// ============================================================================
// CREATIVE SPLIT TWO-COLUMN ENGINE (Full-bleed colored sidebar matching screen)
// ============================================================================
function buildCreativeSplitDoc(
  cv: CVData,
  hasActivePlan: boolean,
  COLOR_PRIMARY: string,
  photoBytes: { data: Uint8Array; type: 'png' | 'jpg' } | null,
  density: 'compact' | 'normal' | 'relaxed',
  lang: LanguageCode
): Document {
  const FONT = 'Calibri';
  const MONO = 'Consolas';
  const SIDEBAR_BG = COLOR_PRIMARY || '0F172A';
  const CARD_BG = blendHexWithWhite(SIDEBAR_BG, 0.12);
  const DIVIDER_COLOR = blendHexLighter(SIDEBAR_BG, 0.28);
  const titles = getResolvedSectionTitles(lang, 'creative_split');
  const m = getSpacingMetrics(density);

  const sidebarElements: Paragraph[] = [];

  if (photoBytes) {
    sidebarElements.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 40, after: 140 },
        children: [
          new ImageRun({
            data: photoBytes.data,
            transformation: { width: 96, height: 96 },
            type: photoBytes.type
          })
        ]
      })
    );
  } else {
    sidebarElements.push(
      new Paragraph({
        spacing: { before: 20, after: 120 },
        children: [
          new TextRun({
            text: ` ${titles.chrome.creativeTag.toUpperCase()} `,
            bold: true,
            size: 15,
            font: FONT,
            color: 'FFFFFF',
            shading: { fill: CARD_BG, type: ShadingType.CLEAR }
          })
        ]
      })
    );
  }

  sidebarElements.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 30 },
      children: [
        new TextRun({
          text: (cv.personalDetails.name || 'SEU NOME').toUpperCase(),
          bold: true,
          size: m.fontSizeTitle - 4,
          font: FONT,
          color: 'FFFFFF'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 150 },
      children: [
        new TextRun({
          text: cv.personalDetails.title || '',
          size: m.fontSizeSubtitle - 1,
          font: FONT,
          color: 'E2E8F0'
        })
      ]
    }),
    new Paragraph({
      spacing: { before: 60, after: 55 },
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: DIVIDER_COLOR, space: 8 } },
      children: [
        new TextRun({
          text: titles.chrome.contactsLabel.toUpperCase(),
          bold: true,
          size: 15,
          font: FONT,
          color: 'CBD5E1'
        })
      ]
    })
  );

  const contactEntries: { label: string; value?: string; mono?: boolean }[] = [
    { label: titles.chrome.locationLabel, value: cv.personalDetails.location },
    { label: titles.chrome.phoneLabel, value: cv.personalDetails.phone, mono: true },
    { label: titles.chrome.emailLabel, value: cv.personalDetails.email },
    { label: 'LinkedIn', value: cv.personalDetails.linkedin },
    { label: titles.chrome.websiteLabel, value: cv.personalDetails.website }
  ];

  contactEntries.forEach((entry) => {
    if (!entry.value) return;
    sidebarElements.push(
      new Paragraph({
        spacing: { before: 25, after: 0 },
        children: [
          new TextRun({
            text: entry.label,
            size: 14,
            font: FONT,
            color: 'CBD5E1'
          })
        ]
      }),
      new Paragraph({
        spacing: { before: 0, after: 45 },
        children: [
          new TextRun({
            text: entry.value,
            size: m.fontSizeSubtext - 0.5,
            font: entry.mono ? MONO : FONT,
            color: 'FFFFFF'
          })
        ]
      })
    );
  });

  if (isSecVisible(cv, 'competencies') && cv.competencies && cv.competencies.length > 0) {
    sidebarElements.push(
      new Paragraph({
        spacing: { before: 110, after: 60 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: DIVIDER_COLOR, space: 8 } },
        children: [
          new TextRun({
            text: titles.chrome.skillsShort.toUpperCase(),
            bold: true,
            size: 15,
            font: FONT,
            color: 'CBD5E1'
          })
        ]
      })
    );
    cv.competencies.forEach((c) => {
      sidebarElements.push(
        new Paragraph({
          spacing: { before: 20, after: 45, line: 255 },
          shading: { fill: CARD_BG, type: ShadingType.CLEAR },
          border: {
            top: { style: BorderStyle.SINGLE, size: 6, color: CARD_BG },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: CARD_BG },
            left: { style: BorderStyle.SINGLE, size: 6, color: CARD_BG },
            right: { style: BorderStyle.SINGLE, size: 6, color: CARD_BG }
          },
          children: [
            new TextRun({
              text: `${c.category}\n`,
              bold: true,
              size: m.fontSizeSubtext,
              font: FONT,
              color: 'FFFFFF'
            }),
            new TextRun({
              text: c.description,
              size: m.fontSizeSubtext - 1,
              font: FONT,
              color: 'E2E8F0'
            })
          ]
        })
      );
    });
  }

  if (isSecVisible(cv, 'languages') && cv.languages && cv.languages.length > 0) {
    sidebarElements.push(
      new Paragraph({
        spacing: { before: 110, after: 55 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: DIVIDER_COLOR, space: 8 } },
        children: [
          new TextRun({
            text: titles.chrome.languagesShort.toUpperCase(),
            bold: true,
            size: 15,
            font: FONT,
            color: 'CBD5E1'
          })
        ]
      })
    );
    cv.languages.forEach((l) => {
      sidebarElements.push(
        new Paragraph({
          spacing: { after: 30 },
          children: [
            new TextRun({ text: `${l.language}: `, bold: true, size: m.fontSizeSubtext, font: FONT, color: 'FFFFFF' }),
            new TextRun({ text: l.level, size: m.fontSizeSubtext - 0.5, font: FONT, color: 'E2E8F0' })
          ]
        })
      );
    });
  }

  sidebarElements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 220, after: 0 },
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: DIVIDER_COLOR, space: 8 } },
      children: [
        new TextRun({
          text: titles.chrome.creativeFooter,
          size: 14,
          font: FONT,
          color: 'CBD5E1'
        })
      ]
    })
  );

  // Right Main Column (65% width) matching CVDocumentView lines 1156-1288
  const mainElements: (Paragraph | Table)[] = [];

  if (!hasActivePlan) {
    mainElements.push(createWatermarkNotice(FONT));
  }

  function createCreativeHeading(title: string): Paragraph {
    return new Paragraph({
      spacing: { before: mainElements.length === 0 ? 20 : m.sectionBefore, after: m.sectionAfter },
      keepNext: true,
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 12, color: SIDEBAR_BG, space: 4 }
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: m.fontSizeHeading - 1,
          font: FONT,
          color: SIDEBAR_BG
        })
      ]
    });
  }

  function renderCreativeMainSection(key: CVSectionKey): (Paragraph | Table)[] {
    if (!isSecVisible(cv, key)) return [];
    switch (key) {
      case 'summary':
        if (!cv.summary) return [];
        return [
          createCreativeHeading(titles.summary),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: m.summaryAfter, line: m.lineSpacing },
            children: [
              new TextRun({ text: cv.summary, size: m.fontSizeBody - 0.5, font: FONT, color: '1E293B' })
            ]
          })
        ];

      case 'experiences':
        if (!cv.experiences || cv.experiences.length === 0) return [];
        const expItems: (Paragraph | Table)[] = [createCreativeHeading(titles.experiences)];
        cv.experiences.forEach((exp, idx) => {
          expItems.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: NO_BORDERS,
              rows: [
                new TableRow({
                  cantSplit: true,
                  children: [
                    new TableCell({
                      width: { size: 68, type: WidthType.PERCENTAGE },
                      borders: {
                        ...NO_BORDERS,
                        left: { style: BorderStyle.SINGLE, size: 10, color: 'E2E8F0' }
                      },
                      margins: { left: 110, top: idx === 0 ? 10 : 70 },
                      children: [
                        new Paragraph({
                          spacing: { after: 10 },
                          keepNext: true,
                          children: [
                            new TextRun({
                              text: exp.company,
                              bold: true,
                              size: m.fontSizeBody + 0.5,
                              font: FONT,
                              color: '0F172A'
                            })
                          ]
                        })
                      ]
                    }),
                    new TableCell({
                      width: { size: 32, type: WidthType.PERCENTAGE },
                      borders: NO_BORDERS,
                      margins: { top: idx === 0 ? 10 : 70 },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          spacing: { after: 10 },
                          keepNext: true,
                          children: [
                            new TextRun({
                              text: exp.period,
                              size: m.fontSizeSubtext - 0.5,
                              font: MONO,
                              color: '64748B'
                            })
                          ]
                        })
                      ]
                    })
                  ]
                })
              ]
            }),
            new Paragraph({
              spacing: { after: 20 },
              keepNext: true,
              indent: { left: 110 },
              border: { left: { style: BorderStyle.SINGLE, size: 10, color: 'E2E8F0', space: 7 } },
              children: [
                new TextRun({
                  text: `${exp.role}${exp.location ? ` · ${exp.location}` : ''}`,
                  bold: true,
                  size: m.fontSizeSubtext,
                  font: FONT,
                  color: SIDEBAR_BG
                })
              ]
            })
          );

          if (exp.donor) {
            expItems.push(
              new Paragraph({
                spacing: { after: 15 },
                indent: { left: 110 },
                border: { left: { style: BorderStyle.SINGLE, size: 10, color: 'E2E8F0', space: 7 } },
                children: [
                  new TextRun({
                    text: exp.donor,
                    italics: true,
                    size: m.fontSizeSubtext - 0.5,
                    font: FONT,
                    color: '64748B'
                  })
                ]
              })
            );
          }

          exp.highlights.forEach((h, hIdx) => {
            if (!h.trim()) return;
            expItems.push(
              new Paragraph({
                spacing: { before: 0, after: hIdx === exp.highlights.length - 1 ? m.bulletAfter + 35 : m.bulletAfter, line: m.lineSpacing - 10 },
                indent: { left: 260, hanging: 140 },
                border: { left: { style: BorderStyle.SINGLE, size: 10, color: 'E2E8F0', space: 7 } },
                children: [
                  new TextRun({ text: '• ', bold: true, size: m.fontSizeSubtext, font: FONT, color: '94A3B8' }),
                  new TextRun({ text: h, size: m.fontSizeSubtext + 0.5, font: FONT, color: '334155' })
                ]
              })
            );
          });
        });
        return expItems;

      case 'educations':
        if (!cv.educations || cv.educations.length === 0) return [];
        const eduItems: (Paragraph | Table)[] = [createCreativeHeading(titles.educations)];
        cv.educations.forEach((edu) => {
          eduItems.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: NO_BORDERS,
              rows: [
                new TableRow({
                  cantSplit: true,
                  children: [
                    new TableCell({
                      width: { size: 74, type: WidthType.PERCENTAGE },
                      borders: NO_BORDERS,
                      children: [
                        new Paragraph({
                          spacing: { before: 20, after: 20 },
                          children: [
                            new TextRun({ text: edu.degree, bold: true, size: m.fontSizeSubtext + 0.5, font: FONT, color: '0F172A' }),
                            new TextRun({ text: ` — ${edu.institution}`, size: m.fontSizeSubtext + 0.5, font: FONT, color: '475569' })
                          ]
                        })
                      ]
                    }),
                    new TableCell({
                      width: { size: 26, type: WidthType.PERCENTAGE },
                      borders: NO_BORDERS,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          spacing: { before: 20, after: 20 },
                          children: [
                            new TextRun({ text: edu.period, size: m.fontSizeSubtext - 0.5, font: MONO, color: '64748B' })
                          ]
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          );
        });
        return eduItems;

      case 'trainings':
        if (!cv.trainings || cv.trainings.length === 0) return [];
        const trItems: (Paragraph | Table)[] = [createCreativeHeading(titles.trainings)];
        cv.trainings.forEach((t) => {
          trItems.push(
            new Paragraph({
              spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing - 10 },
              indent: { left: 200, hanging: 150 },
              children: [
                new TextRun({ text: '• ', bold: true, size: m.fontSizeSubtext, font: FONT, color: '94A3B8' }),
                new TextRun({ text: t, size: m.fontSizeSubtext + 0.5, font: FONT, color: '334155' })
              ]
            })
          );
        });
        return trItems;

      case 'references':
        if (!cv.references || cv.references.length === 0) return [];
        const refItems: (Paragraph | Table)[] = [createCreativeHeading(titles.references)];
        cv.references.forEach((r) => {
          refItems.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: NO_BORDERS,
              rows: [
                new TableRow({
                  cantSplit: true,
                  children: [
                    new TableCell({
                      width: { size: 68, type: WidthType.PERCENTAGE },
                      borders: NO_BORDERS,
                      children: [
                        new Paragraph({
                          spacing: { before: 20, after: 20 },
                          children: [
                            new TextRun({ text: r.name, bold: true, size: m.fontSizeSubtext + 0.5, font: FONT, color: '0F172A' }),
                            new TextRun({ text: ` — ${r.institutionAndPosition}`, size: m.fontSizeSubtext + 0.5, font: FONT, color: '475569' })
                          ]
                        })
                      ]
                    }),
                    new TableCell({
                      width: { size: 32, type: WidthType.PERCENTAGE },
                      borders: NO_BORDERS,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          spacing: { before: 20, after: 20 },
                          children: [
                            new TextRun({ text: r.contact, size: m.fontSizeSubtext - 0.5, font: MONO, color: '64748B' })
                          ]
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          );
        });
        return refItems;

      default:
        return [];
    }
  }

  const effectiveOrder: CVSectionKey[] =
    cv.sectionOrder && cv.sectionOrder.length > 0 ? cv.sectionOrder : DEFAULT_SECTION_ORDER;

  effectiveOrder.forEach((secKey) => {
    mainElements.push(...renderCreativeMainSection(secKey));
  });

  if (mainElements.length === 0) {
    mainElements.push(new Paragraph({ children: [] }));
  }

  // Full-bleed edge-to-edge 35% / 65% table matching CVDocumentView lines 1031-1289
  const padSideV = density === 'compact' ? 380 : density === 'relaxed' ? 620 : 480;
  const padSideH = density === 'compact' ? 300 : density === 'relaxed' ? 460 : 380;
  const padMainV = density === 'compact' ? 400 : density === 'relaxed' ? 640 : 520;
  const padMainH = density === 'compact' ? 420 : density === 'relaxed' ? 620 : 520;

  const splitTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        height: { value: A4_HEIGHT_TWIP, rule: HeightRule.ATLEAST },
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            shading: { fill: SIDEBAR_BG, type: ShadingType.CLEAR },
            borders: NO_BORDERS,
            margins: { top: padSideV, bottom: padSideV, left: padSideH, right: padSideH },
            children: sidebarElements
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            borders: NO_BORDERS,
            margins: { top: padMainV, bottom: padMainV, left: padMainH, right: padMainH },
            children: mainElements
          })
        ]
      })
    ]
  });

  return new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: A4_WIDTH_TWIP, height: A4_HEIGHT_TWIP },
            margin: { top: 0, bottom: 0, left: 0, right: 0 }
          }
        },
        children: [splitTable]
      }
    ]
  });
}

// ============================================================================
// MAIN WORD EXPORT DISPATCHER (Resolves Template Style, Spacing Density, Lang & Photo)
// ============================================================================
export async function generateWordDocument(
  cv: CVData,
  hasActivePlan: boolean = true,
  density: 'compact' | 'normal' | 'relaxed' = 'normal',
  lang: LanguageCode = 'pt'
): Promise<Blob> {
  const COLOR_PRIMARY = cv.accentColor ? cv.accentColor.replace('#', '') : '0F172A';

  const hasPhotoEnabled = cv.personalDetails.showPhoto !== false && Boolean(cv.personalDetails.photoUrl);
  const photoBytes = hasPhotoEnabled ? await getPhotoBytes(cv.personalDetails.photoUrl) : null;

  const doc =
    cv.templateStyle === 'creative_split'
      ? buildCreativeSplitDoc(cv, hasActivePlan, COLOR_PRIMARY, photoBytes, density, lang)
      : buildSingleColumnCVDoc(cv, hasActivePlan, COLOR_PRIMARY, photoBytes, density, lang);

  return await Packer.toBlob(doc);
}

// ============================================================================
// COVER LETTER WORD EXPORT (1:1 Match with CoverLetterDocumentView.tsx A4 Sheet)
// ============================================================================
export async function generateCoverLetterDocx(
  cv: CVData,
  letterBody: string,
  hasActivePlan: boolean = true,
  lang: LanguageCode = 'pt'
): Promise<Blob> {
  const COLOR_DARK = '020617';
  const COLOR_SLATE = '1E293B';
  const COLOR_MUTED = '475569';
  const COLOR_LIGHT = '64748B';
  const SERIF_FONT = 'Times New Roman';
  const SANS_FONT = 'Calibri';
  const MONO_FONT = 'Consolas';

  const chrome = COVER_CHROME_LABELS[lang] || COVER_CHROME_LABELS.pt;
  const candidateName = cv.personalDetails.name || 'Seu Nome Completo';
  const candidateTitle = cv.personalDetails.title || 'Título Profissional Executivo';
  const candidateContacts = [
    cv.personalDetails.location,
    cv.personalDetails.phone,
    cv.personalDetails.email,
    cv.personalDetails.linkedin
  ]
    .filter(Boolean)
    .join('   |   ');

  const docChildren: Paragraph[] = [];

  if (!hasActivePlan) {
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        border: {
          bottom: { style: BorderStyle.DASHED, size: 6, color: 'DC2626', space: 4 },
          top: { style: BorderStyle.DASHED, size: 6, color: 'DC2626', space: 4 }
        },
        children: [
          new TextRun({
            text: '★ PRÉ-VISUALIZAÇÃO DEMONSTRATIVA · CARTA DE APRESENTAÇÃO ★',
            bold: true,
            size: 18,
            font: SANS_FONT,
            color: 'DC2626'
          }),
          new TextRun({
            text: '\n(Documento de demonstração com marca de água. Ative o plano Pro ou VIP para a versão oficial)',
            italics: true,
            size: 15,
            font: SANS_FONT,
            color: COLOR_LIGHT
          })
        ]
      })
    );
  }

  // Executive Formal Left-Aligned Letterhead matching CoverLetterDocumentView lines 318-335
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 35 },
      children: [
        new TextRun({
          text: candidateName.toUpperCase(),
          bold: true,
          size: 40, // 20pt matching text-3xl font-serif font-black
          font: SERIF_FONT,
          color: COLOR_DARK
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 75 },
      children: [
        new TextRun({
          text: candidateTitle.toUpperCase(),
          bold: true,
          size: 20, // 10pt matching text-sm font-semibold uppercase
          font: SANS_FONT,
          color: COLOR_MUTED
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 320 }, // mb-8 gap before letter body
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 16, // border-b-2 border-slate-900
          color: '0F172A',
          space: 12 // pb-5
        }
      },
      children: [
        new TextRun({
          text: candidateContacts,
          size: 17.5, // ~11px font-mono
          font: MONO_FONT,
          color: COLOR_LIGHT
        })
      ]
    })
  );

  // Preserve exact paragraph breaks and line structure matching whitespace-pre-line + sm:text-justify
  const isSubjectLine = (txt: string) =>
    /^(assunto|subject|asunto|objet|betreff)\s*:/i.test(txt);
  const isRecipientLine = (txt: string) =>
    /^(a\/c|para|to|an|à l'attention|a la atención)\s*:/i.test(txt);

  const rawBlocks = (letterBody || '').replace(/\r\n/g, '\n').split(/\n{2,}/);

  rawBlocks.forEach((block, blockIdx) => {
    const lines = block
      .split('\n')
      .map((l) => l.trimEnd())
      .filter((l) => l.trim().length > 0);
    if (lines.length === 0) return;

    const joinedSingle = lines.join(' ');
    const isFirstMetaBlock =
      blockIdx === 0 &&
      lines.some((l) => isRecipientLine(l.trim()) || isSubjectLine(l.trim()));
    const isShortStandalone = lines.length === 1 && joinedSingle.length < 75;
    const isSignatureBlock =
      blockIdx === rawBlocks.length - 1 ||
      (lines.length > 1 && lines.every((l) => l.trim().length < 75));

    if (isFirstMetaBlock || isSignatureBlock) {
      // Render each line cleanly preserving line breaks (recipient, subject, sign-off)
      lines.forEach((line, lIdx) => {
        const trimmed = line.trim();
        const isLastLineInBlock = lIdx === lines.length - 1;
        const isBoldLine = isSubjectLine(trimmed) || isRecipientLine(trimmed);
        docChildren.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: {
              before: 0,
              after: isLastLineInBlock ? 200 : 35,
              line: 300
            },
            children: [
              new TextRun({
                text: trimmed,
                bold: isBoldLine,
                size: 21, // ~10.5pt matching 14px serif
                font: SERIF_FONT,
                color: isBoldLine ? COLOR_DARK : COLOR_SLATE
              })
            ]
          })
        );
      });
    } else {
      // Standard narrative body paragraph (justified, airy 1.4x line spacing)
      const runs: TextRun[] = [];
      lines.forEach((line, lIdx) => {
        const trimmed = line.trim();
        runs.push(
          new TextRun({
            text: trimmed,
            bold: isSubjectLine(trimmed) || isRecipientLine(trimmed),
            size: 21,
            font: SERIF_FONT,
            color: COLOR_SLATE
          })
        );
        if (lIdx < lines.length - 1) {
          runs.push(new TextRun({ break: 1 }));
        }
      });

      docChildren.push(
        new Paragraph({
          alignment: isShortStandalone ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
          spacing: {
            before: 0,
            after: 200, // space-y-4 (1rem / ~10-12pt)
            line: 336 // leading-relaxed (1.4x in Word)
          },
          children: runs
        })
      );
    }
  });

  // Formal Footer Sign-Off matching CoverLetterDocumentView lines 344-347
  const footerBorderTop = { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' };
  const letterFooter = new Footer({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 65, type: WidthType.PERCENTAGE },
                borders: { ...NO_BORDERS, top: footerBorderTop },
                margins: { top: 120 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    children: [
                      new TextRun({
                        text: `${candidateName} · ${chrome.footerLabel}`,
                        size: 16,
                        font: MONO_FONT,
                        color: '94A3B8'
                      })
                    ]
                  })
                ]
              }),
              new TableCell({
                width: { size: 35, type: WidthType.PERCENTAGE },
                borders: { ...NO_BORDERS, top: footerBorderTop },
                margins: { top: 120 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        text: chrome.standardLabel,
                        size: 16,
                        font: MONO_FONT,
                        color: '94A3B8'
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: A4_WIDTH_TWIP, height: A4_HEIGHT_TWIP },
            margin: {
              top: convertMillimetersToTwip(22),
              bottom: convertMillimetersToTwip(22),
              left: convertMillimetersToTwip(25),
              right: convertMillimetersToTwip(25)
            }
          }
        },
        footers: {
          default: letterFooter
        },
        children: docChildren
      }
    ]
  });

  return await Packer.toBlob(doc);
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
