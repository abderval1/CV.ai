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
  convertInchesToTwip
} from 'docx';
import { CVData } from '../types/cv';

export async function generateWordDocument(cv: CVData): Promise<Blob> {
  const COLOR_PRIMARY = '111827';
  const COLOR_MUTED = '4B5563';
  const FONT_FAMILY = cv.templateStyle === 'un_classic' ? 'Times New Roman' : 'Calibri';

  // Helper to create section headings with bottom border
  function createSectionHeading(title: string): Paragraph {
    return new Paragraph({
      spacing: { before: 240, after: 70 },
      keepNext: true,
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 6,
          color: 'CCCCCC',
          space: 2
        }
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 23, // 11.5pt
          font: FONT_FAMILY,
          color: '0F172A'
        })
      ]
    });
  }

  const docChildren: (Paragraph | Table)[] = [];

  // --- CABEÇALHO ---
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: cv.personalDetails.name || 'SEU NOME',
          bold: true,
          size: 36, // 18pt
          font: FONT_FAMILY,
          color: COLOR_PRIMARY
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: cv.personalDetails.title || '',
          bold: true,
          size: 22, // 11pt
          font: FONT_FAMILY,
          color: COLOR_MUTED
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
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
          size: 19, // 9.5pt
          font: FONT_FAMILY,
          color: COLOR_MUTED
        })
      ]
    })
  );

  // --- SUMMARY ---
  if (cv.summary) {
    docChildren.push(createSectionHeading('Summary'));
    docChildren.push(
      new Paragraph({
        spacing: { after: 120, line: 276 }, // 1.15 line spacing
        children: [
          new TextRun({
            text: cv.summary,
            size: 21, // 10.5pt
            font: FONT_FAMILY,
            color: COLOR_PRIMARY
          })
        ]
      })
    );
  }

  // --- CORE COMPETENCIES ---
  if (cv.competencies && cv.competencies.length > 0) {
    docChildren.push(createSectionHeading('Core Competencies & Key Skills'));
    cv.competencies.forEach((comp) => {
      docChildren.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60, line: 260 },
          children: [
            new TextRun({
              text: `${comp.category}: `,
              bold: true,
              size: 21,
              font: FONT_FAMILY,
              color: COLOR_PRIMARY
            }),
            new TextRun({
              text: comp.description,
              size: 21,
              font: FONT_FAMILY,
              color: COLOR_PRIMARY
            })
          ]
        })
      );
    });
  }

  // --- PROFESSIONAL EXPERIENCE ---
  if (cv.experiences && cv.experiences.length > 0) {
    docChildren.push(createSectionHeading('Professional Experience'));

    cv.experiences.forEach((exp) => {
      // Company
      docChildren.push(
        new Paragraph({
          spacing: { before: 160, after: 20 },
          keepNext: true,
          children: [
            new TextRun({
              text: exp.company,
              bold: true,
              size: 22, // 11pt
              font: FONT_FAMILY,
              color: COLOR_PRIMARY
            })
          ]
        })
      );

      // Role | Date
      docChildren.push(
        new Paragraph({
          spacing: { after: exp.donor ? 40 : 60 },
          keepNext: true,
          children: [
            new TextRun({
              text: exp.role,
              bold: true,
              size: 20, // 10pt
              font: FONT_FAMILY,
              color: '1E293B'
            }),
            new TextRun({
              text: exp.period ? `  |  ${exp.period}` : '',
              size: 20,
              font: FONT_FAMILY,
              color: COLOR_MUTED
            })
          ]
        })
      );

      // Donor line (if any)
      if (exp.donor) {
        docChildren.push(
          new Paragraph({
            spacing: { after: 60 },
            keepNext: true,
            children: [
              new TextRun({
                text: exp.donor,
                italics: true,
                size: 19, // 9.5pt
                font: FONT_FAMILY,
                color: COLOR_MUTED
              })
            ]
          })
        );
      }

      // Highlights
      exp.highlights.forEach((point) => {
        if (!point.trim()) return;
        docChildren.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 50, line: 260 },
            children: [
              new TextRun({
                text: point,
                size: 21, // 10.5pt
                font: FONT_FAMILY,
                color: COLOR_PRIMARY
              })
            ]
          })
        );
      });
    });
  }

  // --- EDUCATION ---
  if (cv.educations && cv.educations.length > 0) {
    docChildren.push(createSectionHeading('Education'));
    cv.educations.forEach((edu) => {
      docChildren.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: edu.degree,
              bold: true,
              size: 21,
              font: FONT_FAMILY,
              color: COLOR_PRIMARY
            }),
            new TextRun({
              text: ` — ${edu.institution} (${edu.period})${edu.gpaOrHonors ? ` [${edu.gpaOrHonors}]` : ''}`,
              size: 21,
              font: FONT_FAMILY,
              color: COLOR_PRIMARY
            })
          ]
        })
      );
    });
  }

  // --- SPECIALIZED TRAINING ---
  if (cv.trainings && cv.trainings.length > 0) {
    docChildren.push(createSectionHeading('Specialized Training & Professional Development'));
    cv.trainings.forEach((training) => {
      docChildren.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: training,
              size: 20,
              font: FONT_FAMILY,
              color: COLOR_PRIMARY
            })
          ]
        })
      );
    });
  }

  // --- LANGUAGES ---
  if (cv.languages && cv.languages.length > 0) {
    docChildren.push(createSectionHeading('Languages'));
    const langRuns: TextRun[] = [];
    cv.languages.forEach((lang, idx) => {
      langRuns.push(
        new TextRun({
          text: `• ${lang.language}: `,
          bold: true,
          size: 20,
          font: FONT_FAMILY,
          color: COLOR_PRIMARY
        }),
        new TextRun({
          text: `${lang.level}${idx < cv.languages.length - 1 ? '    ' : ''}`,
          size: 20,
          font: FONT_FAMILY,
          color: COLOR_PRIMARY
        })
      );
    });

    docChildren.push(
      new Paragraph({
        spacing: { after: 80 },
        children: langRuns
      })
    );
  }

  // --- REFERENCES ---
  if (cv.references && cv.references.length > 0) {
    docChildren.push(createSectionHeading('References'));

    const borderConfig = {
      style: BorderStyle.SINGLE,
      size: 4,
      color: 'D1D5DB'
    };

    const headerCells = ['Name', 'Institution & Position', 'Contact'].map(
      (h, idx) =>
        new TableCell({
          width: {
            size: idx === 0 ? 30 : idx === 1 ? 45 : 25,
            type: WidthType.PERCENTAGE
          },
          borders: {
            top: borderConfig,
            bottom: { ...borderConfig, size: 8, color: '9CA3AF' },
            left: borderConfig,
            right: borderConfig
          },
          children: [
            new Paragraph({
              spacing: { before: 80, after: 80 },
              children: [
                new TextRun({
                  text: h,
                  bold: true,
                  size: 20,
                  font: FONT_FAMILY,
                  color: COLOR_PRIMARY
                })
              ]
            })
          ]
        })
    );

    const rows: TableRow[] = [
      new TableRow({
        children: headerCells
      })
    ];

    cv.references.forEach((ref) => {
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top: borderConfig,
                bottom: borderConfig,
                left: borderConfig,
                right: borderConfig
              },
              children: [
                new Paragraph({
                  spacing: { before: 60, after: 60 },
                  children: [
                    new TextRun({
                      text: ref.name,
                      bold: true,
                      size: 19,
                      font: FONT_FAMILY,
                      color: COLOR_PRIMARY
                    })
                  ]
                })
              ]
            }),
            new TableCell({
              borders: {
                top: borderConfig,
                bottom: borderConfig,
                left: borderConfig,
                right: borderConfig
              },
              children: ref.institutionAndPosition.split('\n').map(
                (line) =>
                  new Paragraph({
                    spacing: { before: 20, after: 20 },
                    children: [
                      new TextRun({
                        text: line,
                        size: 19,
                        font: FONT_FAMILY,
                        color: COLOR_PRIMARY
                      })
                    ]
                  })
              )
            }),
            new TableCell({
              borders: {
                top: borderConfig,
                bottom: borderConfig,
                left: borderConfig,
                right: borderConfig
              },
              children: ref.contact.split('\n').map(
                (cLine) =>
                  new Paragraph({
                    spacing: { before: 20, after: 20 },
                    children: [
                      new TextRun({
                        text: cLine,
                        size: 19,
                        font: FONT_FAMILY,
                        color: COLOR_PRIMARY
                      })
                    ]
                  })
              )
            })
          ]
        })
      );
    });

    const refTable = new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      rows
    });

    docChildren.push(refTable);
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.7),
              bottom: convertInchesToTwip(0.7),
              left: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8)
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
