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
import { LanguageCode } from '../context/LanguageContext';
import { getTemplateById } from '../data/templateCatalog';
import {
  getResolvedSectionTitles,
  COVER_CHROME_LABELS,
  resolveTemplateStyleProfile,
  resolveEffectiveSectionOrder,
  getSurfaceContrastPalette,
  extractCefrGrade,
  EUROPASS_UI_LABELS,
  normalizeHex
} from './cvDocumentLabels';

const A4_WIDTH_TWIP = convertMillimetersToTwip(210);
const A4_HEIGHT_TWIP = convertMillimetersToTwip(297);

function isSecVisible(cv: CVData, key: CVSectionKey): boolean {
  return cv.sectionVisibility?.[key] !== false;
}

// Blend any 6-char hex color toward white (simulates translucent white/10 cards in Word cell shading)
function blendHexWithWhite(hex: string, whiteRatio: number): string {
  const full = normalizeHex(hex, '0F172A');
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
  const style: TemplateStyle = cv.templateStyle || 'modern_professional';
  const {
    isClassic,
    isHarvard,
    isStrictMonoAts,
    isEuropass,
    isTech,
    isMinimalist,
    isAcademic,
    isAcademicLattes,
    isModern,
    isFinance,
    isBoard,
    isProduct,
    isEditorial,
    isBlueprint,
    supportsPhoto
  } = resolveTemplateStyleProfile(style);

  const titles = getResolvedSectionTitles(lang, style);
  const m = getSpacingMetrics(density);

  // Fonts matching CSS: font-serif-cv / font-mono-code / font-jakarta
  const primaryFont =
    isHarvard || isAcademic || isClassic || isFinance || isBoard
      ? 'Times New Roman'
      : isStrictMonoAts
      ? 'Consolas'
      : 'Calibri';
  const serifFont = 'Times New Roman';
  const monoFont = 'Consolas';

  const customHeaderHex = cv.headerColor ? normalizeHex(cv.headerColor) : undefined;
  const customBarHex = cv.barColor ? normalizeHex(cv.barColor) : undefined;
  const effectiveHeaderBg = customHeaderHex || (isEditorial ? COLOR_PRIMARY : undefined);
  const headerContrast = effectiveHeaderBg ? getSurfaceContrastPalette(effectiveHeaderBg) : null;

  // Exact colors matching CVDocumentView.tsx
  const sectionHeadingColor =
    isHarvard || isStrictMonoAts || isFinance
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
    customBarHex ||
    (isHarvard || isFinance
      ? '0F172A'
      : isStrictMonoAts
      ? '94A3B8'
      : isTech
      ? '0D9488'
      : isEuropass
      ? '003399'
      : isMinimalist
      ? 'E2E8F0'
      : isAcademic
      ? '0F172A'
      : isClassic || isBoard
      ? 'CBD5E1'
      : COLOR_PRIMARY);

  const nameColor = headerContrast
    ? headerContrast.textHex
    : isEuropass
    ? '003399'
    : isStrictMonoAts || isFinance
    ? '0F172A'
    : COLOR_PRIMARY;

  const effectivePhoto = supportsPhoto ? photoBytes : null;

  const children: (Paragraph | Table)[] = [];

  if (!hasActivePlan) {
    children.push(createWatermarkNotice(primaryFont));
  }

  // Academic Lattes full-width boxed banner matching CVDocumentView
  if (isAcademicLattes) {
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
  const headerAlign = isClassic || isBoard ? AlignmentType.CENTER : AlignmentType.LEFT;
  const headerTextParagraphs: Paragraph[] = [];

  if (isTech) {
    headerTextParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 45 },
        children: [
          new TextRun({
            text: style === 'data_science_ai' ? '// DATA SCIENCE, ANALYTICS & AI' : '// TECH & SOFTWARE ENGINEERING',
            bold: true,
            size: 17,
            font: monoFont,
            color: '0F766E'
          })
        ]
      })
    );
  } else if (isBlueprint) {
    headerTextParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 45 },
        children: [
          new TextRun({
            text: 'SYSTEMS ARCHITECTURE · PRINCIPAL ENGINEERING',
            bold: true,
            size: 15.5,
            font: monoFont,
            color: COLOR_PRIMARY
          })
        ]
      })
    );
  } else if (isFinance) {
    headerTextParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: 'INSTITUTIONAL FINANCE & M&A STANDARD',
            bold: true,
            size: 15,
            font: serifFont,
            color: '64748B'
          })
        ]
      })
    );
  } else if (isBoard || customBarHex) {
    headerTextParagraphs.push(
      new Paragraph({
        alignment: headerAlign,
        spacing: { after: 45 },
        border: { top: { style: BorderStyle.SINGLE, size: 18, color: customBarHex || COLOR_PRIMARY, space: 6 } },
        children: isBoard
          ? [
              new TextRun({
                text: 'BOARD OF DIRECTORS & C-SUITE GOVERNANCE',
                bold: true,
                size: 15.5,
                font: serifFont,
                color: headerContrast ? headerContrast.subtleHex : '64748B'
              })
            ]
          : []
      })
    );
  } else if (isProduct) {
    headerTextParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: 'PRODUCT STRATEGY & GROWTH LEADERSHIP',
            bold: true,
            size: 15.5,
            font: primaryFont,
            color: COLOR_PRIMARY
          })
        ]
      })
    );
  } else if (isEditorial) {
    headerTextParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: 'EXECUTIVE EDITORIAL PROFILE',
            bold: true,
            size: 15,
            font: primaryFont,
            color: 'E2E8F0'
          })
        ]
      })
    );
  } else if (style === 'hybrid_minimalist') {
    headerTextParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: 'CURRICULUM VITAE · NORDIC EDITION',
            bold: true,
            size: 15.5,
            font: monoFont,
            color: '94A3B8'
          })
        ]
      })
    );
  } else if (isStrictMonoAts) {
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
            text: 'INTERNATIONAL GOVERNANCE & PROGRAMS STANDARD',
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
          text: (cv.personalDetails.name || 'YOUR FULL NAME').toUpperCase(),
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
            italics: isHarvard || isBoard,
            size: isTech ? m.fontSizeSubtitle - 1 : m.fontSizeSubtitle,
            font: isTech ? monoFont : primaryFont,
            color: headerContrast
              ? headerContrast.mutedHex
              : isTech
              ? '0F766E'
              : isHarvard || isBoard
              ? '334155'
              : '1E293B'
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

  const headerHasBottomBorder =
    !headerContrast &&
    (isModern || isHarvard || isEuropass || isTech || isClassic || isFinance || isBoard || isProduct || isBlueprint);
  const headerBorderSpec = isFinance
    ? { style: BorderStyle.DOUBLE, size: 12, color: customBarHex || '0F172A', space: 8 }
    : isModern || isHarvard || isEuropass || isTech || isProduct || isBlueprint
    ? {
        style: BorderStyle.SINGLE,
        size: 12,
        color: customBarHex || (isTech ? '0D9488' : isEuropass ? '003399' : isHarvard ? '0F172A' : COLOR_PRIMARY),
        space: 8
      }
    : isClassic || isBoard
    ? { style: BorderStyle.SINGLE, size: 6, color: customBarHex || 'E2E8F0', space: 8 }
    : undefined;

  headerTextParagraphs.push(
    new Paragraph({
      alignment: headerAlign,
      spacing: { after: effectivePhoto || headerContrast ? 0 : m.headerAfter },
      border: !effectivePhoto && !headerContrast && headerHasBottomBorder ? { bottom: headerBorderSpec } : undefined,
      children: [
        new TextRun({
          text: contactLineText,
          size: m.fontSizeSubtext,
          font: primaryFont,
          color: headerContrast ? headerContrast.mutedHex : '475569'
        })
      ]
    })
  );

  if (headerContrast && effectiveHeaderBg) {
    const editorialCells: TableCell[] = [
      new TableCell({
        width: { size: effectivePhoto ? 78 : 100, type: WidthType.PERCENTAGE },
        shading: { fill: effectiveHeaderBg, type: ShadingType.CLEAR },
        borders: NO_BORDERS,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 180, bottom: 180, left: 200, right: 160 },
        children: headerTextParagraphs
      })
    ];
    if (effectivePhoto) {
      editorialCells.push(
        new TableCell({
          width: { size: 22, type: WidthType.PERCENTAGE },
          shading: { fill: effectiveHeaderBg, type: ShadingType.CLEAR },
          borders: NO_BORDERS,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 180, bottom: 180, left: 60, right: 180 },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 0 },
              children: [
                new ImageRun({
                  data: effectivePhoto.data,
                  transformation: { width: 88, height: 88 },
                  type: effectivePhoto.type
                })
              ]
            })
          ]
        })
      );
    }
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        rows: [new TableRow({ children: editorialCells })]
      })
    );
    children.push(new Paragraph({ spacing: { before: 0, after: m.headerAfter - 40 }, children: [] }));
  } else if (effectivePhoto) {
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
    } else if (isBlueprint) {
      runs.push(
        new TextRun({
          text: `0${idx + 1}. `,
          bold: true,
          size: m.fontSizeHeading - 1.5,
          font: monoFont,
          color: COLOR_PRIMARY
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

    const borderSize = isTech || isEuropass || isProduct || isEditorial ? 12 : 6;

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
        if (isTech || isProduct || isBlueprint) {
          // 2-column bordered card grid matching CVDocumentView
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
                            font: isTech || isBlueprint ? monoFont : primaryFont,
                            color: isTech ? '115E59' : COLOR_PRIMARY
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
          if (isTech || isBlueprint) {
            // Tech / Blueprint: Role @ Company (left) | [period] shaded badge (right)
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
                                color: isTech ? '0F766E' : COLOR_PRIMARY
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
            // Row 2: Role (left, semibold, italic for Harvard/Board/Finance) | Period (right, mono)
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
                                italics: isHarvard || isBoard || isFinance,
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

  const effectiveOrder: CVSectionKey[] = resolveEffectiveSectionOrder(cv);

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
  const SIDEBAR_BG = cv.barColor ? normalizeHex(cv.barColor) : COLOR_PRIMARY || '0F172A';
  const sideContrast = getSurfaceContrastPalette(SIDEBAR_BG);
  const CARD_BG = sideContrast.cardHex;
  const DIVIDER_COLOR = sideContrast.borderHex;
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
            color: sideContrast.textHex,
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
          color: sideContrast.textHex
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
          color: sideContrast.mutedHex
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
          color: sideContrast.subtleHex
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
            color: sideContrast.subtleHex
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
            color: sideContrast.textHex
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
            color: sideContrast.subtleHex
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
              color: sideContrast.textHex
            }),
            new TextRun({
              text: c.description,
              size: m.fontSizeSubtext - 1,
              font: FONT,
              color: sideContrast.mutedHex
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
            color: sideContrast.subtleHex
          })
        ]
      })
    );
    cv.languages.forEach((l) => {
      sidebarElements.push(
        new Paragraph({
          spacing: { after: 30 },
          children: [
            new TextRun({ text: `${l.language}: `, bold: true, size: m.fontSizeSubtext, font: FONT, color: sideContrast.textHex }),
            new TextRun({ text: l.level, size: m.fontSizeSubtext - 0.5, font: FONT, color: sideContrast.mutedHex })
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
          color: sideContrast.subtleHex
        })
      ]
    })
  );

  // Right Main Column (65% width) matching CVDocumentView lines 1156-1288
  const mainElements: (Paragraph | Table)[] = [];

  if (!hasActivePlan) {
    mainElements.push(createWatermarkNotice(FONT));
  }

  if (cv.headerColor) {
    const hdrHex = normalizeHex(cv.headerColor);
    const hdrContrast = getSurfaceContrastPalette(hdrHex);
    mainElements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 100, type: WidthType.PERCENTAGE },
                shading: { fill: hdrHex, type: ShadingType.CLEAR },
                borders: NO_BORDERS,
                margins: { top: 110, bottom: 110, left: 150, right: 150 },
                children: [
                  new Paragraph({
                    spacing: { after: 15 },
                    children: [
                      new TextRun({
                        text: cv.personalDetails.title || '',
                        bold: true,
                        size: 16,
                        font: FONT,
                        color: hdrContrast.subtleHex
                      })
                    ]
                  }),
                  new Paragraph({
                    spacing: { after: 0 },
                    children: [
                      new TextRun({
                        text: (cv.personalDetails.name || '').toUpperCase(),
                        bold: true,
                        size: m.fontSizeTitle - 8,
                        font: FONT,
                        color: hdrContrast.textHex
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

  function createCreativeHeading(title: string): Paragraph {
    const headingAccent = COLOR_PRIMARY || SIDEBAR_BG;
    return new Paragraph({
      spacing: { before: mainElements.length === 0 ? 20 : m.sectionBefore, after: m.sectionAfter },
      keepNext: true,
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 12, color: headingAccent, space: 4 }
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: m.fontSizeHeading - 1,
          font: FONT,
          color: headingAccent
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

  const effectiveOrder: CVSectionKey[] = resolveEffectiveSectionOrder(cv);

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
// EUROPASS VARIANT 1: SIDEBAR (Left Shaded Column + Right Timeline)
// ============================================================================
function resolveEuropassAccent(cv: CVData, COLOR_PRIMARY: string): string {
  const meta = getTemplateById(cv.templateStyle);
  return COLOR_PRIMARY !== '0F172A' ? COLOR_PRIMARY : normalizeHex(meta.accentColor, '1D4ED8');
}

function buildEuropassSidebarDoc(
  cv: CVData,
  hasActivePlan: boolean,
  COLOR_PRIMARY: string,
  photoBytes: { data: Uint8Array; type: 'png' | 'jpg' } | null,
  density: 'compact' | 'normal' | 'relaxed',
  lang: LanguageCode
): Document {
  const FONT = 'Calibri';
  const MONO = 'Consolas';
  const europassAccent = resolveEuropassAccent(cv, COLOR_PRIMARY);
  const asideBg = cv.barColor ? normalizeHex(cv.barColor) : 'ECEEF1';
  const asideContrast = getSurfaceContrastPalette(asideBg);
  const titles = getResolvedSectionTitles(lang, cv.templateStyle);
  const euroLabels = EUROPASS_UI_LABELS[lang] || EUROPASS_UI_LABELS.en;
  const m = getSpacingMetrics(density);

  const sidebarElements: Paragraph[] = [];

  if (photoBytes) {
    sidebarElements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 30, after: 120 },
        children: [
          new ImageRun({
            data: photoBytes.data,
            transformation: { width: 92, height: 92 },
            type: photoBytes.type
          })
        ]
      })
    );
  }

  sidebarElements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 35 },
      children: [
        new TextRun({
          text: cv.personalDetails.name || 'SEU NOME',
          bold: true,
          size: m.fontSizeTitle - 6,
          font: FONT,
          color: asideContrast.textHex
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 10, after: 40 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: asideContrast.subtleHex, space: 4 }
      },
      children: [new TextRun({ text: '      ', size: 8, font: FONT })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 140 },
      children: [
        new TextRun({
          text: cv.personalDetails.title || '',
          bold: true,
          size: m.fontSizeSubtext,
          font: FONT,
          color: asideContrast.mutedHex
        })
      ]
    }),
    new Paragraph({
      spacing: { before: 60, after: 55 },
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: asideContrast.borderHex, space: 8 } },
      children: [
        new TextRun({
          text: euroLabels.contact.toUpperCase(),
          bold: true,
          size: 16,
          font: FONT,
          color: asideContrast.textHex
        })
      ]
    })
  );

  const contactItems = [
    cv.personalDetails.location,
    cv.personalDetails.email,
    cv.personalDetails.phone,
    cv.personalDetails.website,
    cv.personalDetails.linkedin
  ].filter(Boolean);

  contactItems.forEach((val) => {
    sidebarElements.push(
      new Paragraph({
        spacing: { after: 45, line: 240 },
        children: [
          new TextRun({
            text: `▪  `,
            bold: true,
            size: 14,
            font: FONT,
            color: asideContrast.isLight ? europassAccent : asideContrast.textHex
          }),
          new TextRun({
            text: val!,
            size: m.fontSizeSubtext - 0.5,
            font: FONT,
            color: asideContrast.mutedHex
          })
        ]
      })
    );
  });

  if (isSecVisible(cv, 'competencies') && cv.competencies && cv.competencies.length > 0) {
    sidebarElements.push(
      new Paragraph({
        spacing: { before: 110, after: 55 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: asideContrast.borderHex, space: 8 } },
        children: [
          new TextRun({
            text: titles.competencies.toUpperCase(),
            bold: true,
            size: 16,
            font: FONT,
            color: asideContrast.textHex
          })
        ]
      })
    );
    cv.competencies.forEach((c) => {
      sidebarElements.push(
        new Paragraph({
          spacing: { before: 20, after: 50, line: 245 },
          children: [
            new TextRun({
              text: `${c.category}\n`,
              bold: true,
              size: m.fontSizeSubtext - 0.5,
              font: FONT,
              color: asideContrast.textHex
            }),
            new TextRun({
              text: c.description,
              size: m.fontSizeSubtext - 1.5,
              font: FONT,
              color: asideContrast.mutedHex
            })
          ]
        })
      );
    });
  }

  const mainElements: (Paragraph | Table)[] = [];
  if (!hasActivePlan) {
    mainElements.push(createWatermarkNotice(FONT));
  }

  if (cv.headerColor) {
    const hdrHex = normalizeHex(cv.headerColor);
    const hdrContrast = getSurfaceContrastPalette(hdrHex);
    mainElements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 100, type: WidthType.PERCENTAGE },
                shading: { fill: hdrHex, type: ShadingType.CLEAR },
                borders: NO_BORDERS,
                margins: { top: 90, bottom: 90, left: 130, right: 130 },
                children: [
                  new Paragraph({
                    spacing: { after: 15 },
                    children: [
                      new TextRun({
                        text: cv.personalDetails.name || '',
                        bold: true,
                        size: m.fontSizeTitle - 8,
                        font: FONT,
                        color: hdrContrast.textHex
                      })
                    ]
                  }),
                  new Paragraph({
                    spacing: { after: 0 },
                    children: [
                      new TextRun({
                        text: cv.personalDetails.title || '',
                        size: m.fontSizeSubtext,
                        font: FONT,
                        color: hdrContrast.mutedHex
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

  const createHeading = (label: string) =>
    new Paragraph({
      spacing: { before: mainElements.length === 0 ? 10 : m.sectionBefore - 20, after: m.sectionAfter },
      keepNext: true,
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 8, color: europassAccent, space: 4 }
      },
      children: [
        new TextRun({
          text: label.toUpperCase(),
          bold: true,
          size: m.fontSizeHeading - 1.5,
          font: FONT,
          color: '1E293B'
        })
      ]
    });

  const effectiveOrder = resolveEffectiveSectionOrder(cv);
  effectiveOrder.forEach((key) => {
    if (!isSecVisible(cv, key) || key === 'competencies') return;

    if (key === 'summary' && cv.summary) {
      mainElements.push(
        createHeading(euroLabels.aboutMyself),
        new Paragraph({
          spacing: { after: m.summaryAfter, line: m.lineSpacing },
          children: [new TextRun({ text: cv.summary, size: m.fontSizeBody - 0.5, font: FONT, color: '334155' })]
        })
      );
    } else if (key === 'experiences' && cv.experiences.length > 0) {
      mainElements.push(createHeading(titles.experiences));
      cv.experiences.forEach((exp, idx) => {
        mainElements.push(
          new Paragraph({
            spacing: { before: idx === 0 ? 15 : 85, after: 15 },
            keepNext: true,
            indent: { left: 140 },
            border: { left: { style: BorderStyle.SINGLE, size: 8, color: 'E2E8F0', space: 8 } },
            children: [
              new TextRun({ text: '● ', bold: true, size: 14, font: FONT, color: europassAccent }),
              new TextRun({
                text: `${exp.period}${exp.location ? ` – ${exp.location}` : ''}`.toUpperCase(),
                bold: true,
                size: 16,
                font: FONT,
                color: europassAccent
              })
            ]
          }),
          new Paragraph({
            spacing: { after: 10 },
            keepNext: true,
            indent: { left: 140 },
            border: { left: { style: BorderStyle.SINGLE, size: 8, color: 'E2E8F0', space: 8 } },
            children: [
              new TextRun({ text: exp.role, bold: true, size: m.fontSizeBody, font: FONT, color: '0F172A' })
            ]
          }),
          new Paragraph({
            spacing: { after: 25 },
            keepNext: true,
            indent: { left: 140 },
            border: { left: { style: BorderStyle.SINGLE, size: 8, color: 'E2E8F0', space: 8 } },
            children: [
              new TextRun({ text: exp.company, bold: true, size: m.fontSizeSubtext, font: FONT, color: '64748B' })
            ]
          })
        );
        if (exp.donor) {
          mainElements.push(
            new Paragraph({
              spacing: { after: 20 },
              indent: { left: 140 },
              border: { left: { style: BorderStyle.SINGLE, size: 8, color: 'E2E8F0', space: 8 } },
              children: [new TextRun({ text: exp.donor, italics: true, size: m.fontSizeSubtext - 0.5, font: FONT, color: '64748B' })]
            })
          );
        }
        exp.highlights.forEach((h) => {
          if (!h.trim()) return;
          mainElements.push(
            new Paragraph({
              spacing: { after: m.bulletAfter, line: m.lineSpacing - 10 },
              indent: { left: 260, hanging: 120 },
              border: { left: { style: BorderStyle.SINGLE, size: 8, color: 'E2E8F0', space: 8 } },
              children: [
                new TextRun({ text: '• ', size: m.fontSizeSubtext, font: FONT, color: '94A3B8' }),
                new TextRun({ text: h, size: m.fontSizeSubtext + 0.5, font: FONT, color: '334155' })
              ]
            })
          );
        });
      });
    } else if (key === 'educations' && cv.educations.length > 0) {
      mainElements.push(createHeading(titles.educations));
      cv.educations.forEach((edu, idx) => {
        mainElements.push(
          new Paragraph({
            spacing: { before: idx === 0 ? 15 : 70, after: 12 },
            keepNext: true,
            indent: { left: 140 },
            border: { left: { style: BorderStyle.SINGLE, size: 8, color: 'E2E8F0', space: 8 } },
            children: [
              new TextRun({ text: '● ', bold: true, size: 14, font: FONT, color: europassAccent }),
              new TextRun({ text: edu.period.toUpperCase(), bold: true, size: 16, font: FONT, color: europassAccent })
            ]
          }),
          new Paragraph({
            spacing: { after: 12 },
            keepNext: true,
            indent: { left: 140 },
            border: { left: { style: BorderStyle.SINGLE, size: 8, color: 'E2E8F0', space: 8 } },
            children: [new TextRun({ text: edu.degree, bold: true, size: m.fontSizeBody, font: FONT, color: '0F172A' })]
          }),
          new Paragraph({
            spacing: { after: 45 },
            indent: { left: 140 },
            border: { left: { style: BorderStyle.SINGLE, size: 8, color: 'E2E8F0', space: 8 } },
            children: [
              new TextRun({
                text: `${edu.institution}${edu.gpaOrHonors ? ` (${edu.gpaOrHonors})` : ''}`,
                size: m.fontSizeSubtext,
                font: FONT,
                color: '475569'
              })
            ]
          })
        );
      });
    } else if (key === 'trainings' && cv.trainings.length > 0) {
      mainElements.push(createHeading(titles.trainings));
      cv.trainings.forEach((tr) => {
        mainElements.push(
          new Paragraph({
            spacing: { after: m.bulletAfter, line: m.lineSpacing - 10 },
            indent: { left: 200, hanging: 140 },
            children: [
              new TextRun({ text: '• ', size: m.fontSizeSubtext, font: FONT, color: '94A3B8' }),
              new TextRun({ text: tr, size: m.fontSizeSubtext + 0.5, font: FONT, color: '334155' })
            ]
          })
        );
      });
    } else if (key === 'languages' && cv.languages.length > 0) {
      mainElements.push(createHeading(titles.languages));
      cv.languages.forEach((l) => {
        const grade = extractCefrGrade(l.level);
        mainElements.push(
          new Paragraph({
            spacing: { before: 40, after: 20 },
            children: [
              new TextRun({ text: `${l.language} `, bold: true, size: m.fontSizeSubtext + 0.5, font: FONT, color: '0F172A' }),
              new TextRun({ text: `(${l.level})`, size: m.fontSizeSubtext - 0.5, font: FONT, color: '64748B' })
            ]
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: NO_BORDERS,
            rows: [
              new TableRow({
                cantSplit: true,
                children: [
                  euroLabels.listening,
                  euroLabels.reading,
                  euroLabels.spokenProd,
                  euroLabels.spokenInter,
                  euroLabels.writing
                ].map(
                  (skillLabel) =>
                    new TableCell({
                      width: { size: 20, type: WidthType.PERCENTAGE },
                      shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                        left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                        right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' }
                      },
                      margins: { top: 40, bottom: 40, left: 40, right: 40 },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          spacing: { after: 10 },
                          children: [new TextRun({ text: skillLabel, size: 14, font: FONT, color: '64748B' })]
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          spacing: { after: 0 },
                          children: [new TextRun({ text: grade, bold: true, size: 15, font: MONO, color: '0F172A' })]
                        })
                      ]
                    })
                )
              })
            ]
          }),
          new Paragraph({ spacing: { after: 45 }, children: [] })
        );
      });
    } else if (key === 'references' && cv.references.length > 0) {
      mainElements.push(createHeading(titles.references));
      cv.references.forEach((r) => {
        mainElements.push(
          new Paragraph({
            spacing: { after: 35 },
            children: [
              new TextRun({ text: r.name, bold: true, size: m.fontSizeSubtext + 0.5, font: FONT, color: '0F172A' }),
              new TextRun({ text: ` — ${r.institutionAndPosition}`, size: m.fontSizeSubtext, font: FONT, color: '475569' }),
              new TextRun({ text: `  |  ${r.contact}`, size: m.fontSizeSubtext - 0.5, font: MONO, color: '64748B' })
            ]
          })
        );
      });
    }
  });

  if (mainElements.length === 0) {
    mainElements.push(new Paragraph({ children: [] }));
  }

  const splitTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        height: { value: A4_HEIGHT_TWIP, rule: HeightRule.ATLEAST },
        children: [
          new TableCell({
            width: { size: 32, type: WidthType.PERCENTAGE },
            shading: { fill: asideBg, type: ShadingType.CLEAR },
            borders: {
              ...NO_BORDERS,
              right: { style: BorderStyle.SINGLE, size: 6, color: asideContrast.borderHex }
            },
            margins: { top: 440, bottom: 440, left: 340, right: 340 },
            children: sidebarElements
          }),
          new TableCell({
            width: { size: 68, type: WidthType.PERCENTAGE },
            borders: NO_BORDERS,
            margins: { top: 460, bottom: 460, left: 440, right: 440 },
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
// EUROPASS VARIANT 2: TOP BANNER + FULL 6-COLUMN CEFR LANGUAGE MATRIX TABLE
// ============================================================================
function buildEuropassBannerDoc(
  cv: CVData,
  hasActivePlan: boolean,
  COLOR_PRIMARY: string,
  photoBytes: { data: Uint8Array; type: 'png' | 'jpg' } | null,
  density: 'compact' | 'normal' | 'relaxed',
  lang: LanguageCode
): Document {
  const FONT = 'Calibri';
  const MONO = 'Consolas';
  const bannerBg = cv.headerColor ? normalizeHex(cv.headerColor) : 'F1F3F5';
  const bannerContrast = getSurfaceContrastPalette(bannerBg);
  const barCol = cv.barColor ? normalizeHex(cv.barColor) : COLOR_PRIMARY || '0F172A';
  const titles = getResolvedSectionTitles(lang, cv.templateStyle);
  const euroLabels = EUROPASS_UI_LABELS[lang] || EUROPASS_UI_LABELS.en;
  const m = getSpacingMetrics(density);

  const children: (Paragraph | Table)[] = [];
  if (!hasActivePlan) {
    children.push(createWatermarkNotice(FONT));
  }

  // Top Banner Info Paragraphs
  const bannerInfoParagraphs: Paragraph[] = [
    new Paragraph({
      spacing: { after: 35 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: bannerContrast.borderHex, space: 4 } },
      children: [
        new TextRun({
          text: cv.personalDetails.name || 'YOUR FULL NAME',
          bold: true,
          size: m.fontSizeTitle - 2,
          font: FONT,
          color: bannerContrast.textHex
        }),
        ...(cv.personalDetails.title
          ? [
              new TextRun({
                text: `    ${cv.personalDetails.title}`,
                italics: true,
                bold: true,
                size: m.fontSizeSubtitle - 1,
                font: FONT,
                color: bannerContrast.mutedHex
              })
            ]
          : [])
      ]
    }),
    new Paragraph({
      spacing: { before: 40, after: 25 },
      children: [
        new TextRun({
          text: [
            cv.personalDetails.phone,
            cv.personalDetails.email,
            cv.personalDetails.website,
            cv.personalDetails.linkedin
          ]
            .filter(Boolean)
            .join('  |  '),
          size: m.fontSizeSubtext - 0.5,
          font: FONT,
          color: bannerContrast.mutedHex
        })
      ]
    })
  ];

  if (cv.personalDetails.location) {
    bannerInfoParagraphs.push(
      new Paragraph({
        spacing: { after: 35 },
        children: [
          new TextRun({
            text: cv.personalDetails.location,
            size: m.fontSizeSubtext - 0.5,
            font: FONT,
            color: bannerContrast.subtleHex
          })
        ]
      })
    );
  }

  if (isSecVisible(cv, 'summary') && cv.summary) {
    bannerInfoParagraphs.push(
      new Paragraph({
        spacing: { before: 35, after: 0, line: m.lineSpacing - 15 },
        children: [
          new TextRun({
            text: cv.summary,
            size: m.fontSizeBody - 1,
            font: FONT,
            color: bannerContrast.mutedHex
          })
        ]
      })
    );
  }

  const bannerCells: TableCell[] = [];
  if (photoBytes) {
    bannerCells.push(
      new TableCell({
        width: { size: 20, type: WidthType.PERCENTAGE },
        shading: { fill: bannerBg, type: ShadingType.CLEAR },
        borders: { ...NO_BORDERS, bottom: { style: BorderStyle.SINGLE, size: 6, color: bannerContrast.borderHex } },
        verticalAlign: VerticalAlign.TOP,
        margins: { top: 200, bottom: 200, left: 200, right: 120 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
            children: [
              new ImageRun({
                data: photoBytes.data,
                transformation: { width: 92, height: 92 },
                type: photoBytes.type
              })
            ]
          })
        ]
      })
    );
  }

  bannerCells.push(
    new TableCell({
      width: { size: photoBytes ? 80 : 100, type: WidthType.PERCENTAGE },
      shading: { fill: bannerBg, type: ShadingType.CLEAR },
      borders: { ...NO_BORDERS, bottom: { style: BorderStyle.SINGLE, size: 6, color: bannerContrast.borderHex } },
      verticalAlign: VerticalAlign.TOP,
      margins: { top: 200, bottom: 200, left: photoBytes ? 80 : 220, right: 220 },
      children: bannerInfoParagraphs
    })
  );

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [new TableRow({ children: bannerCells })]
    }),
    new Paragraph({ spacing: { after: 80 }, children: [] })
  );

  const createBannerHeading = (label: string) =>
    new Paragraph({
      spacing: { before: m.sectionBefore - 20, after: m.sectionAfter },
      keepNext: true,
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: barCol, space: 4 } },
      children: [
        new TextRun({ text: '● ', bold: true, size: 14, font: FONT, color: barCol }),
        new TextRun({ text: label.toUpperCase(), bold: true, size: m.fontSizeHeading - 1, font: FONT, color: COLOR_PRIMARY })
      ]
    });

  const effectiveOrder = resolveEffectiveSectionOrder(cv);
  effectiveOrder.forEach((key) => {
    if (!isSecVisible(cv, key) || key === 'summary') return;

    if (key === 'experiences' && cv.experiences.length > 0) {
      children.push(createBannerHeading(titles.experiences));
      cv.experiences.forEach((exp, idx) => {
        children.push(
          new Paragraph({
            spacing: { before: idx === 0 ? 15 : m.itemBefore, after: 15 },
            keepNext: true,
            children: [
              new TextRun({
                text: `${exp.period}${exp.location ? ` – ${exp.location}` : ''}`.toUpperCase(),
                bold: true,
                size: 16,
                font: FONT,
                color: '64748B'
              })
            ]
          }),
          new Paragraph({
            spacing: { after: 20 },
            keepNext: true,
            children: [
              new TextRun({ text: exp.role, bold: true, size: m.fontSizeBody, font: FONT, color: '020617' }),
              new TextRun({ text: ` — ${exp.company}`, size: m.fontSizeBody, font: FONT, color: '475569' })
            ]
          })
        );
        if (exp.donor) {
          children.push(
            new Paragraph({
              spacing: { after: 20 },
              children: [new TextRun({ text: exp.donor, italics: true, size: m.fontSizeSubtext, font: FONT, color: '475569' })]
            })
          );
        }
        exp.highlights.forEach((h) => {
          if (!h.trim()) return;
          children.push(
            new Paragraph({
              spacing: { after: m.bulletAfter, line: m.lineSpacing },
              indent: { left: 240, hanging: 160 },
              children: [
                new TextRun({ text: '•  ', bold: true, size: m.fontSizeBody, font: FONT, color: '94A3B8' }),
                new TextRun({ text: h, size: m.fontSizeBody - 0.5, font: FONT, color: '1E293B' })
              ]
            })
          );
        });
      });
    } else if (key === 'educations' && cv.educations.length > 0) {
      children.push(createBannerHeading(titles.educations));
      cv.educations.forEach((edu, idx) => {
        children.push(
          new Paragraph({
            spacing: { before: idx === 0 ? 15 : 70, after: 15 },
            keepNext: true,
            children: [new TextRun({ text: edu.period.toUpperCase(), bold: true, size: 16, font: FONT, color: '64748B' })]
          }),
          new Paragraph({
            spacing: { after: 45 },
            children: [
              new TextRun({ text: edu.degree.toUpperCase(), bold: true, size: m.fontSizeSubtext + 0.5, font: FONT, color: '020617' }),
              new TextRun({
                text: ` — ${edu.institution}${edu.gpaOrHonors ? ` (${edu.gpaOrHonors})` : ''}`,
                size: m.fontSizeBody - 0.5,
                font: FONT,
                color: '1E293B'
              })
            ]
          })
        );
      });
    } else if (key === 'competencies' && cv.competencies.length > 0) {
      children.push(createBannerHeading(titles.competencies));
      cv.competencies.forEach((c) => {
        children.push(
          new Paragraph({
            spacing: { after: m.bulletAfter, line: m.lineSpacing },
            indent: { left: 240, hanging: 160 },
            children: [
              new TextRun({ text: '•  ', size: m.fontSizeBody, font: FONT, color: '94A3B8' }),
              new TextRun({ text: `${c.category}: `, bold: true, size: m.fontSizeBody - 0.5, font: FONT, color: '0F172A' }),
              new TextRun({ text: c.description, size: m.fontSizeBody - 0.5, font: FONT, color: '1E293B' })
            ]
          })
        );
      });
    } else if (key === 'trainings' && cv.trainings.length > 0) {
      children.push(createBannerHeading(titles.trainings));
      cv.trainings.forEach((t) => {
        children.push(
          new Paragraph({
            spacing: { after: m.bulletAfter, line: m.lineSpacing },
            indent: { left: 240, hanging: 160 },
            children: [
              new TextRun({ text: '•  ', size: m.fontSizeBody, font: FONT, color: '94A3B8' }),
              new TextRun({ text: t, size: m.fontSizeBody - 0.5, font: FONT, color: '1E293B' })
            ]
          })
        );
      });
    } else if (key === 'languages' && cv.languages.length > 0) {
      children.push(createBannerHeading(titles.languages));
      const tblBorder = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' };
      const tblBorders = { top: tblBorder, bottom: tblBorder, left: tblBorder, right: tblBorder };
      const mkHeaderCell = (text: string, pct: number, opts?: { colSpan?: number; rowSpan?: number; shade?: string; align?: typeof AlignmentType[keyof typeof AlignmentType] }) =>
        new TableCell({
          width: { size: pct, type: WidthType.PERCENTAGE },
          columnSpan: opts?.colSpan,
          rowSpan: opts?.rowSpan,
          shading: { fill: opts?.shade || 'F1F5F9', type: ShadingType.CLEAR },
          borders: tblBorders,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 55, bottom: 55, left: 65, right: 65 },
          children: [
            new Paragraph({
              alignment: opts?.align || AlignmentType.CENTER,
              spacing: { after: 0 },
              children: [new TextRun({ text, bold: true, size: 15, font: FONT, color: '1E293B' })]
            })
          ]
        });

      const cefrRows: TableRow[] = [
        new TableRow({
          tableHeader: true,
          children: [
            mkHeaderCell(titles.chrome.europassLangCol.toUpperCase(), 24, { rowSpan: 2, align: AlignmentType.LEFT }),
            mkHeaderCell(euroLabels.understanding.toUpperCase(), 30, { colSpan: 2 }),
            mkHeaderCell(euroLabels.speaking.toUpperCase(), 32, { colSpan: 2 }),
            mkHeaderCell(euroLabels.writing.toUpperCase(), 14, { rowSpan: 2 })
          ]
        }),
        new TableRow({
          tableHeader: true,
          children: [
            mkHeaderCell(euroLabels.listening, 15, { shade: 'F8FAFC' }),
            mkHeaderCell(euroLabels.reading, 15, { shade: 'F8FAFC' }),
            mkHeaderCell(euroLabels.spokenProd, 16, { shade: 'F8FAFC' }),
            mkHeaderCell(euroLabels.spokenInter, 16, { shade: 'F8FAFC' })
          ]
        }),
        ...cv.languages.map((l, idx) => {
          const grade = extractCefrGrade(l.level);
          const rowFill = idx % 2 === 1 ? 'F8FAFC' : 'FFFFFF';
          return new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                width: { size: 24, type: WidthType.PERCENTAGE },
                shading: { fill: rowFill, type: ShadingType.CLEAR },
                borders: tblBorders,
                margins: { top: 60, bottom: 60, left: 75, right: 65 },
                children: [
                  new Paragraph({
                    spacing: { after: 0 },
                    children: [new TextRun({ text: l.language.toUpperCase(), bold: true, size: 16, font: FONT, color: '0F172A' })]
                  })
                ]
              }),
              ...[15, 15, 16, 16, 14].map(
                (pct) =>
                  new TableCell({
                    width: { size: pct, type: WidthType.PERCENTAGE },
                    shading: { fill: rowFill, type: ShadingType.CLEAR },
                    borders: tblBorders,
                    margins: { top: 60, bottom: 60, left: 40, right: 40 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 0 },
                        children: [new TextRun({ text: grade, bold: true, size: 16, font: MONO, color: '0F172A' })]
                      })
                    ]
                  })
              )
            ]
          });
        })
      ];

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: cefrRows
        }),
        new Paragraph({
          spacing: { before: 40, after: m.summaryAfter },
          children: [new TextRun({ text: euroLabels.cefrNote, size: 14.5, font: FONT, color: '64748B' })]
        })
      );
    } else if (key === 'references' && cv.references.length > 0) {
      children.push(createBannerHeading(titles.references));
      cv.references.forEach((r) => {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: r.name, bold: true, size: m.fontSizeSubtext + 0.5, font: FONT, color: '0F172A' }),
              new TextRun({ text: ` — ${r.institutionAndPosition}`, size: m.fontSizeSubtext + 0.5, font: FONT, color: '475569' }),
              new TextRun({ text: `  |  ${r.contact}`, size: m.fontSizeSubtext - 0.5, font: MONO, color: '64748B' })
            ]
          })
        );
      });
    }
  });

  return new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: A4_WIDTH_TWIP, height: A4_HEIGHT_TWIP },
            margin: {
              top: convertMillimetersToTwip(9),
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
// EUROPASS VARIANT 3: FRAMED CORNERS + DEDICATED POSITION & 2-COL LANGUAGES
// ============================================================================
function buildEuropassFramedDoc(
  cv: CVData,
  hasActivePlan: boolean,
  COLOR_PRIMARY: string,
  photoBytes: { data: Uint8Array; type: 'png' | 'jpg' } | null,
  density: 'compact' | 'normal' | 'relaxed',
  lang: LanguageCode
): Document {
  const FONT = 'Calibri';
  const MONO = 'Consolas';
  const europassAccent = resolveEuropassAccent(cv, COLOR_PRIMARY);
  const frameCol = cv.barColor ? normalizeHex(cv.barColor) : europassAccent;
  const titles = getResolvedSectionTitles(lang, cv.templateStyle);
  const euroLabels = EUROPASS_UI_LABELS[lang] || EUROPASS_UI_LABELS.en;
  const m = getSpacingMetrics(density);

  const buildCornerBarTable = () =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          height: { value: 90, rule: HeightRule.EXACT },
          children: [
            new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, shading: { fill: frameCol, type: ShadingType.CLEAR }, borders: NO_BORDERS, children: [new Paragraph({ children: [] })] }),
            new TableCell({ width: { size: 64, type: WidthType.PERCENTAGE }, borders: NO_BORDERS, children: [new Paragraph({ children: [] })] }),
            new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, shading: { fill: frameCol, type: ShadingType.CLEAR }, borders: NO_BORDERS, children: [new Paragraph({ children: [] })] })
          ]
        })
      ]
    });

  const children: (Paragraph | Table)[] = [buildCornerBarTable(), new Paragraph({ spacing: { after: 60 }, children: [] })];

  if (!hasActivePlan) {
    children.push(createWatermarkNotice(FONT));
  }

  const hdrBg = cv.headerColor ? normalizeHex(cv.headerColor) : undefined;
  const hdrContrast = hdrBg ? getSurfaceContrastPalette(hdrBg) : null;

  const infoParas: Paragraph[] = [
    new Paragraph({
      spacing: { after: 45 },
      children: [
        new TextRun({
          text: cv.personalDetails.name || 'YOUR FULL NAME',
          bold: true,
          size: m.fontSizeTitle,
          font: FONT,
          color: hdrContrast ? hdrContrast.textHex : europassAccent
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 15 },
      children: [
        new TextRun({
          text: [cv.personalDetails.location, cv.personalDetails.phone].filter(Boolean).join('   ·   '),
          size: m.fontSizeSubtext,
          font: FONT,
          color: hdrContrast ? hdrContrast.mutedHex : '334155'
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 0 },
      children: [
        new TextRun({
          text: [cv.personalDetails.email, cv.personalDetails.website, cv.personalDetails.linkedin].filter(Boolean).join('   ·   '),
          size: m.fontSizeSubtext,
          font: FONT,
          color: hdrContrast ? hdrContrast.mutedHex : '334155'
        })
      ]
    })
  ];

  const headerCells: TableCell[] = [];
  if (photoBytes) {
    headerCells.push(
      new TableCell({
        width: { size: 22, type: WidthType.PERCENTAGE },
        shading: hdrBg ? { fill: hdrBg, type: ShadingType.CLEAR } : undefined,
        borders: hdrBg ? NO_BORDERS : { ...NO_BORDERS, bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' } },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: hdrBg ? 120 : 20, bottom: 120, left: hdrBg ? 140 : 0, right: 100 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
            children: [
              new ImageRun({
                data: photoBytes.data,
                transformation: { width: 88, height: 88 },
                type: photoBytes.type
              })
            ]
          })
        ]
      })
    );
  }
  headerCells.push(
    new TableCell({
      width: { size: photoBytes ? 78 : 100, type: WidthType.PERCENTAGE },
      shading: hdrBg ? { fill: hdrBg, type: ShadingType.CLEAR } : undefined,
      borders: hdrBg ? NO_BORDERS : { ...NO_BORDERS, bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' } },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: hdrBg ? 120 : 20, bottom: 120, left: hdrBg && !photoBytes ? 160 : 40, right: hdrBg ? 160 : 0 },
      children: infoParas
    })
  );

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [new TableRow({ children: headerCells })]
    }),
    new Paragraph({ spacing: { after: 80 }, children: [] })
  );

  const createFramedHeading = (label: string) =>
    new Paragraph({
      spacing: { before: m.sectionBefore - 30, after: m.sectionAfter },
      keepNext: true,
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: europassAccent, space: 4 } },
      children: [
        new TextRun({ text: label.toUpperCase(), bold: true, size: m.fontSizeHeading - 1.5, font: FONT, color: europassAccent })
      ]
    });

  if (cv.personalDetails.title) {
    children.push(
      createFramedHeading(euroLabels.position),
      new Paragraph({
        spacing: { after: 75 },
        children: [new TextRun({ text: cv.personalDetails.title, bold: true, size: m.fontSizeBody, font: FONT, color: '1E293B' })]
      })
    );
  }

  const effectiveOrder = resolveEffectiveSectionOrder(cv);
  effectiveOrder.forEach((key) => {
    if (!isSecVisible(cv, key)) return;

    if (key === 'summary' && cv.summary) {
      children.push(
        createFramedHeading(euroLabels.aboutMyself),
        new Paragraph({
          spacing: { after: m.summaryAfter, line: m.lineSpacing },
          children: [new TextRun({ text: cv.summary, size: m.fontSizeBody - 0.5, font: FONT, color: '1E293B' })]
        })
      );
    } else if (key === 'experiences' && cv.experiences.length > 0) {
      children.push(createFramedHeading(titles.experiences));
      cv.experiences.forEach((exp, idx) => {
        children.push(
          new Paragraph({
            spacing: { before: idx === 0 ? 15 : 85, after: 15 },
            keepNext: true,
            children: [
              new TextRun({ text: exp.role, bold: true, size: m.fontSizeBody, font: FONT, color: europassAccent }),
              new TextRun({ text: `   ${exp.period}`, size: m.fontSizeSubtext - 0.5, font: MONO, color: '64748B' })
            ]
          }),
          new Paragraph({
            spacing: { after: 20 },
            keepNext: true,
            children: [
              new TextRun({
                text: `${exp.company}${exp.location ? ` – ${exp.location}` : ''}`,
                bold: true,
                italics: true,
                size: m.fontSizeSubtext + 0.5,
                font: FONT,
                color: '1E293B'
              })
            ]
          })
        );
        if (exp.donor) {
          children.push(
            new Paragraph({
              spacing: { after: 20 },
              children: [new TextRun({ text: exp.donor, italics: true, size: m.fontSizeSubtext, font: FONT, color: '475569' })]
            })
          );
        }
        exp.highlights.forEach((h) => {
          if (!h.trim()) return;
          children.push(
            new Paragraph({
              spacing: { after: m.bulletAfter, line: m.lineSpacing },
              indent: { left: 240, hanging: 160 },
              children: [
                new TextRun({ text: '•  ', size: m.fontSizeBody, font: FONT, color: '94A3B8' }),
                new TextRun({ text: h, size: m.fontSizeBody - 0.5, font: FONT, color: '1E293B' })
              ]
            })
          );
        });
      });
    } else if (key === 'educations' && cv.educations.length > 0) {
      children.push(createFramedHeading(titles.educations));
      cv.educations.forEach((edu, idx) => {
        children.push(
          new Paragraph({
            spacing: { before: idx === 0 ? 15 : 65, after: 15 },
            keepNext: true,
            children: [
              new TextRun({ text: edu.degree, bold: true, size: m.fontSizeBody, font: FONT, color: europassAccent }),
              new TextRun({ text: `   ${edu.period}`, size: m.fontSizeSubtext - 0.5, font: MONO, color: '64748B' })
            ]
          }),
          new Paragraph({
            spacing: { after: 45 },
            children: [
              new TextRun({
                text: `${edu.institution}${edu.gpaOrHonors ? ` (${edu.gpaOrHonors})` : ''}`,
                italics: true,
                size: m.fontSizeSubtext + 0.5,
                font: FONT,
                color: '334155'
              })
            ]
          })
        );
      });
    } else if (key === 'competencies' && cv.competencies.length > 0) {
      children.push(createFramedHeading(titles.competencies));
      cv.competencies.forEach((c) => {
        children.push(
          new Paragraph({
            spacing: { after: m.bulletAfter, line: m.lineSpacing },
            indent: { left: 240, hanging: 160 },
            children: [
              new TextRun({ text: '•  ', size: m.fontSizeBody, font: FONT, color: '94A3B8' }),
              new TextRun({ text: `${c.category}: `, bold: true, size: m.fontSizeBody - 0.5, font: FONT, color: '0F172A' }),
              new TextRun({ text: c.description, size: m.fontSizeBody - 0.5, font: FONT, color: '1E293B' })
            ]
          })
        );
      });
    } else if (key === 'trainings' && cv.trainings.length > 0) {
      children.push(createFramedHeading(titles.trainings));
      cv.trainings.forEach((tr) => {
        children.push(
          new Paragraph({
            spacing: { after: m.bulletAfter, line: m.lineSpacing },
            indent: { left: 240, hanging: 160 },
            children: [
              new TextRun({ text: '•  ', size: m.fontSizeBody, font: FONT, color: '94A3B8' }),
              new TextRun({ text: tr, size: m.fontSizeBody - 0.5, font: FONT, color: '1E293B' })
            ]
          })
        );
      });
    } else if (key === 'languages' && cv.languages.length > 0) {
      children.push(createFramedHeading(titles.languages));
      const langRows: TableRow[] = [];
      for (let i = 0; i < cv.languages.length; i += 2) {
        const makeLangCell = (item?: { language: string; level: string }) =>
          item
            ? (() => {
                const grade = extractCefrGrade(item.level);
                return new TableCell({
                  width: { size: 49, type: WidthType.PERCENTAGE },
                  borders: NO_BORDERS,
                  margins: { top: 30, bottom: 50, left: 20, right: 60 },
                  children: [
                    new Paragraph({
                      spacing: { after: 15 },
                      children: [
                        new TextRun({ text: item.language, bold: true, size: m.fontSizeSubtext + 0.5, font: FONT, color: europassAccent }),
                        new TextRun({ text: ` (${item.level})`, size: m.fontSizeSubtext - 0.5, font: FONT, color: '64748B' })
                      ]
                    }),
                    new Paragraph({
                      spacing: { after: 0 },
                      children: [
                        new TextRun({
                          text: `${euroLabels.listening.toUpperCase()}: ${grade} · ${euroLabels.reading.toUpperCase()}: ${grade} · ${euroLabels.writing.toUpperCase()}: ${grade}`,
                          size: 15,
                          font: FONT,
                          color: '334155'
                        })
                      ]
                    })
                  ]
                });
              })()
            : new TableCell({ width: { size: 49, type: WidthType.PERCENTAGE }, borders: NO_BORDERS, children: [new Paragraph({ children: [] })] });

        langRows.push(
          new TableRow({
            cantSplit: true,
            children: [
              makeLangCell(cv.languages[i]),
              new TableCell({ width: { size: 2, type: WidthType.PERCENTAGE }, borders: NO_BORDERS, children: [new Paragraph({ children: [] })] }),
              makeLangCell(cv.languages[i + 1])
            ]
          })
        );
      }
      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: NO_BORDERS, rows: langRows }));
    } else if (key === 'references' && cv.references.length > 0) {
      children.push(createFramedHeading(titles.references));
      cv.references.forEach((r) => {
        children.push(
          new Paragraph({
            spacing: { after: 35 },
            children: [
              new TextRun({ text: r.name, bold: true, size: m.fontSizeSubtext + 0.5, font: FONT, color: '0F172A' }),
              new TextRun({ text: ` — ${r.institutionAndPosition}`, size: m.fontSizeSubtext, font: FONT, color: '475569' }),
              new TextRun({ text: `  |  ${r.contact}`, size: m.fontSizeSubtext - 0.5, font: MONO, color: '64748B' })
            ]
          })
        );
      });
    }
  });

  children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [] }), buildCornerBarTable());

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
// EUROPASS VARIANT 4: CLASSIC 2-COLUMN EUROPEAN MARGIN GRID (NO EUROPASS STAMP)
// ============================================================================
function buildEuropassClassicDoc(
  cv: CVData,
  hasActivePlan: boolean,
  COLOR_PRIMARY: string,
  photoBytes: { data: Uint8Array; type: 'png' | 'jpg' } | null,
  density: 'compact' | 'normal' | 'relaxed',
  lang: LanguageCode
): Document {
  const FONT = 'Calibri';
  const MONO = 'Consolas';
  const europassAccent = resolveEuropassAccent(cv, COLOR_PRIMARY);
  const classicBorderColor = cv.barColor ? normalizeHex(cv.barColor) : 'E2E8F0';
  const titles = getResolvedSectionTitles(lang, cv.templateStyle);
  const euroLabels = EUROPASS_UI_LABELS[lang] || EUROPASS_UI_LABELS.en;
  const m = getSpacingMetrics(density);

  const children: (Paragraph | Table)[] = [];
  if (!hasActivePlan) {
    children.push(createWatermarkNotice(FONT));
  }

  const hdrBg = cv.headerColor ? normalizeHex(cv.headerColor) : undefined;
  const hdrContrast = hdrBg ? getSurfaceContrastPalette(hdrBg) : null;

  const rightHeaderParas: Paragraph[] = [
    new Paragraph({
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: cv.personalDetails.name || 'YOUR FULL NAME',
          bold: true,
          size: m.fontSizeTitle,
          font: FONT,
          color: hdrContrast ? hdrContrast.textHex : '0F172A'
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 55 },
      children: [
        new TextRun({
          text: cv.personalDetails.title || '',
          bold: true,
          size: m.fontSizeSubtitle,
          font: FONT,
          color: hdrContrast ? hdrContrast.mutedHex : europassAccent
        })
      ]
    })
  ];

  if (cv.personalDetails.location) {
    rightHeaderParas.push(
      new Paragraph({
        spacing: { after: 20 },
        children: [
          new TextRun({
            text: `${euroLabels.address}: `,
            bold: true,
            size: m.fontSizeSubtext,
            font: FONT,
            color: hdrContrast ? hdrContrast.textHex : '0F172A'
          }),
          new TextRun({
            text: cv.personalDetails.location,
            size: m.fontSizeSubtext,
            font: FONT,
            color: hdrContrast ? hdrContrast.mutedHex : '334155'
          })
        ]
      })
    );
  }

  const line2 = [cv.personalDetails.email, cv.personalDetails.phone].filter(Boolean).join('   ·   ');
  if (line2) {
    rightHeaderParas.push(
      new Paragraph({
        spacing: { after: 20 },
        children: [new TextRun({ text: line2, size: m.fontSizeSubtext, font: FONT, color: hdrContrast ? hdrContrast.mutedHex : '334155' })]
      })
    );
  }
  const line3 = [cv.personalDetails.website, cv.personalDetails.linkedin].filter(Boolean).join('   ·   ');
  if (line3) {
    rightHeaderParas.push(
      new Paragraph({
        spacing: { after: 0 },
        children: [new TextRun({ text: line3, size: m.fontSizeSubtext, font: FONT, color: hdrContrast ? hdrContrast.mutedHex : '334155' })]
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
              width: { size: 28, type: WidthType.PERCENTAGE },
              shading: hdrBg ? { fill: hdrBg, type: ShadingType.CLEAR } : undefined,
              borders: hdrBg ? NO_BORDERS : { ...NO_BORDERS, bottom: { style: BorderStyle.SINGLE, size: 6, color: classicBorderColor } },
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: hdrBg ? 120 : 20, bottom: 130, left: hdrBg ? 100 : 0, right: 160 },
              children: photoBytes
                ? [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      spacing: { after: 0 },
                      children: [
                        new ImageRun({
                          data: photoBytes.data,
                          transformation: { width: 88, height: 88 },
                          type: photoBytes.type
                        })
                      ]
                    })
                  ]
                : [new Paragraph({ children: [] })]
            }),
            new TableCell({
              width: { size: 72, type: WidthType.PERCENTAGE },
              shading: hdrBg ? { fill: hdrBg, type: ShadingType.CLEAR } : undefined,
              borders: hdrBg ? NO_BORDERS : { ...NO_BORDERS, bottom: { style: BorderStyle.SINGLE, size: 6, color: classicBorderColor } },
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: hdrBg ? 120 : 20, bottom: 130, left: 40, right: hdrBg ? 120 : 0 },
              children: rightHeaderParas
            })
          ]
        })
      ]
    }),
    new Paragraph({ spacing: { after: 90 }, children: [] })
  );

  const buildMarginRow = (leftChildren: Paragraph[], rightChildren: (Paragraph | Table)[], topBorder = true) =>
    new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: 28, type: WidthType.PERCENTAGE },
          borders: NO_BORDERS,
          margins: { top: 80, bottom: 75, left: 0, right: 160 },
          children: leftChildren
        }),
        new TableCell({
          width: { size: 72, type: WidthType.PERCENTAGE },
          borders: topBorder
            ? { ...NO_BORDERS, top: { style: BorderStyle.SINGLE, size: 4, color: classicBorderColor } }
            : NO_BORDERS,
          margins: { top: 80, bottom: 75, left: 40, right: 0 },
          children: rightChildren
        })
      ]
    });

  const gridRows: TableRow[] = [];
  const effectiveOrder = resolveEffectiveSectionOrder(cv);

  effectiveOrder.forEach((key) => {
    if (!isSecVisible(cv, key)) return;

    if (key === 'summary' && cv.summary) {
      gridRows.push(
        buildMarginRow(
          [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 0 },
              children: [new TextRun({ text: euroLabels.aboutMyself.toUpperCase(), bold: true, size: 16, font: FONT, color: europassAccent })]
            })
          ],
          [
            new Paragraph({
              spacing: { after: 0, line: m.lineSpacing },
              children: [new TextRun({ text: cv.summary, size: m.fontSizeBody - 0.5, font: FONT, color: '1E293B' })]
            })
          ],
          false
        )
      );
    } else if (key === 'experiences' && cv.experiences.length > 0) {
      cv.experiences.forEach((exp, idx) => {
        const leftParas: Paragraph[] = [];
        if (idx === 0) {
          leftParas.push(
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 35 },
              children: [new TextRun({ text: titles.experiences.toUpperCase(), bold: true, size: 16, font: FONT, color: europassAccent })]
            })
          );
        }
        leftParas.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 0 },
            children: [new TextRun({ text: `[ ${exp.period} ]`, size: 15, font: MONO, color: '64748B' })]
          })
        );

        const rightParas: Paragraph[] = [
          new Paragraph({
            spacing: { after: 15 },
            children: [new TextRun({ text: exp.role, bold: true, size: m.fontSizeBody, font: FONT, color: europassAccent })]
          }),
          new Paragraph({
            spacing: { after: 25 },
            children: [
              new TextRun({
                text: `${exp.company}${exp.location ? ` · ${exp.location}` : ''}`,
                bold: true,
                size: m.fontSizeSubtext + 0.5,
                font: FONT,
                color: '1E293B'
              })
            ]
          })
        ];
        if (exp.donor) {
          rightParas.push(
            new Paragraph({
              spacing: { after: 20 },
              children: [new TextRun({ text: exp.donor, italics: true, size: m.fontSizeSubtext, font: FONT, color: '475569' })]
            })
          );
        }
        exp.highlights.forEach((h) => {
          if (!h.trim()) return;
          rightParas.push(
            new Paragraph({
              spacing: { after: m.bulletAfter, line: m.lineSpacing },
              indent: { left: 200, hanging: 140 },
              children: [
                new TextRun({ text: '•  ', size: m.fontSizeBody - 0.5, font: FONT, color: '94A3B8' }),
                new TextRun({ text: h, size: m.fontSizeBody - 0.5, font: FONT, color: '1E293B' })
              ]
            })
          );
        });

        gridRows.push(buildMarginRow(leftParas, rightParas, idx === 0));
      });
    } else if (key === 'educations' && cv.educations.length > 0) {
      cv.educations.forEach((edu, idx) => {
        const leftParas: Paragraph[] = [];
        if (idx === 0) {
          leftParas.push(
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 35 },
              children: [new TextRun({ text: titles.educations.toUpperCase(), bold: true, size: 16, font: FONT, color: europassAccent })]
            })
          );
        }
        leftParas.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 0 },
            children: [new TextRun({ text: `[ ${edu.period} ]`, size: 15, font: MONO, color: '64748B' })]
          })
        );
        gridRows.push(
          buildMarginRow(
            leftParas,
            [
              new Paragraph({
                spacing: { after: 15 },
                children: [new TextRun({ text: edu.degree, bold: true, size: m.fontSizeBody, font: FONT, color: europassAccent })]
              }),
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: `${edu.institution}${edu.gpaOrHonors ? ` (${edu.gpaOrHonors})` : ''}`,
                    bold: true,
                    size: m.fontSizeSubtext + 0.5,
                    font: FONT,
                    color: '1E293B'
                  })
                ]
              })
            ],
            idx === 0
          )
        );
      });
    } else if (key === 'competencies' && cv.competencies.length > 0) {
      gridRows.push(
        buildMarginRow(
          [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 0 },
              children: [new TextRun({ text: titles.competencies.toUpperCase(), bold: true, size: 16, font: FONT, color: europassAccent })]
            })
          ],
          cv.competencies.map(
            (c) =>
              new Paragraph({
                spacing: { after: m.bulletAfter, line: m.lineSpacing },
                indent: { left: 200, hanging: 140 },
                children: [
                  new TextRun({ text: '•  ', size: m.fontSizeBody - 0.5, font: FONT, color: '94A3B8' }),
                  new TextRun({ text: `${c.category}: `, bold: true, size: m.fontSizeBody - 0.5, font: FONT, color: '0F172A' }),
                  new TextRun({ text: c.description, size: m.fontSizeBody - 0.5, font: FONT, color: '1E293B' })
                ]
              })
          )
        )
      );
    } else if (key === 'trainings' && cv.trainings.length > 0) {
      gridRows.push(
        buildMarginRow(
          [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 0 },
              children: [new TextRun({ text: titles.trainings.toUpperCase(), bold: true, size: 16, font: FONT, color: europassAccent })]
            })
          ],
          cv.trainings.map(
            (tr) =>
              new Paragraph({
                spacing: { after: m.bulletAfter, line: m.lineSpacing },
                indent: { left: 200, hanging: 140 },
                children: [
                  new TextRun({ text: '•  ', size: m.fontSizeBody - 0.5, font: FONT, color: '94A3B8' }),
                  new TextRun({ text: tr, size: m.fontSizeBody - 0.5, font: FONT, color: '1E293B' })
                ]
              })
          )
        )
      );
    } else if (key === 'languages' && cv.languages.length > 0) {
      const langRuns: TextRun[] = [];
      cv.languages.forEach((l, idx) => {
        langRuns.push(
          new TextRun({ text: `• ${l.language}: `, bold: true, size: m.fontSizeBody - 0.5, font: FONT, color: '020617' }),
          new TextRun({ text: `${l.level} `, size: m.fontSizeBody - 0.5, font: FONT, color: '334155' }),
          new TextRun({
            text: ` ${extractCefrGrade(l.level)} `,
            bold: true,
            size: 15,
            font: MONO,
            color: europassAccent,
            shading: { fill: 'EFF6FF', type: ShadingType.CLEAR }
          })
        );
        if (idx < cv.languages.length - 1) {
          langRuns.push(new TextRun({ text: '    ', size: m.fontSizeBody - 0.5, font: FONT }));
        }
      });
      gridRows.push(
        buildMarginRow(
          [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 0 },
              children: [new TextRun({ text: titles.languages.toUpperCase(), bold: true, size: 16, font: FONT, color: europassAccent })]
            })
          ],
          [new Paragraph({ spacing: { after: 0, line: m.lineSpacing }, children: langRuns })]
        )
      );
    } else if (key === 'references' && cv.references.length > 0) {
      gridRows.push(
        buildMarginRow(
          [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 0 },
              children: [new TextRun({ text: titles.references.toUpperCase(), bold: true, size: 16, font: FONT, color: europassAccent })]
            })
          ],
          cv.references.map(
            (r) =>
              new Paragraph({
                spacing: { after: 35 },
                children: [
                  new TextRun({ text: r.name, bold: true, size: m.fontSizeSubtext + 0.5, font: FONT, color: '0F172A' }),
                  new TextRun({ text: ` — ${r.institutionAndPosition}`, size: m.fontSizeSubtext, font: FONT, color: '475569' }),
                  new TextRun({ text: `  |  ${r.contact}`, size: m.fontSizeSubtext - 0.5, font: MONO, color: '64748B' })
                ]
              })
          )
        )
      );
    }
  });

  if (gridRows.length > 0) {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        rows: gridRows
      })
    );
  }

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
// MAIN WORD EXPORT DISPATCHER (Resolves Template Style, Spacing Density, Lang & Photo)
// ============================================================================
export async function generateWordDocument(
  cv: CVData,
  hasActivePlan: boolean = true,
  density: 'compact' | 'normal' | 'relaxed' = 'normal',
  lang: LanguageCode = 'en'
): Promise<Blob> {
  const COLOR_PRIMARY = normalizeHex(cv.accentColor, '0F172A');

  const hasPhotoEnabled = cv.personalDetails.showPhoto !== false && Boolean(cv.personalDetails.photoUrl);
  const photoBytes = hasPhotoEnabled ? await getPhotoBytes(cv.personalDetails.photoUrl) : null;

  const styleProfile = resolveTemplateStyleProfile(cv.templateStyle);
  let doc: Document;
  if (styleProfile.isCreative) {
    doc = buildCreativeSplitDoc(cv, hasActivePlan, COLOR_PRIMARY, photoBytes, density, lang);
  } else if (styleProfile.europassVariant === 'sidebar') {
    doc = buildEuropassSidebarDoc(cv, hasActivePlan, COLOR_PRIMARY, photoBytes, density, lang);
  } else if (styleProfile.europassVariant === 'banner') {
    doc = buildEuropassBannerDoc(cv, hasActivePlan, COLOR_PRIMARY, photoBytes, density, lang);
  } else if (styleProfile.europassVariant === 'framed') {
    doc = buildEuropassFramedDoc(cv, hasActivePlan, COLOR_PRIMARY, photoBytes, density, lang);
  } else if (styleProfile.europassVariant === 'classic') {
    doc = buildEuropassClassicDoc(cv, hasActivePlan, COLOR_PRIMARY, photoBytes, density, lang);
  } else {
    doc = buildSingleColumnCVDoc(cv, hasActivePlan, COLOR_PRIMARY, photoBytes, density, lang);
  }

  return await Packer.toBlob(doc);
}

// ============================================================================
// COVER LETTER WORD EXPORT (1:1 Match with CoverLetterDocumentView.tsx A4 Sheet)
// ============================================================================
export async function generateCoverLetterDocx(
  cv: CVData,
  letterBody: string,
  hasActivePlan: boolean = true,
  lang: LanguageCode = 'en'
): Promise<Blob> {
  const COLOR_DARK = '020617';
  const COLOR_SLATE = '1E293B';
  const COLOR_MUTED = '475569';
  const COLOR_LIGHT = '64748B';
  const SERIF_FONT = 'Times New Roman';
  const SANS_FONT = 'Calibri';
  const MONO_FONT = 'Consolas';

  const chrome = COVER_CHROME_LABELS[lang] || COVER_CHROME_LABELS.en;
  const candidateName = cv.personalDetails.name || 'Your Full Name';
  const candidateTitle = cv.personalDetails.title || 'Executive Professional Title';
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
