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
import { CVData } from '../types/cv';

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
      const res = await fetch(photoUrl);
      if (!res.ok) return null;
      const buf = await res.arrayBuffer();
      const contentType = res.headers.get('content-type') || '';
      const type: 'png' | 'jpg' = contentType.includes('png') ? 'png' : 'jpg';
      return { data: new Uint8Array(buf), type };
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

function createWatermarkNotice(fontFamily: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 140 },
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
  COLOR_PRIMARY: string
): Document {
  const FONT = 'Times New Roman';
  const children: (Paragraph | Table)[] = [];

  if (!hasActivePlan) {
    children.push(createWatermarkNotice(FONT));
  }

  // Harvard Header: Strict left-aligned with bold line
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 30 },
      children: [
        new TextRun({
          text: (cv.personalDetails.name || 'SEU NOME').toUpperCase(),
          bold: true,
          size: 34, // 17pt
          font: FONT,
          color: COLOR_PRIMARY
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 50 },
      children: [
        new TextRun({
          text: cv.personalDetails.title || '',
          italics: true,
          bold: true,
          size: 22,
          font: FONT,
          color: '334155'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 140 },
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
          size: 19,
          font: FONT,
          color: '475569'
        })
      ]
    })
  );

  function createHarvardSectionHeading(title: string): Paragraph {
    return new Paragraph({
      spacing: { before: 200, after: 60 },
      keepNext: true,
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: '64748B', space: 2 }
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 21,
          font: FONT,
          color: COLOR_PRIMARY
        })
      ]
    });
  }

  // Summary
  if (cv.summary) {
    children.push(createHarvardSectionHeading('Executive Summary'));
    children.push(
      new Paragraph({
        spacing: { after: 120, line: 260 },
        children: [
          new TextRun({
            text: cv.summary,
            size: 20.5,
            font: FONT,
            color: '1E293B'
          })
        ]
      })
    );
  }

  // Experience
  if (cv.experiences && cv.experiences.length > 0) {
    children.push(createHarvardSectionHeading('Professional Experience'));

    cv.experiences.forEach((exp) => {
      // 2-column borderless row: Left (Role, Company), Right (Period, Location)
      children.push(
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
                      spacing: { before: 80, after: 10 },
                      children: [
                        new TextRun({ text: exp.role, bold: true, size: 21, font: FONT, color: '0F172A' }),
                        new TextRun({ text: ` — ${exp.company}`, size: 20, font: FONT, color: '334155' })
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
                      spacing: { before: 80, after: 10 },
                      children: [
                        new TextRun({
                          text: exp.period ? `${exp.period}${exp.location ? ` | ${exp.location}` : ''}` : '',
                          size: 19,
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
        children.push(
          new Paragraph({
            spacing: { after: 30 },
            children: [
              new TextRun({ text: `Financiador/Projeto: ${exp.donor}`, italics: true, size: 19, font: FONT, color: '475569' })
            ]
          })
        );
      }

      exp.highlights.forEach((h) => {
        if (!h.trim()) return;
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 35, line: 250 },
            children: [new TextRun({ text: h, size: 20, font: FONT, color: '1E293B' })]
          })
        );
      });
    });
  }

  // Education
  if (cv.educations && cv.educations.length > 0) {
    children.push(createHarvardSectionHeading('Education'));
    cv.educations.forEach((edu) => {
      children.push(
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
                      spacing: { before: 40, after: 20 },
                      children: [
                        new TextRun({ text: edu.degree, bold: true, size: 20.5, font: FONT, color: '0F172A' }),
                        new TextRun({ text: ` — ${edu.institution}`, size: 20, font: FONT, color: '334155' })
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
                      spacing: { before: 40, after: 20 },
                      children: [
                        new TextRun({ text: edu.period, size: 19, font: FONT, italics: true, color: '475569' })
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
  }

  // Competencies
  if (cv.competencies && cv.competencies.length > 0) {
    children.push(createHarvardSectionHeading('Key Competencies'));
    cv.competencies.forEach((c) => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 30 },
          children: [
            new TextRun({ text: `${c.category}: `, bold: true, size: 20, font: FONT, color: '0F172A' }),
            new TextRun({ text: c.description, size: 20, font: FONT, color: '334155' })
          ]
        })
      );
    });
  }

  // Languages
  if (cv.languages && cv.languages.length > 0) {
    children.push(createHarvardSectionHeading('Languages'));
    const langRuns: TextRun[] = [];
    cv.languages.forEach((l, idx) => {
      langRuns.push(
        new TextRun({ text: `${l.language}: `, bold: true, size: 20, font: FONT }),
        new TextRun({ text: `${l.level}${idx < cv.languages.length - 1 ? '   |   ' : ''}`, size: 20, font: FONT, color: '475569' })
      );
    });
    children.push(new Paragraph({ spacing: { after: 60 }, children: langRuns }));
  }

  return new Document({
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
  photoBytes: { data: Uint8Array; type: 'png' | 'jpg' } | null
): Document {
  const FONT = 'Arial';
  const EU_BLUE = '003399';
  const children: (Paragraph | Table)[] = [];

  if (!hasActivePlan) {
    children.push(createWatermarkNotice(FONT));
  }

  // Europass Blue Badge Header
  children.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: 'curriculum vitae ',
          bold: true,
          size: 26,
          font: FONT,
          color: EU_BLUE
        }),
        new TextRun({
          text: 'europass',
          bold: true,
          size: 26,
          font: FONT,
          color: 'EAB308'
        }),
        new TextRun({
          text: '  ·  Padrão Oficial da União Europeia',
          size: 17,
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
          spacing: { after: 20 },
          children: [
            new TextRun({
              text: cv.personalDetails.name || 'SEU NOME COMPLETO',
              bold: true,
              size: 32,
              font: FONT,
              color: EU_BLUE
            })
          ]
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: cv.personalDetails.title || '',
              bold: true,
              size: 22,
              font: FONT,
              color: '1E293B'
            })
          ]
        }),
        new Paragraph({
          spacing: { after: 20 },
          children: [
            new TextRun({ text: 'Endereço / Localização: ', bold: true, size: 18, font: FONT, color: '64748B' }),
            new TextRun({ text: cv.personalDetails.location || '', size: 18, font: FONT })
          ]
        }),
        new Paragraph({
          spacing: { after: 20 },
          children: [
            new TextRun({ text: 'Telefone / WhatsApp: ', bold: true, size: 18, font: FONT, color: '64748B' }),
            new TextRun({ text: cv.personalDetails.phone || '', size: 18, font: FONT })
          ]
        }),
        new Paragraph({
          spacing: { after: 20 },
          children: [
            new TextRun({ text: 'Correio Eletrónico: ', bold: true, size: 18, font: FONT, color: '64748B' }),
            new TextRun({ text: cv.personalDetails.email || '', size: 18, font: FONT })
          ]
        }),
        cv.personalDetails.linkedin
          ? new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({ text: 'LinkedIn: ', bold: true, size: 18, font: FONT, color: '64748B' }),
                new TextRun({ text: cv.personalDetails.linkedin, size: 18, font: FONT })
              ]
            })
          : new Paragraph({ spacing: { after: 40 }, children: [] })
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
            spacing: { after: 30 },
            children: [
              new ImageRun({
                data: photoBytes.data,
                transformation: { width: 95, height: 95 },
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
      spacing: { before: 200, after: 80 },
      keepNext: true,
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 10, color: EU_BLUE, space: 4 }
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 21,
          font: FONT,
          color: EU_BLUE
        })
      ]
    });
  }

  // Summary
  if (cv.summary) {
    children.push(createEuropassHeading('Resumo Profissional'));
    children.push(
      new Paragraph({
        spacing: { after: 120, line: 260 },
        children: [new TextRun({ text: cv.summary, size: 20, font: FONT, color: '1E293B' })]
      })
    );
  }

  // Experience: Europass 2-column table
  if (cv.experiences && cv.experiences.length > 0) {
    children.push(createEuropassHeading('Experiência Profissional'));

    cv.experiences.forEach((exp) => {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: NO_BORDERS,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 28, type: WidthType.PERCENTAGE },
                  borders: NO_BORDERS,
                  children: [
                    new Paragraph({
                      spacing: { before: 60, after: 20 },
                      children: [
                        new TextRun({ text: exp.period || '', bold: true, size: 19, font: FONT, color: EU_BLUE }),
                        new TextRun({ text: exp.location ? `\n${exp.location}` : '', size: 18, font: FONT, color: '64748B' })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  width: { size: 72, type: WidthType.PERCENTAGE },
                  borders: NO_BORDERS,
                  children: [
                    new Paragraph({
                      spacing: { before: 60, after: 20 },
                      children: [
                        new TextRun({ text: exp.role, bold: true, size: 21, font: FONT, color: '0F172A' }),
                        new TextRun({ text: ` — ${exp.company}`, bold: true, size: 20, font: FONT, color: '334155' })
                      ]
                    }),
                    ...(exp.donor
                      ? [
                          new Paragraph({
                            spacing: { after: 30 },
                            children: [
                              new TextRun({ text: `Programa/Doador: ${exp.donor}`, italics: true, size: 18, font: FONT, color: '475569' })
                            ]
                          })
                        ]
                      : []),
                    ...exp.highlights.map(
                      (h) =>
                        new Paragraph({
                          bullet: { level: 0 },
                          spacing: { after: 30, line: 240 },
                          children: [new TextRun({ text: h, size: 19.5, font: FONT, color: '1E293B' })]
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
  }

  // Education: Europass 2-column table
  if (cv.educations && cv.educations.length > 0) {
    children.push(createEuropassHeading('Formação Académica'));

    cv.educations.forEach((edu) => {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: NO_BORDERS,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 28, type: WidthType.PERCENTAGE },
                  borders: NO_BORDERS,
                  children: [
                    new Paragraph({
                      spacing: { before: 40, after: 20 },
                      children: [
                        new TextRun({ text: edu.period || '', bold: true, size: 19, font: FONT, color: EU_BLUE })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  width: { size: 72, type: WidthType.PERCENTAGE },
                  borders: NO_BORDERS,
                  children: [
                    new Paragraph({
                      spacing: { before: 40, after: 20 },
                      children: [
                        new TextRun({ text: edu.degree, bold: true, size: 20, font: FONT, color: '0F172A' }),
                        new TextRun({ text: ` — ${edu.institution}`, size: 19, font: FONT, color: '334155' })
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
  }

  // Competencies
  if (cv.competencies && cv.competencies.length > 0) {
    children.push(createEuropassHeading('Competências Pessoais & Técnicas'));
    cv.competencies.forEach((c) => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 30 },
          children: [
            new TextRun({ text: `${c.category}: `, bold: true, size: 19.5, font: FONT, color: EU_BLUE }),
            new TextRun({ text: c.description, size: 19.5, font: FONT, color: '1E293B' })
          ]
        })
      );
    });
  }

  // Languages with CEFR European reference
  if (cv.languages && cv.languages.length > 0) {
    children.push(createEuropassHeading('Línguas Estrangeiras (Quadro Europeu CEFR)'));
    const borderEu = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' };
    const langRows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({
            borders: { top: borderEu, bottom: borderEu, left: borderEu, right: borderEu },
            width: { size: 40, type: WidthType.PERCENTAGE },
            shading: { fill: 'F1F5F9' },
            children: [new Paragraph({ children: [new TextRun({ text: 'Língua', bold: true, size: 19, font: FONT })] })]
          }),
          new TableCell({
            borders: { top: borderEu, bottom: borderEu, left: borderEu, right: borderEu },
            width: { size: 60, type: WidthType.PERCENTAGE },
            shading: { fill: 'F1F5F9' },
            children: [new Paragraph({ children: [new TextRun({ text: 'Nível CEFR / Proficiência', bold: true, size: 19, font: FONT })] })]
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
              children: [new Paragraph({ children: [new TextRun({ text: l.language, bold: true, size: 19, font: FONT })] })]
            }),
            new TableCell({
              borders: { top: borderEu, bottom: borderEu, left: borderEu, right: borderEu },
              children: [new Paragraph({ children: [new TextRun({ text: l.level, size: 19, font: FONT })] })]
            })
          ]
        })
      );
    });

    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: langRows }));
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.6),
              bottom: convertInchesToTwip(0.6),
              left: convertInchesToTwip(0.65),
              right: convertInchesToTwip(0.65)
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
  photoBytes: { data: Uint8Array; type: 'png' | 'jpg' } | null
): Document {
  const FONT = 'Arial';
  const SIDEBAR_BG = COLOR_PRIMARY || '0F172A';
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
        spacing: { before: 80, after: 100 },
        children: [
          new ImageRun({
            data: photoBytes.data,
            transformation: { width: 100, height: 100 },
            type: photoBytes.type
          })
        ]
      })
    );
  }

  sidebarElements.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: (cv.personalDetails.name || 'SEU NOME').toUpperCase(),
          bold: true,
          size: 26,
          font: FONT,
          color: 'FFFFFF'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: cv.personalDetails.title || '',
          size: 19,
          font: FONT,
          color: 'CBD5E1'
        })
      ]
    }),
    new Paragraph({
      spacing: { before: 80, after: 30 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '64748B' } },
      children: [
        new TextRun({ text: 'CONTACTOS', bold: true, size: 19, font: FONT, color: 'FFFFFF' })
      ]
    }),
    new Paragraph({
      spacing: { after: 20 },
      children: [
        new TextRun({ text: `${cv.personalDetails.location}\n`, size: 17, font: FONT, color: 'E2E8F0' }),
        new TextRun({ text: `${cv.personalDetails.phone}\n`, size: 17, font: FONT, color: 'E2E8F0' }),
        new TextRun({ text: `${cv.personalDetails.email}\n`, size: 17, font: FONT, color: 'E2E8F0' }),
        cv.personalDetails.linkedin
          ? new TextRun({ text: `${cv.personalDetails.linkedin}\n`, size: 17, font: FONT, color: 'E2E8F0' })
          : new TextRun({ text: '', size: 1 })
      ]
    })
  );

  if (cv.competencies && cv.competencies.length > 0) {
    sidebarElements.push(
      new Paragraph({
        spacing: { before: 120, after: 30 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '64748B' } },
        children: [
          new TextRun({ text: 'COMPETÊNCIAS', bold: true, size: 19, font: FONT, color: 'FFFFFF' })
        ]
      })
    );
    cv.competencies.forEach((c) => {
      sidebarElements.push(
        new Paragraph({
          spacing: { after: 20 },
          children: [
            new TextRun({ text: `• ${c.category}: `, bold: true, size: 17, font: FONT, color: 'FFFFFF' }),
            new TextRun({ text: c.description, size: 16, font: FONT, color: 'CBD5E1' })
          ]
        })
      );
    });
  }

  if (cv.languages && cv.languages.length > 0) {
    sidebarElements.push(
      new Paragraph({
        spacing: { before: 120, after: 30 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '64748B' } },
        children: [
          new TextRun({ text: 'IDIOMAS', bold: true, size: 19, font: FONT, color: 'FFFFFF' })
        ]
      })
    );
    cv.languages.forEach((l) => {
      sidebarElements.push(
        new Paragraph({
          spacing: { after: 15 },
          children: [
            new TextRun({ text: `• ${l.language}: `, bold: true, size: 17, font: FONT, color: 'FFFFFF' }),
            new TextRun({ text: l.level, size: 16, font: FONT, color: 'CBD5E1' })
          ]
        })
      );
    });
  }

  // Right Main Column Content
  const mainElements: Paragraph[] = [];

  function createCreativeHeading(title: string): Paragraph {
    return new Paragraph({
      spacing: { before: 140, after: 50 },
      keepNext: true,
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_PRIMARY, space: 2 }
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 21,
          font: FONT,
          color: COLOR_PRIMARY
        })
      ]
    });
  }

  if (cv.summary) {
    mainElements.push(createCreativeHeading('Perfil Profissional'));
    mainElements.push(
      new Paragraph({
        spacing: { after: 100, line: 260 },
        children: [new TextRun({ text: cv.summary, size: 20, font: FONT, color: '1E293B' })]
      })
    );
  }

  if (cv.experiences && cv.experiences.length > 0) {
    mainElements.push(createCreativeHeading('Experiência Profissional'));
    cv.experiences.forEach((exp) => {
      mainElements.push(
        new Paragraph({
          spacing: { before: 60, after: 15 },
          children: [
            new TextRun({ text: exp.role, bold: true, size: 21, font: FONT, color: '0F172A' }),
            new TextRun({ text: ` — ${exp.company}`, bold: true, size: 20, font: FONT, color: '475569' }),
            new TextRun({ text: ` (${exp.period})`, italics: true, size: 18, font: FONT, color: '64748B' })
          ]
        })
      );
      exp.highlights.forEach((h) => {
        if (!h.trim()) return;
        mainElements.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 25, line: 240 },
            children: [new TextRun({ text: h, size: 19, font: FONT, color: '1E293B' })]
          })
        );
      });
    });
  }

  if (cv.educations && cv.educations.length > 0) {
    mainElements.push(createCreativeHeading('Formação Académica'));
    cv.educations.forEach((edu) => {
      mainElements.push(
        new Paragraph({
          spacing: { before: 40, after: 20 },
          children: [
            new TextRun({ text: edu.degree, bold: true, size: 20, font: FONT, color: '0F172A' }),
            new TextRun({ text: ` — ${edu.institution} (${edu.period})`, size: 19, font: FONT, color: '334155' })
          ]
        })
      );
    });
  }

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
              top: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.5)
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
  photoBytes: { data: Uint8Array; type: 'png' | 'jpg' } | null
): Document {
  const FONT = 'Calibri';
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
          spacing: { after: 30 },
          children: [
            new TextRun({
              text: cv.personalDetails.name || 'SEU NOME',
              bold: true,
              size: 34,
              font: FONT,
              color: COLOR_PRIMARY
            })
          ]
        }),
        new Paragraph({
          spacing: { after: 50 },
          children: [
            new TextRun({
              text: `// ${cv.personalDetails.title || 'Tech Lead & Software Architect'}`,
              bold: true,
              size: 22,
              font: FONT,
              color: '0D9488'
            })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
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
              size: 19,
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

  function createTechHeading(title: string): Paragraph {
    return new Paragraph({
      spacing: { before: 180, after: 60 },
      keepNext: true,
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 8, color: '0D9488', space: 2 }
      },
      children: [
        new TextRun({
          text: `> ${title.toUpperCase()}`,
          bold: true,
          size: 21,
          font: FONT,
          color: COLOR_PRIMARY
        })
      ]
    });
  }

  // Summary
  if (cv.summary) {
    children.push(createTechHeading('Architecture & Leadership Profile'));
    children.push(
      new Paragraph({
        spacing: { after: 100, line: 260 },
        children: [new TextRun({ text: cv.summary, size: 20.5, font: FONT, color: '1E293B' })]
      })
    );
  }

  // Tech Stack & Competencies
  if (cv.competencies && cv.competencies.length > 0) {
    children.push(createTechHeading('Technical Skills & Stack'));
    cv.competencies.forEach((c) => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 30 },
          children: [
            new TextRun({ text: `${c.category}: `, bold: true, size: 20, font: FONT, color: '0F172A' }),
            new TextRun({ text: c.description, size: 20, font: FONT, color: '334155' })
          ]
        })
      );
    });
  }

  // Experiences
  if (cv.experiences && cv.experiences.length > 0) {
    children.push(createTechHeading('Professional Experience'));
    cv.experiences.forEach((exp) => {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 20 },
          children: [
            new TextRun({ text: exp.role, bold: true, size: 21, font: FONT, color: '0F172A' }),
            new TextRun({ text: ` @ ${exp.company}`, bold: true, size: 21, font: FONT, color: '0D9488' }),
            new TextRun({ text: `  [${exp.period}]`, size: 19, font: FONT, color: '64748B' })
          ]
        })
      );
      exp.highlights.forEach((h) => {
        if (!h.trim()) return;
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 30, line: 240 },
            children: [new TextRun({ text: h, size: 20, font: FONT, color: '1E293B' })]
          })
        );
      });
    });
  }

  // Education
  if (cv.educations && cv.educations.length > 0) {
    children.push(createTechHeading('Education & Credentials'));
    cv.educations.forEach((edu) => {
      children.push(
        new Paragraph({
          spacing: { before: 40, after: 20 },
          children: [
            new TextRun({ text: edu.degree, bold: true, size: 20, font: FONT, color: '0F172A' }),
            new TextRun({ text: ` — ${edu.institution} (${edu.period})`, size: 19.5, font: FONT, color: '334155' })
          ]
        })
      );
    });
  }

  return new Document({
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
        children
      }
    ]
  });
}

// ============================================================================
// 5. ATS COMPACT MODEL (Strict US text-first, zero tables, monospace)
// ============================================================================
function buildAtsCompactDoc(cv: CVData, hasActivePlan: boolean): Document {
  const FONT = 'Consolas';
  const children: (Paragraph | Table)[] = [];

  if (!hasActivePlan) {
    children.push(createWatermarkNotice(FONT));
  }

  // ATS Header
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 30 },
      children: [
        new TextRun({
          text: (cv.personalDetails.name || 'SEU NOME').toUpperCase(),
          bold: true,
          size: 30,
          font: FONT,
          color: '000000'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: (cv.personalDetails.title || '').toUpperCase(),
          bold: true,
          size: 20,
          font: FONT,
          color: '333333'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
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
          size: 18,
          font: FONT,
          color: '000000'
        })
      ]
    })
  );

  function createAtsHeading(title: string): Paragraph {
    return new Paragraph({
      spacing: { before: 140, after: 40 },
      keepNext: true,
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' } },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 20,
          font: FONT,
          color: '000000'
        })
      ]
    });
  }

  if (cv.summary) {
    children.push(createAtsHeading('PROFESSIONAL SUMMARY'));
    children.push(
      new Paragraph({
        spacing: { after: 80, line: 240 },
        children: [new TextRun({ text: cv.summary, size: 19, font: FONT, color: '000000' })]
      })
    );
  }

  if (cv.competencies && cv.competencies.length > 0) {
    children.push(createAtsHeading('CORE COMPETENCIES'));
    cv.competencies.forEach((c) => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 20 },
          children: [
            new TextRun({ text: `${c.category}: `, bold: true, size: 19, font: FONT }),
            new TextRun({ text: c.description, size: 19, font: FONT })
          ]
        })
      );
    });
  }

  if (cv.experiences && cv.experiences.length > 0) {
    children.push(createAtsHeading('PROFESSIONAL EXPERIENCE'));
    cv.experiences.forEach((exp) => {
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 15 },
          children: [
            new TextRun({ text: `${exp.role} - ${exp.company}`, bold: true, size: 20, font: FONT }),
            new TextRun({ text: ` (${exp.period})`, size: 18, font: FONT })
          ]
        })
      );
      exp.highlights.forEach((h) => {
        if (!h.trim()) return;
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 20 },
            children: [new TextRun({ text: h, size: 19, font: FONT })]
          })
        );
      });
    });
  }

  if (cv.educations && cv.educations.length > 0) {
    children.push(createAtsHeading('EDUCATION'));
    cv.educations.forEach((edu) => {
      children.push(
        new Paragraph({
          spacing: { before: 40, after: 15 },
          children: [
            new TextRun({ text: `${edu.degree} - ${edu.institution} (${edu.period})`, size: 19, font: FONT })
          ]
        })
      );
    });
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.6),
              bottom: convertInchesToTwip(0.6),
              left: convertInchesToTwip(0.65),
              right: convertInchesToTwip(0.65)
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
  fontFamily: string = 'Calibri'
): Document {
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
          spacing: { after: 20 },
          children: [
            new TextRun({
              text: cv.personalDetails.name || 'SEU NOME COMPLETO',
              bold: true,
              size: 34,
              font: fontFamily,
              color: COLOR_PRIMARY
            })
          ]
        }),
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: cv.personalDetails.title || '',
              bold: true,
              size: 22,
              font: fontFamily,
              color: '475569'
            })
          ]
        }),
        new Paragraph({
          spacing: { after: 100 },
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
              size: 19,
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
            spacing: { after: 20 },
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

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [new TableRow({ children: headerCells })]
    })
  );

  function createModernSectionHeading(title: string): Paragraph {
    return new Paragraph({
      spacing: { before: 180, after: 60 },
      keepNext: true,
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY, space: 2 }
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 21,
          font: fontFamily,
          color: COLOR_PRIMARY
        })
      ]
    });
  }

  // Summary
  if (cv.summary) {
    children.push(createModernSectionHeading('Resumo Profissional'));
    children.push(
      new Paragraph({
        spacing: { after: 100, line: 260 },
        children: [new TextRun({ text: cv.summary, size: 20.5, font: fontFamily, color: '1E293B' })]
      })
    );
  }

  // Competencies
  if (cv.competencies && cv.competencies.length > 0) {
    children.push(createModernSectionHeading('Competências & Habilidades Chave'));
    cv.competencies.forEach((c) => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 30 },
          children: [
            new TextRun({ text: `${c.category}: `, bold: true, size: 20, font: fontFamily, color: COLOR_PRIMARY }),
            new TextRun({ text: c.description, size: 20, font: fontFamily, color: '334155' })
          ]
        })
      );
    });
  }

  // Experience
  if (cv.experiences && cv.experiences.length > 0) {
    children.push(createModernSectionHeading('Experiência Profissional'));
    cv.experiences.forEach((exp) => {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 20 },
          children: [
            new TextRun({ text: exp.role, bold: true, size: 21, font: fontFamily, color: '0F172A' }),
            new TextRun({ text: ` — ${exp.company}`, bold: true, size: 20, font: fontFamily, color: COLOR_PRIMARY }),
            new TextRun({ text: `  (${exp.period}${exp.location ? ` · ${exp.location}` : ''})`, size: 19, font: fontFamily, color: '64748B' })
          ]
        })
      );
      if (exp.donor) {
        children.push(
          new Paragraph({
            spacing: { after: 30 },
            children: [new TextRun({ text: `Projeto: ${exp.donor}`, italics: true, size: 19, font: fontFamily, color: '64748B' })]
          })
        );
      }
      exp.highlights.forEach((h) => {
        if (!h.trim()) return;
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 30, line: 240 },
            children: [new TextRun({ text: h, size: 20, font: fontFamily, color: '1E293B' })]
          })
        );
      });
    });
  }

  // Education
  if (cv.educations && cv.educations.length > 0) {
    children.push(createModernSectionHeading('Formação Académica'));
    cv.educations.forEach((edu) => {
      children.push(
        new Paragraph({
          spacing: { before: 40, after: 20 },
          children: [
            new TextRun({ text: edu.degree, bold: true, size: 20, font: fontFamily, color: '0F172A' }),
            new TextRun({ text: ` — ${edu.institution} (${edu.period})`, size: 19.5, font: fontFamily, color: '334155' })
          ]
        })
      );
    });
  }

  // Languages
  if (cv.languages && cv.languages.length > 0) {
    children.push(createModernSectionHeading('Idiomas & Proficiência'));
    const langRuns: TextRun[] = [];
    cv.languages.forEach((l, idx) => {
      langRuns.push(
        new TextRun({ text: `• ${l.language}: `, bold: true, size: 20, font: fontFamily }),
        new TextRun({ text: `${l.level}${idx < cv.languages.length - 1 ? '   |   ' : ''}`, size: 20, font: fontFamily, color: '64748B' })
      );
    });
    children.push(new Paragraph({ spacing: { after: 60 }, children: langRuns }));
  }

  // References Table (UN Classic style)
  if (cv.references && cv.references.length > 0) {
    children.push(createModernSectionHeading('Referências Profissionais'));
    const borderConfig = { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' };
    const headerCells = ['Nome', 'Instituição & Cargo', 'Contacto'].map(
      (h) =>
        new TableCell({
          borders: { top: borderConfig, bottom: { ...borderConfig, size: 8, color: '9CA3AF' }, left: borderConfig, right: borderConfig },
          children: [
            new Paragraph({
              spacing: { before: 60, after: 60 },
              children: [new TextRun({ text: h, bold: true, size: 19, font: fontFamily, color: COLOR_PRIMARY })]
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
              children: [new Paragraph({ children: [new TextRun({ text: ref.name, bold: true, size: 18, font: fontFamily })] })]
            }),
            new TableCell({
              borders: { top: borderConfig, bottom: borderConfig, left: borderConfig, right: borderConfig },
              children: [new Paragraph({ children: [new TextRun({ text: ref.institutionAndPosition, size: 18, font: fontFamily })] })]
            }),
            new TableCell({
              borders: { top: borderConfig, bottom: borderConfig, left: borderConfig, right: borderConfig },
              children: [new Paragraph({ children: [new TextRun({ text: ref.contact, size: 18, font: fontFamily })] })]
            })
          ]
        })
      );
    });
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
  }

  return new Document({
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
        children
      }
    ]
  });
}

// ============================================================================
// MAIN WORD EXPORT DISPATCHER (Resolves Template Style & Embedded Photo)
// ============================================================================
export async function generateWordDocument(
  cv: CVData,
  hasActivePlan: boolean = true
): Promise<Blob> {
  const COLOR_PRIMARY = cv.accentColor ? cv.accentColor.replace('#', '') : '0F172A';

  // Fetch photo bytes if enabled
  const hasPhotoEnabled = cv.personalDetails.showPhoto !== false && Boolean(cv.personalDetails.photoUrl);
  const photoBytes = hasPhotoEnabled ? await getPhotoBytes(cv.personalDetails.photoUrl) : null;

  let doc: Document;

  switch (cv.templateStyle) {
    case 'executive_harvard':
      doc = buildHarvardDoc(cv, hasActivePlan, COLOR_PRIMARY);
      break;

    case 'european_europass':
      doc = buildEuropassDoc(cv, hasActivePlan, COLOR_PRIMARY, photoBytes);
      break;

    case 'creative_split':
      doc = buildCreativeSplitDoc(cv, hasActivePlan, COLOR_PRIMARY, photoBytes);
      break;

    case 'tech_modern':
      doc = buildTechModernDoc(cv, hasActivePlan, COLOR_PRIMARY, photoBytes);
      break;

    case 'ats_compact':
      doc = buildAtsCompactDoc(cv, hasActivePlan);
      break;

    case 'un_classic':
    case 'academic_lattes':
      doc = buildModernEuropeanDoc(cv, hasActivePlan, COLOR_PRIMARY, photoBytes, 'Times New Roman');
      break;

    case 'hybrid_minimalist':
      doc = buildModernEuropeanDoc(cv, hasActivePlan, COLOR_PRIMARY, photoBytes, 'Arial');
      break;

    case 'european_modern':
    default:
      doc = buildModernEuropeanDoc(cv, hasActivePlan, COLOR_PRIMARY, photoBytes, 'Calibri');
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
      spacing: { after: 200 },
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
              before: isSubject ? 120 : 60,
              after: isSubject ? 120 : 100,
              line: 276
            },
            children: [
              new TextRun({
                text: textBlock,
                bold: isSubject || isAc,
                size: 22,
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
              spacing: { after: 80, line: 276 },
              children: [
                new TextRun({
                  text: currentBlock.join(' '),
                  size: 22,
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
            spacing: { after: trimmed.startsWith('Assunto:') ? 140 : 40, line: 260 },
            children: [
              new TextRun({
                text: trimmed,
                bold: isBold,
                size: 22,
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
        spacing: { after: 100, line: 276 },
        children: [
          new TextRun({
            text: currentBlock.join(' '),
            size: 22,
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
              top: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.85),
              right: convertInchesToTwip(0.85)
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
