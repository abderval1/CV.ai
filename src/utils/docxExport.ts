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
  ImageRun
} from 'docx';
import { CVData, CVSectionKey } from '../types/cv';
import { DEFAULT_SECTION_ORDER } from './executivePhrasing';

function isSecVisible(cv: CVData, key: CVSectionKey): boolean {
  return cv.sectionVisibility?.[key] !== false;
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
      // Try direct fetch first
      try {
        const res = await fetch(photoUrl, { mode: 'cors' });
        if (res.ok) {
          const buf = await res.arrayBuffer();
          const contentType = res.headers.get('content-type') || '';
          const type: 'png' | 'jpg' = contentType.includes('png') ? 'png' : 'jpg';
          return { data: new Uint8Array(buf), type };
        }
      } catch {
        // Direct fetch failed, fallback to canvas rendering
      }

      // Browser canvas fallback for remote images with crossOrigin
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

function getSpacingMetrics(density: 'compact' | 'normal' | 'relaxed' = 'normal'): SpacingMetrics {
  if (density === 'compact') {
    return {
      pageMarginTop: convertInchesToTwip(0.4),
      pageMarginBottom: convertInchesToTwip(0.4),
      pageMarginLeft: convertInchesToTwip(0.5),
      pageMarginRight: convertInchesToTwip(0.5),
      sectionBefore: 120, // 6pt
      sectionAfter: 25,   // 1.25pt
      itemBefore: 45,     // 2.25pt
      itemAfter: 15,      // 0.75pt
      bulletAfter: 18,    // 0.9pt
      lineSpacing: 230,   // tight line height
      summaryAfter: 50,
      fontSizeTitle: 30,  // 15pt
      fontSizeSubtitle: 20, // 10pt
      fontSizeHeading: 19, // 9.5pt
      fontSizeBody: 18.5, // 9.25pt
      fontSizeSubtext: 16.5 // 8.25pt
    };
  }
  if (density === 'relaxed') {
    return {
      pageMarginTop: convertInchesToTwip(0.7),
      pageMarginBottom: convertInchesToTwip(0.7),
      pageMarginLeft: convertInchesToTwip(0.8),
      pageMarginRight: convertInchesToTwip(0.8),
      sectionBefore: 220, // 11pt
      sectionAfter: 55,   // 2.75pt
      itemBefore: 90,     // 4.5pt
      itemAfter: 30,      // 1.5pt
      bulletAfter: 45,    // 2.25pt
      lineSpacing: 275,   // 1.15x
      summaryAfter: 120,
      fontSizeTitle: 36,  // 18pt
      fontSizeSubtitle: 22, // 11pt
      fontSizeHeading: 22, // 11pt
      fontSizeBody: 21,   // 10.5pt
      fontSizeSubtext: 18.5 // 9.25pt
    };
  }
  // normal (default balanced executive)
  return {
    pageMarginTop: convertInchesToTwip(0.55),
    pageMarginBottom: convertInchesToTwip(0.55),
    pageMarginLeft: convertInchesToTwip(0.65),
    pageMarginRight: convertInchesToTwip(0.65),
    sectionBefore: 160, // 8pt
    sectionAfter: 35,   // 1.75pt
    itemBefore: 65,     // 3.25pt
    itemAfter: 20,      // 1pt
    bulletAfter: 28,    // 1.4pt
    lineSpacing: 245,   // balanced line height
    summaryAfter: 80,
    fontSizeTitle: 33,  // 16.5pt
    fontSizeSubtitle: 21, // 10.5pt
    fontSizeHeading: 20.5, // 10.25pt
    fontSizeBody: 19.5, // 9.75pt
    fontSizeSubtext: 17.5 // 8.75pt
  };
}

function createWatermarkNotice(fontFamily: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    border: {
      bottom: { style: BorderStyle.DASHED, size: 6, color: 'DC2626' },
      top: { style: BorderStyle.DASHED, size: 6, color: 'DC2626' }
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
        text: '\n(Documento de demonstração com marca de água. Ative o plano Pro ou VIP em curriculoestrategico.com para a versão oficial limpa)',
        italics: true,
        size: 15,
        font: fontFamily,
        color: '64748B'
      })
    ]
  });
}

// ============================================================================
// 1. HARVARD BUSINESS / C-LEVEL MODEL (Left-aligned, serif, borderless tables)
// ============================================================================
function buildHarvardDoc(
  cv: CVData,
  hasActivePlan: boolean,
  COLOR_PRIMARY: string,
  density: 'compact' | 'normal' | 'relaxed'
): Document {
  const FONT = 'Times New Roman';
  const m = getSpacingMetrics(density);
  const children: (Paragraph | Table)[] = [];

  if (!hasActivePlan) {
    children.push(createWatermarkNotice(FONT));
  }

  // Harvard Header: Strict left-aligned with bold line
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 25 },
      children: [
        new TextRun({
          text: (cv.personalDetails.name || 'SEU NOME').toUpperCase(),
          bold: true,
          size: m.fontSizeTitle,
          font: FONT,
          color: COLOR_PRIMARY
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: cv.personalDetails.title || '',
          italics: true,
          bold: true,
          size: m.fontSizeSubtitle,
          font: FONT,
          color: '334155'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: m.summaryAfter },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 12, color: COLOR_PRIMARY, space: 4 }
      },
      children: [
        new TextRun({
          text: [
            cv.personalDetails.location,
            cv.personalDetails.phone,
            cv.personalDetails.email,
            cv.personalDetails.linkedin,
            cv.personalDetails.website
          ]
            .filter(Boolean)
            .join('  ·  '),
          size: m.fontSizeSubtext,
          font: FONT,
          color: '475569'
        })
      ]
    })
  );

  function createHarvardSectionHeading(title: string): Paragraph {
    return new Paragraph({
      spacing: { before: m.sectionBefore, after: m.sectionAfter },
      keepNext: true,
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: '64748B', space: 2 }
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: m.fontSizeHeading,
          font: FONT,
          color: COLOR_PRIMARY
        })
      ]
    });
  }

  function renderHarvardSection(key: CVSectionKey): (Paragraph | Table)[] {
    if (!isSecVisible(cv, key)) return [];
    switch (key) {
      case 'summary':
        if (!cv.summary) return [];
        return [
          createHarvardSectionHeading('Executive Summary'),
          new Paragraph({
            spacing: { after: m.summaryAfter, line: m.lineSpacing },
            children: [
              new TextRun({
                text: cv.summary,
                size: m.fontSizeBody,
                font: FONT,
                color: '1E293B'
              })
            ]
          })
        ];

      case 'experiences':
        if (!cv.experiences || cv.experiences.length === 0) return [];
        const expItems: (Paragraph | Table)[] = [createHarvardSectionHeading('Professional Experience')];
        cv.experiences.forEach((exp) => {
          expItems.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: NO_BORDERS,
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 70, type: WidthType.PERCENTAGE },
                      borders: NO_BORDERS,
                      children: [
                        new Paragraph({
                          spacing: { before: m.itemBefore, after: 10 },
                          children: [
                            new TextRun({ text: exp.role, bold: true, size: m.fontSizeBody + 0.5, font: FONT, color: '0F172A' }),
                            new TextRun({ text: ` — ${exp.company}`, size: m.fontSizeBody, font: FONT, color: '334155' })
                          ]
                        })
                      ]
                    }),
                    new TableCell({
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      borders: NO_BORDERS,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          spacing: { before: m.itemBefore, after: 10 },
                          children: [
                            new TextRun({
                              text: exp.period ? `${exp.period}${exp.location ? ` | ${exp.location}` : ''}` : '',
                              size: m.fontSizeSubtext,
                              font: FONT,
                              italics: true,
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

          if (exp.donor) {
            expItems.push(
              new Paragraph({
                spacing: { after: 20 },
                children: [
                  new TextRun({ text: `Financiador/Projeto: ${exp.donor}`, italics: true, size: m.fontSizeSubtext, font: FONT, color: '475569' })
                ]
              })
            );
          }

          exp.highlights.forEach((h) => {
            if (!h.trim()) return;
            expItems.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
                children: [new TextRun({ text: h, size: m.fontSizeBody, font: FONT, color: '1E293B' })]
              })
            );
          });
        });
        return expItems;

      case 'educations':
        if (!cv.educations || cv.educations.length === 0) return [];
        const eduItems: (Paragraph | Table)[] = [createHarvardSectionHeading('Education')];
        cv.educations.forEach((edu) => {
          eduItems.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: NO_BORDERS,
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 70, type: WidthType.PERCENTAGE },
                      borders: NO_BORDERS,
                      children: [
                        new Paragraph({
                          spacing: { before: m.itemBefore, after: 15 },
                          children: [
                            new TextRun({ text: edu.degree, bold: true, size: m.fontSizeBody, font: FONT, color: '0F172A' }),
                            new TextRun({ text: ` — ${edu.institution}`, size: m.fontSizeBody, font: FONT, color: '334155' })
                          ]
                        })
                      ]
                    }),
                    new TableCell({
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      borders: NO_BORDERS,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          spacing: { before: m.itemBefore, after: 15 },
                          children: [
                            new TextRun({ text: edu.period, size: m.fontSizeSubtext, font: FONT, italics: true, color: '475569' })
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
        const trainItems: (Paragraph | Table)[] = [createHarvardSectionHeading('Certifications & Training')];
        cv.trainings.forEach((t) => {
          trainItems.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
              children: [
                new TextRun({ text: t, size: m.fontSizeBody, font: FONT, color: '1E293B' })
              ]
            })
          );
        });
        return trainItems;

      case 'competencies':
        if (!cv.competencies || cv.competencies.length === 0) return [];
        const compItems: (Paragraph | Table)[] = [createHarvardSectionHeading('Key Competencies')];
        cv.competencies.forEach((c) => {
          compItems.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
              children: [
                new TextRun({ text: `${c.category}: `, bold: true, size: m.fontSizeBody, font: FONT, color: '0F172A' }),
                new TextRun({ text: c.description, size: m.fontSizeBody, font: FONT, color: '334155' })
              ]
            })
          );
        });
        return compItems;

      case 'languages':
        if (!cv.languages || cv.languages.length === 0) return [];
        const langRuns: TextRun[] = [];
        cv.languages.forEach((l, idx) => {
          langRuns.push(
            new TextRun({ text: `${l.language}: `, bold: true, size: m.fontSizeBody, font: FONT }),
            new TextRun({ text: `${l.level}${idx < cv.languages.length - 1 ? '   |   ' : ''}`, size: m.fontSizeBody, font: FONT, color: '475569' })
          );
        });
        return [
          createHarvardSectionHeading('Languages'),
          new Paragraph({ spacing: { after: m.summaryAfter }, children: langRuns })
        ];

      case 'references':
        if (!cv.references || cv.references.length === 0) return [];
        const refItems: (Paragraph | Table)[] = [createHarvardSectionHeading('Professional References')];
        cv.references.forEach((r) => {
          refItems.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
              children: [
                new TextRun({ text: `${r.name}`, bold: true, size: m.fontSizeBody, font: FONT, color: '0F172A' }),
                new TextRun({ text: ` — ${r.institutionAndPosition} (${r.contact})`, size: m.fontSizeBody, font: FONT, color: '334155' })
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
    children.push(...renderHarvardSection(secKey));
  });

  return new Document({
    sections: [
      {
        properties: {
          page: {
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
// 2. OFFICIAL EUROPASS MODEL (Europass header, photo support, 2-column grid)
// ============================================================================
function buildEuropassDoc(
  cv: CVData,
  hasActivePlan: boolean,
  COLOR_PRIMARY: string,
  photoBytes: { data: Uint8Array; type: 'png' | 'jpg' } | null,
  density: 'compact' | 'normal' | 'relaxed'
): Document {
  const FONT = 'Arial';
  const EU_BLUE = '003399';
  const m = getSpacingMetrics(density);
  const children: (Paragraph | Table)[] = [];

  if (!hasActivePlan) {
    children.push(createWatermarkNotice(FONT));
  }

  // Europass Blue Badge Header
  children.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: 'curriculum vitae ',
          bold: true,
          size: m.fontSizeTitle - 6,
          font: FONT,
          color: EU_BLUE
        }),
        new TextRun({
          text: 'europass',
          bold: true,
          size: m.fontSizeTitle - 6,
          font: FONT,
          color: 'EAB308'
        }),
        new TextRun({
          text: '  ·  Padrão Oficial da União Europeia',
          size: m.fontSizeSubtext,
          font: FONT,
          color: '64748B'
        })
      ]
    })
  );

  // Europass Candidate Info + Photo Table
  const headerCells: TableCell[] = [
    new TableCell({
      width: { size: photoBytes ? 75 : 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      children: [
        new Paragraph({
          spacing: { after: 15 },
          children: [
            new TextRun({
              text: cv.personalDetails.name || 'SEU NOME COMPLETO',
              bold: true,
              size: m.fontSizeTitle,
              font: FONT,
              color: EU_BLUE
            })
          ]
        }),
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: cv.personalDetails.title || '',
              bold: true,
              size: m.fontSizeSubtitle,
              font: FONT,
              color: '1E293B'
            })
          ]
        }),
        new Paragraph({
          spacing: { after: 15 },
          children: [
            new TextRun({ text: 'Endereço / Localização: ', bold: true, size: m.fontSizeSubtext, font: FONT, color: '64748B' }),
            new TextRun({ text: cv.personalDetails.location || '', size: m.fontSizeSubtext, font: FONT })
          ]
        }),
        new Paragraph({
          spacing: { after: 15 },
          children: [
            new TextRun({ text: 'Telefone / WhatsApp: ', bold: true, size: m.fontSizeSubtext, font: FONT, color: '64748B' }),
            new TextRun({ text: cv.personalDetails.phone || '', size: m.fontSizeSubtext, font: FONT })
          ]
        }),
        new Paragraph({
          spacing: { after: 15 },
          children: [
            new TextRun({ text: 'Correio Eletrónico: ', bold: true, size: m.fontSizeSubtext, font: FONT, color: '64748B' }),
            new TextRun({ text: cv.personalDetails.email || '', size: m.fontSizeSubtext, font: FONT })
          ]
        }),
        cv.personalDetails.linkedin
          ? new Paragraph({
              spacing: { after: 30 },
              children: [
                new TextRun({ text: 'LinkedIn: ', bold: true, size: m.fontSizeSubtext, font: FONT, color: '64748B' }),
                new TextRun({ text: cv.personalDetails.linkedin, size: m.fontSizeSubtext, font: FONT })
              ]
            })
          : new Paragraph({ spacing: { after: 30 }, children: [] })
      ]
    })
  ];

  if (photoBytes) {
    headerCells.push(
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 20 },
            children: [
              new ImageRun({
                data: photoBytes.data,
                transformation: { width: 90, height: 90 },
                type: photoBytes.type
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: 'FOTO FORMAL', size: 14, font: FONT, color: '94A3B8' })
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
      rows: [new TableRow({ children: headerCells })]
    })
  );

  function createEuropassHeading(title: string): Paragraph {
    return new Paragraph({
      spacing: { before: m.sectionBefore, after: m.sectionAfter },
      keepNext: true,
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 10, color: EU_BLUE, space: 4 }
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: m.fontSizeHeading,
          font: FONT,
          color: EU_BLUE
        })
      ]
    });
  }

  function renderEuropassSection(key: CVSectionKey): (Paragraph | Table)[] {
    if (!isSecVisible(cv, key)) return [];
    switch (key) {
      case 'summary':
        if (!cv.summary) return [];
        return [
          createEuropassHeading('Resumo Profissional'),
          new Paragraph({
            spacing: { after: m.summaryAfter, line: m.lineSpacing },
            children: [new TextRun({ text: cv.summary, size: m.fontSizeBody, font: FONT, color: '1E293B' })]
          })
        ];

      case 'experiences':
        if (!cv.experiences || cv.experiences.length === 0) return [];
        const expItems: (Paragraph | Table)[] = [createEuropassHeading('Experiência Profissional')];
        cv.experiences.forEach((exp) => {
          expItems.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: NO_BORDERS,
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 26, type: WidthType.PERCENTAGE },
                      borders: NO_BORDERS,
                      children: [
                        new Paragraph({
                          spacing: { before: m.itemBefore, after: 15 },
                          children: [
                            new TextRun({ text: exp.period || '', bold: true, size: m.fontSizeSubtext, font: FONT, color: EU_BLUE }),
                            new TextRun({ text: exp.location ? `\n${exp.location}` : '', size: m.fontSizeSubtext - 1, font: FONT, color: '64748B' })
                          ]
                        })
                      ]
                    }),
                    new TableCell({
                      width: { size: 74, type: WidthType.PERCENTAGE },
                      borders: NO_BORDERS,
                      children: [
                        new Paragraph({
                          spacing: { before: m.itemBefore, after: 15 },
                          children: [
                            new TextRun({ text: exp.role, bold: true, size: m.fontSizeBody + 0.5, font: FONT, color: '0F172A' }),
                            new TextRun({ text: ` — ${exp.company}`, bold: true, size: m.fontSizeBody, font: FONT, color: '334155' })
                          ]
                        }),
                        ...(exp.donor
                          ? [
                              new Paragraph({
                                spacing: { after: 20 },
                                children: [
                                  new TextRun({ text: `Programa/Doador: ${exp.donor}`, italics: true, size: m.fontSizeSubtext, font: FONT, color: '475569' })
                                ]
                              })
                            ]
                          : []),
                        ...exp.highlights.map(
                          (h) =>
                            new Paragraph({
                              bullet: { level: 0 },
                              spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
                              children: [new TextRun({ text: h, size: m.fontSizeBody, font: FONT, color: '1E293B' })]
                            })
                        )
                      ]
                    })
                  ]
                })
              ]
            })
          );
        });
        return expItems;

      case 'educations':
        if (!cv.educations || cv.educations.length === 0) return [];
        const eduItems: (Paragraph | Table)[] = [createEuropassHeading('Formação Académica')];
        cv.educations.forEach((edu) => {
          eduItems.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: NO_BORDERS,
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 26, type: WidthType.PERCENTAGE },
                      borders: NO_BORDERS,
                      children: [
                        new Paragraph({
                          spacing: { before: m.itemBefore, after: 15 },
                          children: [
                            new TextRun({ text: edu.period || '', bold: true, size: m.fontSizeSubtext, font: FONT, color: EU_BLUE })
                          ]
                        })
                      ]
                    }),
                    new TableCell({
                      width: { size: 74, type: WidthType.PERCENTAGE },
                      borders: NO_BORDERS,
                      children: [
                        new Paragraph({
                          spacing: { before: m.itemBefore, after: 15 },
                          children: [
                            new TextRun({ text: edu.degree, bold: true, size: m.fontSizeBody, font: FONT, color: '0F172A' }),
                            new TextRun({ text: ` — ${edu.institution}`, size: m.fontSizeBody, font: FONT, color: '334155' })
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
        const trainItems: (Paragraph | Table)[] = [createEuropassHeading('Formação Complementar & Certificações')];
        cv.trainings.forEach((t) => {
          trainItems.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
              children: [
                new TextRun({ text: t, size: m.fontSizeBody, font: FONT, color: '1E293B' })
              ]
            })
          );
        });
        return trainItems;

      case 'competencies':
        if (!cv.competencies || cv.competencies.length === 0) return [];
        const compItems: (Paragraph | Table)[] = [createEuropassHeading('Competências Pessoais & Técnicas')];
        cv.competencies.forEach((c) => {
          compItems.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
              children: [
                new TextRun({ text: `${c.category}: `, bold: true, size: m.fontSizeBody, font: FONT, color: EU_BLUE }),
                new TextRun({ text: c.description, size: m.fontSizeBody, font: FONT, color: '1E293B' })
              ]
            })
          );
        });
        return compItems;

      case 'languages':
        if (!cv.languages || cv.languages.length === 0) return [];
        const borderEu = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' };
        const langRows: TableRow[] = [
          new TableRow({
            children: [
              new TableCell({
                borders: { top: borderEu, bottom: borderEu, left: borderEu, right: borderEu },
                width: { size: 40, type: WidthType.PERCENTAGE },
                shading: { fill: 'F1F5F9' },
                children: [new Paragraph({ children: [new TextRun({ text: 'Língua', bold: true, size: m.fontSizeSubtext, font: FONT })] })]
              }),
              new TableCell({
                borders: { top: borderEu, bottom: borderEu, left: borderEu, right: borderEu },
                width: { size: 60, type: WidthType.PERCENTAGE },
                shading: { fill: 'F1F5F9' },
                children: [new Paragraph({ children: [new TextRun({ text: 'Nível CEFR / Proficiência', bold: true, size: m.fontSizeSubtext, font: FONT })] })]
              })
            ]
          })
        ];

        cv.languages.forEach((l) => {
          langRows.push(
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: borderEu, bottom: borderEu, left: borderEu, right: borderEu },
                  children: [new Paragraph({ children: [new TextRun({ text: l.language, bold: true, size: m.fontSizeSubtext, font: FONT })] })]
                }),
                new TableCell({
                  borders: { top: borderEu, bottom: borderEu, left: borderEu, right: borderEu },
                  children: [new Paragraph({ children: [new TextRun({ text: l.level, size: m.fontSizeSubtext, font: FONT })] })]
                })
              ]
            })
          );
        });

        return [
          createEuropassHeading('Línguas Estrangeiras (Quadro Europeu CEFR)'),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: langRows })
        ];

      case 'references':
        if (!cv.references || cv.references.length === 0) return [];
        const refItems: (Paragraph | Table)[] = [createEuropassHeading('Referências')];
        cv.references.forEach((r) => {
          refItems.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: NO_BORDERS,
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      borders: NO_BORDERS,
                      children: [
                        new Paragraph({
                          spacing: { before: m.itemBefore, after: 10 },
                          children: [new TextRun({ text: r.name, bold: true, size: m.fontSizeSubtext, font: FONT, color: EU_BLUE })]
                        })
                      ]
                    }),
                    new TableCell({
                      width: { size: 70, type: WidthType.PERCENTAGE },
                      borders: NO_BORDERS,
                      children: [
                        new Paragraph({
                          spacing: { before: m.itemBefore, after: 10 },
                          children: [
                            new TextRun({ text: `${r.institutionAndPosition} · Contacto: `, size: m.fontSizeSubtext, font: FONT }),
                            new TextRun({ text: r.contact, bold: true, size: m.fontSizeSubtext, font: FONT, color: '0F172A' })
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
    children.push(...renderEuropassSection(secKey));
  });

  return new Document({
    sections: [
      {
        properties: {
          page: {
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
// 3. CREATIVE SPLIT MODEL (Two-column layout with dark sidebar and photo)
// ============================================================================
function buildCreativeSplitDoc(
  cv: CVData,
  hasActivePlan: boolean,
  COLOR_PRIMARY: string,
  photoBytes: { data: Uint8Array; type: 'png' | 'jpg' } | null,
  density: 'compact' | 'normal' | 'relaxed'
): Document {
  const FONT = 'Arial';
  const SIDEBAR_BG = COLOR_PRIMARY || '0F172A';
  const m = getSpacingMetrics(density);
  const children: (Paragraph | Table)[] = [];

  if (!hasActivePlan) {
    children.push(createWatermarkNotice(FONT));
  }

  // Left Sidebar Content (White text on dark background)
  const sidebarElements: Paragraph[] = [];

  if (photoBytes) {
    sidebarElements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 80 },
        children: [
          new ImageRun({
            data: photoBytes.data,
            transformation: { width: 95, height: 95 },
            type: photoBytes.type
          })
        ]
      })
    );
  }

  sidebarElements.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 15 },
      children: [
        new TextRun({
          text: (cv.personalDetails.name || 'SEU NOME').toUpperCase(),
          bold: true,
          size: m.fontSizeTitle - 6,
          font: FONT,
          color: 'FFFFFF'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: cv.personalDetails.title || '',
          size: m.fontSizeSubtitle - 2,
          font: FONT,
          color: 'CBD5E1'
        })
      ]
    }),
    new Paragraph({
      spacing: { before: 60, after: 20 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '64748B' } },
      children: [
        new TextRun({ text: 'CONTACTOS', bold: true, size: m.fontSizeHeading - 2, font: FONT, color: 'FFFFFF' })
      ]
    }),
    new Paragraph({
      spacing: { after: 15, line: 240 },
      children: [
        new TextRun({ text: `${cv.personalDetails.location}\n`, size: m.fontSizeSubtext, font: FONT, color: 'E2E8F0' }),
        new TextRun({ text: `${cv.personalDetails.phone}\n`, size: m.fontSizeSubtext, font: FONT, color: 'E2E8F0' }),
        new TextRun({ text: `${cv.personalDetails.email}\n`, size: m.fontSizeSubtext, font: FONT, color: 'E2E8F0' }),
        cv.personalDetails.linkedin
          ? new TextRun({ text: `${cv.personalDetails.linkedin}\n`, size: m.fontSizeSubtext, font: FONT, color: 'E2E8F0' })
          : new TextRun({ text: '', size: 1 })
      ]
    })
  );

  if (isSecVisible(cv, 'competencies') && cv.competencies && cv.competencies.length > 0) {
    sidebarElements.push(
      new Paragraph({
        spacing: { before: 80, after: 20 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '64748B' } },
        children: [
          new TextRun({ text: 'COMPETÊNCIAS', bold: true, size: m.fontSizeHeading - 2, font: FONT, color: 'FFFFFF' })
        ]
      })
    );
    cv.competencies.forEach((c) => {
      sidebarElements.push(
        new Paragraph({
          spacing: { after: 15, line: 230 },
          children: [
            new TextRun({ text: `• ${c.category}: `, bold: true, size: m.fontSizeSubtext, font: FONT, color: 'FFFFFF' }),
            new TextRun({ text: c.description, size: m.fontSizeSubtext - 1, font: FONT, color: 'CBD5E1' })
          ]
        })
      );
    });
  }

  if (isSecVisible(cv, 'languages') && cv.languages && cv.languages.length > 0) {
    sidebarElements.push(
      new Paragraph({
        spacing: { before: 80, after: 20 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '64748B' } },
        children: [
          new TextRun({ text: 'IDIOMAS', bold: true, size: m.fontSizeHeading - 2, font: FONT, color: 'FFFFFF' })
        ]
      })
    );
    cv.languages.forEach((l) => {
      sidebarElements.push(
        new Paragraph({
          spacing: { after: 10 },
          children: [
            new TextRun({ text: `• ${l.language}: `, bold: true, size: m.fontSizeSubtext, font: FONT, color: 'FFFFFF' }),
            new TextRun({ text: l.level, size: m.fontSizeSubtext - 1, font: FONT, color: 'CBD5E1' })
          ]
        })
      );
    });
  }

  if (isSecVisible(cv, 'references') && cv.references && cv.references.length > 0) {
    sidebarElements.push(
      new Paragraph({
        spacing: { before: 80, after: 20 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '64748B' } },
        children: [
          new TextRun({ text: 'REFERÊNCIAS', bold: true, size: m.fontSizeHeading - 2, font: FONT, color: 'FFFFFF' })
        ]
      })
    );
    cv.references.forEach((r) => {
      sidebarElements.push(
        new Paragraph({
          spacing: { after: 10 },
          children: [
            new TextRun({ text: `• ${r.name}: `, bold: true, size: m.fontSizeSubtext, font: FONT, color: 'FFFFFF' }),
            new TextRun({ text: `${r.institutionAndPosition} (${r.contact})`, size: m.fontSizeSubtext - 1, font: FONT, color: 'CBD5E1' })
          ]
        })
      );
    });
  }

  // Right Main Column Content
  const mainElements: Paragraph[] = [];

  function createCreativeHeading(title: string): Paragraph {
    return new Paragraph({
      spacing: { before: m.sectionBefore, after: m.sectionAfter },
      keepNext: true,
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_PRIMARY, space: 2 }
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: m.fontSizeHeading,
          font: FONT,
          color: COLOR_PRIMARY
        })
      ]
    });
  }

  function renderCreativeMainSection(key: CVSectionKey): Paragraph[] {
    if (!isSecVisible(cv, key)) return [];
    switch (key) {
      case 'summary':
        if (!cv.summary) return [];
        return [
          createCreativeHeading('Perfil Profissional'),
          new Paragraph({
            spacing: { after: m.summaryAfter, line: m.lineSpacing },
            children: [new TextRun({ text: cv.summary, size: m.fontSizeBody, font: FONT, color: '1E293B' })]
          })
        ];

      case 'experiences':
        if (!cv.experiences || cv.experiences.length === 0) return [];
        const expItems: Paragraph[] = [createCreativeHeading('Experiência Profissional')];
        cv.experiences.forEach((exp) => {
          expItems.push(
            new Paragraph({
              spacing: { before: m.itemBefore, after: 10 },
              children: [
                new TextRun({ text: exp.role, bold: true, size: m.fontSizeBody + 0.5, font: FONT, color: '0F172A' }),
                new TextRun({ text: ` — ${exp.company}`, bold: true, size: m.fontSizeBody, font: FONT, color: '475569' }),
                new TextRun({ text: ` (${exp.period})`, italics: true, size: m.fontSizeSubtext, font: FONT, color: '64748B' })
              ]
            })
          );
          if (exp.donor) {
            expItems.push(
              new Paragraph({
                spacing: { after: 15 },
                children: [new TextRun({ text: `Programa: ${exp.donor}`, italics: true, size: m.fontSizeSubtext, font: FONT, color: '64748B' })]
              })
            );
          }
          exp.highlights.forEach((h) => {
            if (!h.trim()) return;
            expItems.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
                children: [new TextRun({ text: h, size: m.fontSizeBody, font: FONT, color: '1E293B' })]
              })
            );
          });
        });
        return expItems;

      case 'educations':
        if (!cv.educations || cv.educations.length === 0) return [];
        const eduItems: Paragraph[] = [createCreativeHeading('Formação Académica')];
        cv.educations.forEach((edu) => {
          eduItems.push(
            new Paragraph({
              spacing: { before: m.itemBefore, after: 15 },
              children: [
                new TextRun({ text: edu.degree, bold: true, size: m.fontSizeBody, font: FONT, color: '0F172A' }),
                new TextRun({ text: ` — ${edu.institution} (${edu.period})`, size: m.fontSizeBody, font: FONT, color: '334155' })
              ]
            })
          );
        });
        return eduItems;

      case 'trainings':
        if (!cv.trainings || cv.trainings.length === 0) return [];
        const trItems: Paragraph[] = [createCreativeHeading('Certificações & Cursos')];
        cv.trainings.forEach((t) => {
          trItems.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
              children: [
                new TextRun({ text: t, size: m.fontSizeBody, font: FONT, color: '1E293B' })
              ]
            })
          );
        });
        return trItems;

      default:
        return [];
    }
  }

  const effectiveOrder: CVSectionKey[] =
    cv.sectionOrder && cv.sectionOrder.length > 0 ? cv.sectionOrder : DEFAULT_SECTION_ORDER;

  effectiveOrder.forEach((secKey) => {
    mainElements.push(...renderCreativeMainSection(secKey));
  });

  // Create 2-column Word Table
  const splitTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 34, type: WidthType.PERCENTAGE },
            shading: { fill: SIDEBAR_BG },
            borders: NO_BORDERS,
            children: sidebarElements
          }),
          new TableCell({
            width: { size: 66, type: WidthType.PERCENTAGE },
            borders: NO_BORDERS,
            children: mainElements
          })
        ]
      })
    ]
  });

  children.push(splitTable);

  return new Document({
    sections: [
      {
        properties: {
          page: {
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
// 4. TECH MODERN MODEL (Tech badges, portfolio links, clean modern sans)
// ============================================================================
function buildTechModernDoc(
  cv: CVData,
  hasActivePlan: boolean,
  COLOR_PRIMARY: string,
  photoBytes: { data: Uint8Array; type: 'png' | 'jpg' } | null,
  density: 'compact' | 'normal' | 'relaxed'
): Document {
  const FONT = 'Calibri';
  const m = getSpacingMetrics(density);
  const children: (Paragraph | Table)[] = [];

  if (!hasActivePlan) {
    children.push(createWatermarkNotice(FONT));
  }

  // Header Table
  const headerCells: TableCell[] = [
    new TableCell({
      width: { size: photoBytes ? 78 : 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      children: [
        new Paragraph({
          spacing: { after: 20 },
          children: [
            new TextRun({
              text: cv.personalDetails.name || 'SEU NOME',
              bold: true,
              size: m.fontSizeTitle,
              font: FONT,
              color: COLOR_PRIMARY
            })
          ]
        }),
        new Paragraph({
          spacing: { after: 35 },
          children: [
            new TextRun({
              text: `// ${cv.personalDetails.title || 'Tech Lead & Software Architect'}`,
              bold: true,
              size: m.fontSizeSubtitle,
              font: FONT,
              color: '0D9488'
            })
          ]
        }),
        new Paragraph({
          spacing: { after: m.summaryAfter },
          children: [
            new TextRun({
              text: [
                cv.personalDetails.location,
                cv.personalDetails.phone,
                cv.personalDetails.email,
                cv.personalDetails.website ? `Portfolio: ${cv.personalDetails.website}` : '',
                cv.personalDetails.linkedin ? `LinkedIn: ${cv.personalDetails.linkedin}` : ''
              ]
                .filter(Boolean)
                .join('   |   '),
              size: m.fontSizeSubtext,
              font: FONT,
              color: '475569'
            })
          ]
        })
      ]
    })
  ];

  if (photoBytes) {
    headerCells.push(
      new TableCell({
        width: { size: 22, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
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

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [new TableRow({ children: headerCells })]
    })
  );

  function createTechHeading(title: string): Paragraph {
    return new Paragraph({
      spacing: { before: m.sectionBefore, after: m.sectionAfter },
      keepNext: true,
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 8, color: '0D9488', space: 2 }
      },
      children: [
        new TextRun({
          text: `> ${title.toUpperCase()}`,
          bold: true,
          size: m.fontSizeHeading,
          font: FONT,
          color: COLOR_PRIMARY
        })
      ]
    });
  }

  function renderTechSection(key: CVSectionKey): Paragraph[] {
    if (!isSecVisible(cv, key)) return [];
    switch (key) {
      case 'summary':
        if (!cv.summary) return [];
        return [
          createTechHeading('Architecture & Leadership Profile'),
          new Paragraph({
            spacing: { after: m.summaryAfter, line: m.lineSpacing },
            children: [new TextRun({ text: cv.summary, size: m.fontSizeBody, font: FONT, color: '1E293B' })]
          })
        ];

      case 'competencies':
        if (!cv.competencies || cv.competencies.length === 0) return [];
        const compItems: Paragraph[] = [createTechHeading('Technical Skills & Stack')];
        cv.competencies.forEach((c) => {
          compItems.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
              children: [
                new TextRun({ text: `${c.category}: `, bold: true, size: m.fontSizeBody, font: FONT, color: '0F172A' }),
                new TextRun({ text: c.description, size: m.fontSizeBody, font: FONT, color: '334155' })
              ]
            })
          );
        });
        return compItems;

      case 'experiences':
        if (!cv.experiences || cv.experiences.length === 0) return [];
        const expItems: Paragraph[] = [createTechHeading('Professional Experience')];
        cv.experiences.forEach((exp) => {
          expItems.push(
            new Paragraph({
              spacing: { before: m.itemBefore, after: 15 },
              children: [
                new TextRun({ text: exp.role, bold: true, size: m.fontSizeBody + 0.5, font: FONT, color: '0F172A' }),
                new TextRun({ text: ` @ ${exp.company}`, bold: true, size: m.fontSizeBody, font: FONT, color: '0D9488' }),
                new TextRun({ text: `  [${exp.period}]`, size: m.fontSizeSubtext, font: FONT, color: '64748B' })
              ]
            })
          );
          if (exp.donor) {
            expItems.push(
              new Paragraph({
                spacing: { after: 15 },
                children: [new TextRun({ text: `Tech Stack / Project: ${exp.donor}`, italics: true, size: m.fontSizeSubtext, font: FONT, color: '64748B' })]
              })
            );
          }
          exp.highlights.forEach((h) => {
            if (!h.trim()) return;
            expItems.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
                children: [new TextRun({ text: h, size: m.fontSizeBody, font: FONT, color: '1E293B' })]
              })
            );
          });
        });
        return expItems;

      case 'educations':
        if (!cv.educations || cv.educations.length === 0) return [];
        const eduItems: Paragraph[] = [createTechHeading('Education & Credentials')];
        cv.educations.forEach((edu) => {
          eduItems.push(
            new Paragraph({
              spacing: { before: m.itemBefore, after: 15 },
              children: [
                new TextRun({ text: edu.degree, bold: true, size: m.fontSizeBody, font: FONT, color: '0F172A' }),
                new TextRun({ text: ` — ${edu.institution} (${edu.period})`, size: m.fontSizeBody, font: FONT, color: '334155' })
              ]
            })
          );
        });
        return eduItems;

      case 'trainings':
        if (!cv.trainings || cv.trainings.length === 0) return [];
        const trItems: Paragraph[] = [createTechHeading('Certifications & Specializations')];
        cv.trainings.forEach((t) => {
          trItems.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
              children: [
                new TextRun({ text: t, size: m.fontSizeBody, font: FONT, color: '1E293B' })
              ]
            })
          );
        });
        return trItems;

      case 'languages':
        if (!cv.languages || cv.languages.length === 0) return [];
        const langItems: Paragraph[] = [createTechHeading('Languages')];
        const langRuns: TextRun[] = [];
        cv.languages.forEach((l, idx) => {
          langRuns.push(
            new TextRun({ text: `${l.language}: `, bold: true, size: m.fontSizeBody, font: FONT }),
            new TextRun({ text: `${l.level}${idx < cv.languages.length - 1 ? '   |   ' : ''}`, size: m.fontSizeBody, font: FONT, color: '475569' })
          );
        });
        langItems.push(new Paragraph({ spacing: { after: m.summaryAfter }, children: langRuns }));
        return langItems;

      case 'references':
        if (!cv.references || cv.references.length === 0) return [];
        const refItems: Paragraph[] = [createTechHeading('References & Endorsements')];
        cv.references.forEach((r) => {
          refItems.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
              children: [
                new TextRun({ text: `${r.name} `, bold: true, size: m.fontSizeBody, font: FONT, color: '0F172A' }),
                new TextRun({ text: `(${r.institutionAndPosition}) · Contact: `, size: m.fontSizeBody, font: FONT, color: '475569' }),
                new TextRun({ text: r.contact, bold: true, size: m.fontSizeBody, font: FONT, color: '0D9488' })
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
    children.push(...renderTechSection(secKey));
  });

  return new Document({
    sections: [
      {
        properties: {
          page: {
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
// 5. ATS COMPACT MODEL (Strict US text-first, zero tables, monospace)
// ============================================================================
function buildAtsCompactDoc(
  cv: CVData,
  hasActivePlan: boolean,
  density: 'compact' | 'normal' | 'relaxed'
): Document {
  const FONT = 'Consolas';
  const m = getSpacingMetrics(density);
  const children: (Paragraph | Table)[] = [];

  if (!hasActivePlan) {
    children.push(createWatermarkNotice(FONT));
  }

  // ATS Header
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: (cv.personalDetails.name || 'SEU NOME').toUpperCase(),
          bold: true,
          size: m.fontSizeTitle - 4,
          font: FONT,
          color: '000000'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 30 },
      children: [
        new TextRun({
          text: (cv.personalDetails.title || '').toUpperCase(),
          bold: true,
          size: m.fontSizeSubtitle - 2,
          font: FONT,
          color: '333333'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: m.summaryAfter },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
      children: [
        new TextRun({
          text: [
            cv.personalDetails.location,
            cv.personalDetails.phone,
            cv.personalDetails.email,
            cv.personalDetails.linkedin
          ]
            .filter(Boolean)
            .join(' | '),
          size: m.fontSizeSubtext,
          font: FONT,
          color: '000000'
        })
      ]
    })
  );

  function createAtsHeading(title: string): Paragraph {
    return new Paragraph({
      spacing: { before: m.sectionBefore, after: m.sectionAfter },
      keepNext: true,
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' } },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: m.fontSizeHeading,
          font: FONT,
          color: '000000'
        })
      ]
    });
  }

  function renderAtsSection(key: CVSectionKey): Paragraph[] {
    if (!isSecVisible(cv, key)) return [];
    switch (key) {
      case 'summary':
        if (!cv.summary) return [];
        return [
          createAtsHeading('PROFESSIONAL SUMMARY'),
          new Paragraph({
            spacing: { after: m.summaryAfter, line: m.lineSpacing },
            children: [new TextRun({ text: cv.summary, size: m.fontSizeBody, font: FONT, color: '000000' })]
          })
        ];

      case 'competencies':
        if (!cv.competencies || cv.competencies.length === 0) return [];
        const compItems: Paragraph[] = [createAtsHeading('CORE COMPETENCIES')];
        cv.competencies.forEach((c) => {
          compItems.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
              children: [
                new TextRun({ text: `${c.category}: `, bold: true, size: m.fontSizeBody, font: FONT }),
                new TextRun({ text: c.description, size: m.fontSizeBody, font: FONT })
              ]
            })
          );
        });
        return compItems;

      case 'experiences':
        if (!cv.experiences || cv.experiences.length === 0) return [];
        const expItems: Paragraph[] = [createAtsHeading('PROFESSIONAL EXPERIENCE')];
        cv.experiences.forEach((exp) => {
          expItems.push(
            new Paragraph({
              spacing: { before: m.itemBefore, after: 10 },
              children: [
                new TextRun({ text: `${exp.role} - ${exp.company}`, bold: true, size: m.fontSizeBody, font: FONT }),
                new TextRun({ text: ` (${exp.period})`, size: m.fontSizeSubtext, font: FONT })
              ]
            })
          );
          if (exp.donor) {
            expItems.push(
              new Paragraph({
                spacing: { after: 10 },
                children: [new TextRun({ text: `Program: ${exp.donor}`, italics: true, size: m.fontSizeSubtext, font: FONT })]
              })
            );
          }
          exp.highlights.forEach((h) => {
            if (!h.trim()) return;
            expItems.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
                children: [new TextRun({ text: h, size: m.fontSizeBody, font: FONT })]
              })
            );
          });
        });
        return expItems;

      case 'educations':
        if (!cv.educations || cv.educations.length === 0) return [];
        const eduItems: Paragraph[] = [createAtsHeading('EDUCATION')];
        cv.educations.forEach((edu) => {
          eduItems.push(
            new Paragraph({
              spacing: { before: m.itemBefore, after: 15 },
              children: [
                new TextRun({ text: `${edu.degree} - ${edu.institution} (${edu.period})`, size: m.fontSizeBody, font: FONT })
              ]
            })
          );
        });
        return eduItems;

      case 'trainings':
        if (!cv.trainings || cv.trainings.length === 0) return [];
        const trainItems: Paragraph[] = [createAtsHeading('CERTIFICATIONS & TRAINING')];
        cv.trainings.forEach((t) => {
          trainItems.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
              children: [
                new TextRun({ text: t, size: m.fontSizeBody, font: FONT })
              ]
            })
          );
        });
        return trainItems;

      case 'languages':
        if (!cv.languages || cv.languages.length === 0) return [];
        const langItems: Paragraph[] = [createAtsHeading('LANGUAGES')];
        const langRuns: TextRun[] = [];
        cv.languages.forEach((l, idx) => {
          langRuns.push(
            new TextRun({ text: `${l.language}: `, bold: true, size: m.fontSizeBody, font: FONT }),
            new TextRun({ text: `${l.level}${idx < cv.languages.length - 1 ? ' | ' : ''}`, size: m.fontSizeBody, font: FONT })
          );
        });
        langItems.push(new Paragraph({ spacing: { after: m.summaryAfter }, children: langRuns }));
        return langItems;

      case 'references':
        if (!cv.references || cv.references.length === 0) return [];
        const refItems: Paragraph[] = [createAtsHeading('REFERENCES')];
        cv.references.forEach((r) => {
          refItems.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
              children: [
                new TextRun({ text: `${r.name} - ${r.institutionAndPosition} (${r.contact})`, size: m.fontSizeBody, font: FONT })
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
    children.push(...renderAtsSection(secKey));
  });

  return new Document({
    sections: [
      {
        properties: {
          page: {
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
// 6. MODERN EUROPEAN / NORDIC MINIMALIST / UN CLASSIC (Clean Header + Photo)
// ============================================================================
function buildModernEuropeanDoc(
  cv: CVData,
  hasActivePlan: boolean,
  COLOR_PRIMARY: string,
  photoBytes: { data: Uint8Array; type: 'png' | 'jpg' } | null,
  density: 'compact' | 'normal' | 'relaxed',
  fontFamily: string = 'Calibri'
): Document {
  const m = getSpacingMetrics(density);
  const children: (Paragraph | Table)[] = [];

  if (!hasActivePlan) {
    children.push(createWatermarkNotice(fontFamily));
  }

  // Header Table with Photo
  const headerCells: TableCell[] = [
    new TableCell({
      width: { size: photoBytes ? 76 : 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      children: [
        new Paragraph({
          spacing: { after: 15 },
          children: [
            new TextRun({
              text: cv.personalDetails.name || 'SEU NOME COMPLETO',
              bold: true,
              size: m.fontSizeTitle,
              font: fontFamily,
              color: COLOR_PRIMARY
            })
          ]
        }),
        new Paragraph({
          spacing: { after: 30 },
          children: [
            new TextRun({
              text: cv.personalDetails.title || '',
              bold: true,
              size: m.fontSizeSubtitle,
              font: fontFamily,
              color: '475569'
            })
          ]
        }),
        new Paragraph({
          spacing: { after: m.summaryAfter },
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_PRIMARY, space: 4 } },
          children: [
            new TextRun({
              text: [
                cv.personalDetails.location,
                cv.personalDetails.phone,
                cv.personalDetails.email,
                cv.personalDetails.linkedin
              ]
                .filter(Boolean)
                .join('   |   '),
              size: m.fontSizeSubtext,
              font: fontFamily,
              color: '64748B'
            })
          ]
        })
      ]
    })
  ];

  if (photoBytes) {
    headerCells.push(
      new TableCell({
        width: { size: 24, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 15 },
            children: [
              new ImageRun({
                data: photoBytes.data,
                transformation: { width: 90, height: 90 },
                type: photoBytes.type
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
      rows: [new TableRow({ children: headerCells })]
    })
  );

  function createModernSectionHeading(title: string): Paragraph {
    return new Paragraph({
      spacing: { before: m.sectionBefore, after: m.sectionAfter },
      keepNext: true,
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY, space: 2 }
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: m.fontSizeHeading,
          font: fontFamily,
          color: COLOR_PRIMARY
        })
      ]
    });
  }

  function renderModernSection(key: CVSectionKey): (Paragraph | Table)[] {
    if (!isSecVisible(cv, key)) return [];
    switch (key) {
      case 'summary':
        if (!cv.summary) return [];
        return [
          createModernSectionHeading('Resumo Profissional'),
          new Paragraph({
            spacing: { after: m.summaryAfter, line: m.lineSpacing },
            children: [new TextRun({ text: cv.summary, size: m.fontSizeBody, font: fontFamily, color: '1E293B' })]
          })
        ];

      case 'competencies':
        if (!cv.competencies || cv.competencies.length === 0) return [];
        const compItems: (Paragraph | Table)[] = [createModernSectionHeading('Competências & Habilidades Chave')];
        cv.competencies.forEach((c) => {
          compItems.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
              children: [
                new TextRun({ text: `${c.category}: `, bold: true, size: m.fontSizeBody, font: fontFamily, color: COLOR_PRIMARY }),
                new TextRun({ text: c.description, size: m.fontSizeBody, font: fontFamily, color: '334155' })
              ]
            })
          );
        });
        return compItems;

      case 'experiences':
        if (!cv.experiences || cv.experiences.length === 0) return [];
        const expItems: (Paragraph | Table)[] = [createModernSectionHeading('Experiência Profissional')];
        cv.experiences.forEach((exp) => {
          expItems.push(
            new Paragraph({
              spacing: { before: m.itemBefore, after: 15 },
              children: [
                new TextRun({ text: exp.role, bold: true, size: m.fontSizeBody + 0.5, font: fontFamily, color: '0F172A' }),
                new TextRun({ text: ` — ${exp.company}`, bold: true, size: m.fontSizeBody, font: fontFamily, color: COLOR_PRIMARY }),
                new TextRun({ text: `  (${exp.period}${exp.location ? ` · ${exp.location}` : ''})`, size: m.fontSizeSubtext, font: fontFamily, color: '64748B' })
              ]
            })
          );
          if (exp.donor) {
            expItems.push(
              new Paragraph({
                spacing: { after: 20 },
                children: [new TextRun({ text: `Projeto: ${exp.donor}`, italics: true, size: m.fontSizeSubtext, font: fontFamily, color: '64748B' })]
              })
            );
          }
          exp.highlights.forEach((h) => {
            if (!h.trim()) return;
            expItems.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
                children: [new TextRun({ text: h, size: m.fontSizeBody, font: fontFamily, color: '1E293B' })]
              })
            );
          });
        });
        return expItems;

      case 'educations':
        if (!cv.educations || cv.educations.length === 0) return [];
        const eduItems: (Paragraph | Table)[] = [createModernSectionHeading('Formação Académica')];
        cv.educations.forEach((edu) => {
          eduItems.push(
            new Paragraph({
              spacing: { before: m.itemBefore, after: 15 },
              children: [
                new TextRun({ text: edu.degree, bold: true, size: m.fontSizeBody, font: fontFamily, color: '0F172A' }),
                new TextRun({ text: ` — ${edu.institution} (${edu.period})`, size: m.fontSizeBody, font: fontFamily, color: '334155' })
              ]
            })
          );
        });
        return eduItems;

      case 'trainings':
        if (!cv.trainings || cv.trainings.length === 0) return [];
        const trainItems: (Paragraph | Table)[] = [createModernSectionHeading('Formação Complementar & Certificações')];
        cv.trainings.forEach((t) => {
          trainItems.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 0, after: m.bulletAfter, line: m.lineSpacing },
              children: [
                new TextRun({ text: t, size: m.fontSizeBody, font: fontFamily, color: '1E293B' })
              ]
            })
          );
        });
        return trainItems;

      case 'languages':
        if (!cv.languages || cv.languages.length === 0) return [];
        const langItems: (Paragraph | Table)[] = [createModernSectionHeading('Idiomas & Proficiência')];
        const langRuns: TextRun[] = [];
        cv.languages.forEach((l, idx) => {
          langRuns.push(
            new TextRun({ text: `• ${l.language}: `, bold: true, size: m.fontSizeBody, font: fontFamily }),
            new TextRun({ text: `${l.level}${idx < cv.languages.length - 1 ? '   |   ' : ''}`, size: m.fontSizeBody, font: fontFamily, color: '64748B' })
          );
        });
        langItems.push(new Paragraph({ spacing: { after: m.summaryAfter }, children: langRuns }));
        return langItems;

      case 'references':
        if (!cv.references || cv.references.length === 0) return [];
        const refItems: (Paragraph | Table)[] = [createModernSectionHeading('Referências Profissionais')];
        const borderConfig = { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' };
        const headerCells = ['Nome', 'Instituição & Cargo', 'Contacto'].map(
          (h) =>
            new TableCell({
              borders: { top: borderConfig, bottom: { ...borderConfig, size: 8, color: '9CA3AF' }, left: borderConfig, right: borderConfig },
              children: [
                new Paragraph({
                  spacing: { before: 40, after: 40 },
                  children: [new TextRun({ text: h, bold: true, size: m.fontSizeSubtext, font: fontFamily, color: COLOR_PRIMARY })]
                })
              ]
            })
        );
        const rows: TableRow[] = [new TableRow({ children: headerCells })];

        cv.references.forEach((ref) => {
          rows.push(
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: borderConfig, bottom: borderConfig, left: borderConfig, right: borderConfig },
                  children: [new Paragraph({ children: [new TextRun({ text: ref.name, bold: true, size: m.fontSizeSubtext - 1, font: fontFamily })] })]
                }),
                new TableCell({
                  borders: { top: borderConfig, bottom: borderConfig, left: borderConfig, right: borderConfig },
                  children: [new Paragraph({ children: [new TextRun({ text: ref.institutionAndPosition, size: m.fontSizeSubtext - 1, font: fontFamily })] })]
                }),
                new TableCell({
                  borders: { top: borderConfig, bottom: borderConfig, left: borderConfig, right: borderConfig },
                  children: [new Paragraph({ children: [new TextRun({ text: ref.contact, size: m.fontSizeSubtext - 1, font: fontFamily })] })]
                })
              ]
            })
          );
        });
        refItems.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
        return refItems;

      default:
        return [];
    }
  }

  const effectiveOrder: CVSectionKey[] =
    cv.sectionOrder && cv.sectionOrder.length > 0 ? cv.sectionOrder : DEFAULT_SECTION_ORDER;

  effectiveOrder.forEach((secKey) => {
    children.push(...renderModernSection(secKey));
  });

  return new Document({
    sections: [
      {
        properties: {
          page: {
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
// MAIN WORD EXPORT DISPATCHER (Resolves Template Style, Spacing Density & Photo)
// ============================================================================
export async function generateWordDocument(
  cv: CVData,
  hasActivePlan: boolean = true,
  density: 'compact' | 'normal' | 'relaxed' = 'normal'
): Promise<Blob> {
  const COLOR_PRIMARY = cv.accentColor ? cv.accentColor.replace('#', '') : '0F172A';

  // Fetch photo bytes if enabled
  const hasPhotoEnabled = cv.personalDetails.showPhoto !== false && Boolean(cv.personalDetails.photoUrl);
  const photoBytes = hasPhotoEnabled ? await getPhotoBytes(cv.personalDetails.photoUrl) : null;

  let doc: Document;

  switch (cv.templateStyle) {
    case 'executive_harvard':
      doc = buildHarvardDoc(cv, hasActivePlan, COLOR_PRIMARY, density);
      break;

    case 'european_europass':
      doc = buildEuropassDoc(cv, hasActivePlan, COLOR_PRIMARY, photoBytes, density);
      break;

    case 'creative_split':
      doc = buildCreativeSplitDoc(cv, hasActivePlan, COLOR_PRIMARY, photoBytes, density);
      break;

    case 'tech_modern':
      doc = buildTechModernDoc(cv, hasActivePlan, COLOR_PRIMARY, photoBytes, density);
      break;

    case 'ats_compact':
      doc = buildAtsCompactDoc(cv, hasActivePlan, density);
      break;

    case 'un_classic':
    case 'academic_lattes':
      doc = buildModernEuropeanDoc(cv, hasActivePlan, COLOR_PRIMARY, photoBytes, density, 'Times New Roman');
      break;

    case 'hybrid_minimalist':
      doc = buildModernEuropeanDoc(cv, hasActivePlan, COLOR_PRIMARY, photoBytes, density, 'Arial');
      break;

    case 'european_modern':
    default:
      doc = buildModernEuropeanDoc(cv, hasActivePlan, COLOR_PRIMARY, photoBytes, density, 'Calibri');
      break;
  }

  return await Packer.toBlob(doc);
}

export async function generateCoverLetterDocx(
  cv: CVData,
  letterBody: string,
  hasActivePlan: boolean = true
): Promise<Blob> {
  const COLOR_PRIMARY = '111827';
  const COLOR_MUTED = '4B5563';
  const FONT_FAMILY = 'Times New Roman';

  const docChildren: Paragraph[] = [];

  if (!hasActivePlan) {
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        border: {
          bottom: { style: BorderStyle.DASHED, size: 6, color: 'DC2626' },
          top: { style: BorderStyle.DASHED, size: 6, color: 'DC2626' }
        },
        children: [
          new TextRun({
            text: '★ PRÉ-VISUALIZAÇÃO DEMONSTRATIVA · CARTA DE APRESENTAÇÃO ★',
            bold: true,
            size: 18,
            font: FONT_FAMILY,
            color: 'DC2626'
          }),
          new TextRun({
            text: '\n(Documento de demonstração com marca de água. Ative o plano Pro ou VIP para a versão oficial)',
            italics: true,
            size: 15,
            font: FONT_FAMILY,
            color: '64748B'
          })
        ]
      })
    );
  }

  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 30 },
      children: [
        new TextRun({
          text: (cv.personalDetails.name || 'SEU NOME').toUpperCase(),
          bold: true,
          size: 32,
          font: FONT_FAMILY,
          color: COLOR_PRIMARY
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: cv.personalDetails.title || '',
          bold: true,
          size: 21,
          font: FONT_FAMILY,
          color: COLOR_MUTED
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 6,
          color: 'CCCCCC',
          space: 4
        }
      },
      children: [
        new TextRun({
          text: [
            cv.personalDetails.location,
            cv.personalDetails.phone,
            cv.personalDetails.email,
            cv.personalDetails.linkedin
          ]
            .filter(Boolean)
            .join('  |  '),
          size: 19,
          font: FONT_FAMILY,
          color: COLOR_MUTED
        })
      ]
    })
  );

  const paragraphs = letterBody.split('\n');
  let currentBlock: string[] = [];

  for (const line of paragraphs) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentBlock.length > 0) {
        const textBlock = currentBlock.join(' ');
        const isSubject = textBlock.toLowerCase().startsWith('assunto:');
        const isAc = textBlock.toLowerCase().startsWith('a/c:');

        docChildren.push(
          new Paragraph({
            spacing: {
              before: isSubject ? 100 : 50,
              after: isSubject ? 100 : 80,
              line: 260
            },
            children: [
              new TextRun({
                text: textBlock,
                bold: isSubject || isAc,
                size: 21,
                font: FONT_FAMILY,
                color: COLOR_PRIMARY
              })
            ]
          })
        );
        currentBlock = [];
      }
    } else {
      if (
        trimmed.startsWith('A/C:') ||
        trimmed.startsWith('Assunto:') ||
        trimmed.includes('@') ||
        trimmed.length < 50
      ) {
        if (currentBlock.length > 0) {
          docChildren.push(
            new Paragraph({
              spacing: { after: 60, line: 260 },
              children: [
                new TextRun({
                  text: currentBlock.join(' '),
                  size: 21,
                  font: FONT_FAMILY,
                  color: COLOR_PRIMARY
                })
              ]
            })
          );
          currentBlock = [];
        }
        const isBold = trimmed.startsWith('A/C:') || trimmed.startsWith('Assunto:');
        docChildren.push(
          new Paragraph({
            spacing: { after: trimmed.startsWith('Assunto:') ? 100 : 30, line: 250 },
            children: [
              new TextRun({
                text: trimmed,
                bold: isBold,
                size: 21,
                font: FONT_FAMILY,
                color: COLOR_PRIMARY
              })
            ]
          })
        );
      } else {
        currentBlock.push(trimmed);
      }
    }
  }

  if (currentBlock.length > 0) {
    docChildren.push(
      new Paragraph({
        spacing: { after: 80, line: 260 },
        children: [
          new TextRun({
            text: currentBlock.join(' '),
            size: 21,
            font: FONT_FAMILY,
            color: COLOR_PRIMARY
          })
        ]
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.65),
              bottom: convertInchesToTwip(0.65),
              left: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75)
            }
          }
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
