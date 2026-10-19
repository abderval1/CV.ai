import { CVData } from '../types/cv';

export function generatePythonScript(cv: CVData): string {
  const experiencesPython = JSON.stringify(
    cv.experiences.map((exp) => ({
      org: exp.company,
      donor: exp.donor || '',
      role: exp.role,
      date: exp.period,
      points: exp.highlights
    })),
    null,
    8
  );

  const competenciesPython = JSON.stringify(
    cv.competencies.map((comp) => [comp.category + ':', ' ' + comp.description]),
    null,
    8
  );

  const eduPython = JSON.stringify(
    cv.educations.map((e) => [
      e.degree + (e.gpaOrHonors ? ` (${e.gpaOrHonors})` : ''),
      e.institution,
      e.period
    ]),
    null,
    8
  );

  const trainingsPython = JSON.stringify(cv.trainings, null, 8);

  const refsPython = JSON.stringify(
    cv.references.map((r) => [r.name, r.institutionAndPosition, r.contact]),
    null,
    8
  );

  const langRuns = cv.languages
    .map(
      (l) =>
        `    p_lang.add_run("• ${l.language}: ").bold = True\n    p_lang.add_run("${l.level}    ")`
    )
    .join('\n');

  return `import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml

def create_meal_cv():
    doc = docx.Document()

    # 1. Configuração de Margens (Padrão Internacional / Europeu)
    for section in doc.sections:
        section.top_margin = Inches(0.7)
        section.bottom_margin = Inches(0.7)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Cores
    COLOR_PRIMARY = RGBColor(17, 24, 39)    # Quase preto / elegante
    COLOR_MUTED = RGBColor(75, 85, 99)      # Cinzento escuro

    # Estilo base
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = COLOR_PRIMARY

    # Função auxiliar para adicionar linha horizontal fina
    def add_horizontal_line(paragraph):
        pPr = paragraph._p.get_or_add_pPr()
        pBdr = parse_xml(r'<w:pBdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
                         r'<w:bottom w:val="single" w:sz="6" w:space="2" w:color="CCCCCC"/>'
                         r'</w:pBdr>')
        pPr.append(pBdr)

    # Função para títulos de secção
    def add_section_heading(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(title.upper())
        run.bold = True
        run.font.size = Pt(11.5)
        run.font.color.rgb = RGBColor(15, 23, 42)
        add_horizontal_line(p)
        return p

    # --- CABEÇALHO ---
    p_name = doc.add_paragraph()
    p_name.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_name.paragraph_format.space_after = Pt(2)
    run_name = p_name.add_run("${cv.personalDetails.name.toUpperCase()}")
    run_name.bold = True
    run_name.font.size = Pt(18)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(4)
    run_title = p_title.add_run("${cv.personalDetails.title}")
    run_title.bold = True
    run_title.font.size = Pt(11)
    run_title.font.color.rgb = COLOR_MUTED

    p_contact = doc.add_paragraph()
    p_contact.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_contact.paragraph_format.space_after = Pt(12)
    contact_text = "${[
      cv.personalDetails.location,
      cv.personalDetails.phone,
      cv.personalDetails.email,
      cv.personalDetails.linkedin
    ]
      .filter(Boolean)
      .join('  |  ')}"
    run_contact = p_contact.add_run(contact_text)
    run_contact.font.size = Pt(9.5)

    # --- SUMMARY ---
    add_section_heading("Summary")
    p_sum = doc.add_paragraph()
    p_sum.paragraph_format.space_after = Pt(6)
    p_sum.paragraph_format.line_spacing = 1.15
    p_sum.add_run("""${cv.summary.replace(/"/g, '\\"')}""")

    # --- CORE COMPETENCIES ---
    add_section_heading("Core Competencies & Key Skills")
    competencies = ${competenciesPython}
    for bold_prefix, text in competencies:
        p_comp = doc.add_paragraph(style='List Bullet')
        p_comp.paragraph_format.space_after = Pt(3)
        p_comp.paragraph_format.line_spacing = 1.1
        r_bold = p_comp.add_run(bold_prefix)
        r_bold.bold = True
        p_comp.add_run(text)

    # --- PROFESSIONAL EXPERIENCE ---
    add_section_heading("Professional Experience")
    experiences = ${experiencesPython}

    for exp in experiences:
        p_exp = doc.add_paragraph()
        p_exp.paragraph_format.space_before = Pt(8)
        p_exp.paragraph_format.space_after = Pt(1)
        p_exp.paragraph_format.keep_with_next = True
        
        r_org = p_exp.add_run(exp["org"])
        r_org.bold = True
        r_org.font.size = Pt(11)

        p_sub = doc.add_paragraph()
        p_sub.paragraph_format.space_after = Pt(3)
        p_sub.paragraph_format.keep_with_next = True
        
        r_role = p_sub.add_run(exp["role"])
        r_role.bold = True
        r_role.font.size = Pt(10)
        p_sub.add_run(f"  |  {exp['date']}")
        
        if exp.get("donor"):
            p_donor = doc.add_paragraph()
            p_donor.paragraph_format.space_after = Pt(3)
            p_donor.paragraph_format.keep_with_next = True
            r_donor = p_donor.add_run(exp["donor"])
            r_donor.italic = True
            r_donor.font.size = Pt(9.5)
            r_donor.font.color.rgb = COLOR_MUTED

        for pt in exp["points"]:
            p_pt = doc.add_paragraph(style='List Bullet')
            p_pt.paragraph_format.space_after = Pt(2.5)
            p_pt.paragraph_format.line_spacing = 1.1
            p_pt.add_run(pt)

    # --- EDUCATION ---
    add_section_heading("Education")
    edu_list = ${eduPython}
    for degree, inst, year in edu_list:
        p_edu = doc.add_paragraph()
        p_edu.paragraph_format.space_after = Pt(2)
        r_deg = p_edu.add_run(degree)
        r_deg.bold = True
        p_edu.add_run(f" — {inst} ({year})")

    # --- SPECIALIZED TRAINING ---
    add_section_heading("Specialized Training & Professional Development")
    trainings = ${trainingsPython}
    for t in trainings:
        p_t = doc.add_paragraph(style='List Bullet')
        p_t.paragraph_format.space_after = Pt(2)
        p_t.add_run(t)

    # --- LANGUAGES ---
    add_section_heading("Languages")
    p_lang = doc.add_paragraph()
    p_lang.paragraph_format.space_after = Pt(4)
${langRuns}

    # --- REFERENCES ---
    add_section_heading("References")
    table = doc.add_table(rows=1, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    hdr_cells = table.rows[0].cells
    headers = ["Name", "Institution & Position", "Contact"]
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        hdr_cells[i].paragraphs[0].runs[0].font.bold = True
        hdr_cells[i].paragraphs[0].runs[0].font.size = Pt(10)

    refs = ${refsPython}

    for name, inst, contact in refs:
        row_cells = table.add_row().cells
        row_cells[0].text = name
        row_cells[0].paragraphs[0].runs[0].font.bold = True
        row_cells[1].text = inst
        row_cells[2].text = contact
        for cell in row_cells:
            cell.paragraphs[0].runs[0].font.size = Pt(9.5)

    filename = "CV_${cv.personalDetails.name.replace(/\s+/g, '_')}.docx"
    doc.save(filename)
    print(f"Sucesso! O ficheiro '{filename}' foi gerado!")

if __name__ == "__main__":
    create_meal_cv()
`;
}
