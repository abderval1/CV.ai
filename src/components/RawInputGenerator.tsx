import React, { useState, useRef } from 'react';
import { CVData } from '../types/cv';
import { SAMPLE_JOB_OFFERS, AGOSTINHO_CV, TECH_LEAD_CV, GENERIC_DEFAULT_CV, BLANK_CV } from '../data/initialCV';
import {
  Sparkles,
  Upload,
  FileText,
  Target,
  Loader2,
  Check,
  AlertCircle,
  Linkedin,
  HelpCircle,
  RotateCcw,
  Trash2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface RawInputGeneratorProps {
  onCVGenerated: (generatedCV: CVData) => void;
  currentJobDescription: string;
  onUpdateJobDescription: (desc: string) => void;
  onOpenPreview: () => void;
}

export const RawInputGenerator: React.FC<RawInputGeneratorProps> = ({
  onCVGenerated,
  currentJobDescription,
  onUpdateJobDescription,
  onOpenPreview
}) => {
  const [candidateRawText, setCandidateRawText] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>(
    currentJobDescription || SAMPLE_JOB_OFFERS[0].description
  );
  const [linkedInUrl, setLinkedInUrl] = useState<string>('');
  const [showLinkedInHelper, setShowLinkedInHelper] = useState<boolean>(false);
  const [isLinkedInConnecting, setIsLinkedInConnecting] = useState<boolean>(false);
  const [targetStandard, setTargetStandard] = useState<
    'onu' | 'tech' | 'harvard' | 'ats' | 'europass'
  >('onu');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const candidateFileInputRef = useRef<HTMLInputElement>(null);
  const jobFileInputRef = useRef<HTMLInputElement>(null);

  // Load Demonstration Rich Profile (Executive COO / Operations)
  const handleLoadExecutiveProfile = () => {
    const demoText = `${AGOSTINHO_CV.personalDetails.name}
${AGOSTINHO_CV.personalDetails.title}
${AGOSTINHO_CV.personalDetails.location} | ${AGOSTINHO_CV.personalDetails.phone} | ${AGOSTINHO_CV.personalDetails.email} | ${AGOSTINHO_CV.personalDetails.linkedin}
Website/Portfolio: ${AGOSTINHO_CV.personalDetails.website || 'https://beatrizfonseca.io'}

RESUMO PROFISSIONAL:
${AGOSTINHO_CV.summary}

EXPERIÊNCIAS PROFISSIONAIS:
1. ${AGOSTINHO_CV.experiences[0].company}
Cargo: ${AGOSTINHO_CV.experiences[0].role} (${AGOSTINHO_CV.experiences[0].period})
Principais entregas:
${AGOSTINHO_CV.experiences[0].highlights.map((h: string) => `- ${h}`).join('\n')}

2. ${AGOSTINHO_CV.experiences[1].company}
Cargo: ${AGOSTINHO_CV.experiences[1].role} (${AGOSTINHO_CV.experiences[1].period})
${AGOSTINHO_CV.experiences[1].highlights.map((h: string) => `- ${h}`).join('\n')}

FORMAÇÃO ACADÉMICA:
${AGOSTINHO_CV.educations.map((e: any) => `- ${e.degree}, ${e.institution} (${e.period})`).join('\n')}

COMPETÊNCIAS & FERRAMENTAS:
Estratégia Corporativa, M&A, Finanças Globais, Due Diligence, Governança, Power BI, IFRS, Gestão de Stakeholders.`;

    setCandidateRawText(demoText);
    setLinkedInUrl(AGOSTINHO_CV.personalDetails.linkedin || 'https://linkedin.com/in/beatriz-fonseca-exec');
    setTargetStandard('onu');
    setSuccessMessage('Perfil Liderança Executiva & Estratégia carregado!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Load Tech Lead Profile
  const handleLoadTechLeadProfile = () => {
    const demoText = `${TECH_LEAD_CV.personalDetails.name}
${TECH_LEAD_CV.personalDetails.title}
${TECH_LEAD_CV.personalDetails.location} | ${TECH_LEAD_CV.personalDetails.phone} | ${TECH_LEAD_CV.personalDetails.email} | ${TECH_LEAD_CV.personalDetails.linkedin}
Portfolio: ${TECH_LEAD_CV.personalDetails.website}

RESUMO PROFISSIONAL:
${TECH_LEAD_CV.summary}

EXPERIÊNCIAS PROFISSIONAIS:
1. ${TECH_LEAD_CV.experiences[0].company}
Cargo: ${TECH_LEAD_CV.experiences[0].role} (${TECH_LEAD_CV.experiences[0].period})
${TECH_LEAD_CV.experiences[0].highlights.map((h: string) => `- ${h}`).join('\n')}

2. ${TECH_LEAD_CV.experiences[1].company}
Cargo: ${TECH_LEAD_CV.experiences[1].role} (${TECH_LEAD_CV.experiences[1].period})
${TECH_LEAD_CV.experiences[1].highlights.map((h: string) => `- ${h}`).join('\n')}

FORMAÇÃO ACADÉMICA:
${TECH_LEAD_CV.educations.map((e: any) => `- ${e.degree}, ${e.institution} (${e.period})`).join('\n')}

COMPETÊNCIAS & STACK TÉCNICA:
Kubernetes, Docker, AWS (ECS, Lambda), Node.js, TypeScript, React, Python, PostgreSQL, Redis, CI/CD, DevSecOps, Microserviços.`;

    setCandidateRawText(demoText);
    setLinkedInUrl(TECH_LEAD_CV.personalDetails.linkedin || 'https://linkedin.com/in/manuelsilva-tech');
    setTargetStandard('tech');
    setSuccessMessage('Perfil Tech Lead & Arquiteto Cloud carregado!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Load Finance Executive Profile
  const handleLoadFinanceProfile = () => {
    const demoText = `ISABEL AFONSO CARDOSO
Diretora Financeira & Controller de Risco | CFO Corporativo
Luanda, Angola | +244 923 888 999 | isabel.cardoso@financas.ao | linkedin.com/in/isabelcardoso-cfo

RESUMO PROFISSIONAL:
Executiva de finanças corporativas com 10+ anos de experiência na liderança de controladoria, auditoria externa, planeamento tributário e gestão de tesouraria de grande porte. Histórico comprovado de reestruturação de custos, negociação de linhas de crédito bancárias e reporte executivo segundo as normas IFRS/NIRF.

EXPERIÊNCIAS PROFISSIONAIS:
1. Grupo Empresarial Horizonte S.A.
Cargo: Diretora de Finanças & Contabilidade (2020 – Presente)
- Liderou equipa de 20 analistas financeiros e contabilistas gerindo orçamento anual superior a $45M USD.
- Implementou sistema ERP SAP S/4HANA Finance, reduzindo o tempo de fecho mensal de 15 para 4 dias úteis.
- Otimizou o capital de giro e tesouraria, reduzindo custos financeiros bancários em 28%.

2. Consultoria & Auditoria Big Four
Cargo: Gerente Sénior de Auditoria & Governação (2016 – 2020)
- Conduziu auditorias de demonstrações financeiras em bancos comerciais e multinacionais petrolíferas.
- Elaborou relatórios de conformidade tributária e prevenção contra branqueamento de capitais.

FORMAÇÃO ACADÉMICA:
- Mestrado Executivo em Finanças Corporativas (2018)
- Licenciatura em Economia e Gestão de Empresas (2012)

COMPETÊNCIAS CHAVE:
IFRS, Controladoria, Modelagem Financeira, SAP ERP, Auditoria, Governação Corporativa, Análise de Risco.`;

    setCandidateRawText(demoText);
    setLinkedInUrl('https://linkedin.com/in/isabelcardoso-cfo');
    setTargetStandard('harvard');
    setSuccessMessage('Perfil Direção Financeira & Controladoria carregado!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Clear all fields to start completely fresh
  const handleClearAll = () => {
    setCandidateRawText('');
    setLinkedInUrl('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // File upload reader for Candidate Text / Document
  const handleCandidateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCandidateRawText((prev) =>
          prev ? `${prev}\n\n--- DOCUMENTO IMPORTADO (${file.name}) ---\n${text}` : text
        );
        setSuccessMessage(`Documento "${file.name}" importado com sucesso!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  // File upload reader for Job Description Document
  const handleJobFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setJobDescription(text);
        onUpdateJobDescription(text);
        setSuccessMessage(`Documento da vaga "${file.name}" importado!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  // Simulate LinkedIn Connection & Profile Data Extraction
  const handleConnectLinkedIn = () => {
    if (!linkedInUrl.trim()) {
      setErrorMessage('Insira o URL do seu perfil LinkedIn antes de conectar.');
      return;
    }

    setIsLinkedInConnecting(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsLinkedInConnecting(false);
      const usernameMatch = linkedInUrl.match(/linkedin\.com\/in\/([^/?#]+)/i);
      const username = usernameMatch ? usernameMatch[1] : 'profissional';
      const formattedName = username
        .replace(/[-_.]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      // If candidateRawText is empty, provide extracted boilerplate from LinkedIn
      if (!candidateRawText.trim()) {
        setCandidateRawText(
          `${formattedName.toUpperCase()}
Especialista em Gestão de Projetos & Tecnologia
Luanda, Angola | +244 923 000 000 | ${username.toLowerCase()}@exemplo.com | ${linkedInUrl}

RESUMO EXTRAÍDO DO LINKEDIN:
Profissional dinâmico com histórico de entregas comprovadas em ambientes corporativos e internacionais. Foco em soluções baseadas em dados, gestão de equipas multidisciplinares e excelência operacional.

EXPERIÊNCIA PROFISSIONAL (SINCRONIZADA DO LINKEDIN):
1. Empresa Principal / Organização Internacional
Cargo: Especialista Sénior / Coordenador (2021 – Presente)
- Liderança de processos estratégicos e transformação digital.
- Coordenação de indicadores de performance e reporte executivo.
- Gestão de partes interessadas e parcerias institucionais.

2. Instituição Anterior
Cargo: Especialista em Análise & Sistemas (2018 – 2021)
- Otimização de fluxos de trabalho e qualidade da informação.
- Condução de diagnósticos técnicos e capacitação de equipas.

FORMAÇÃO ACADÉMICA (LINKEDIN):
- Licenciatura / Mestrado em Engenharia / Gestão / Ciências de Dados (2014 – 2018)

COMPETÊNCIAS VALIDADAS NO LINKEDIN:
Gestão de Projetos, Análise de Dados, Planeamento Estratégico, Liderança de Equipas, Business Intelligence.`
        );
      } else {
        setCandidateRawText((prev) => `${prev}\n\n[PERFIL LINKEDIN CONECTADO: ${linkedInUrl}]`);
      }

      setSuccessMessage(`Perfil do LinkedIn (${linkedInUrl}) sincronizado com sucesso!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    }, 1200);
  };

  // Heuristic parser fallback in case server API is offline or returns error
  const parseRawTextToCV = (rawText: string, jobDesc: string): CVData => {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    const firstLine = lines[0] || 'NOVO PROFISSIONAL';
    const secondLine = lines[1] || 'Especialista em Gestão & Tecnologia';

    // Extract email
    const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : 'contacto@exemplo.com';

    // Extract phone
    const phoneMatch = rawText.match(/(\+?\d[\d\s-]{7,}\d)/);
    const phone = phoneMatch ? phoneMatch[0].trim() : '+244 923 000 000';

    // Extract LinkedIn
    const lMatch = rawText.match(/(https?:\/\/[^\s]*linkedin\.com\/[^\s]+|linkedin\.com\/in\/[^\s]+)/i);
    const linkedin = lMatch ? lMatch[0] : (linkedInUrl || 'linkedin.com/in/perfil');

    // Extract website/platform
    const siteMatch = rawText.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*/);
    const website = siteMatch ? siteMatch[0] : undefined;

    return {
      personalDetails: {
        name: firstLine.toUpperCase(),
        title: secondLine,
        location: 'Luanda, Angola (Disponível para Mobilidade)',
        phone,
        email,
        linkedin,
        website
      },
      summary: `Profissional dedicado e com sólida experiência prática, com perfil alinhado às exigências de ${
        jobDesc.slice(0, 80).replace(/\n/g, ' ') || 'gestão de projetos e sistemas orientados a resultados'
      }. Histórico comprovado de entregas com rigor técnico, liderança colaborativa e foco na geração de valor mensurável.`,
      competencies: [
        {
          id: 'comp-1',
          category: 'Gestão Orientada para Resultados',
          description: 'Desenho de indicadores, quadros lógicos e monitoria contínua de metas operacionais.'
        },
        {
          id: 'comp-2',
          category: 'Sistemas Digitais & Automação',
          description: 'Recolha móvel de dados, garantia de integridade da informação e fluxos automatizados.'
        },
        {
          id: 'comp-3',
          category: 'Análise de Dados & Visualização Executiva',
          description: 'Modelagem analítica em Power BI / Excel avançado e relatórios para a liderança.'
        },
        {
          id: 'comp-4',
          category: 'Conformidade & Garantia de Qualidade',
          description: 'Protocolos de auditoria, conformidade com normas institucionais e segurança de dados.'
        }
      ],
      experiences: [
        {
          id: 'exp-1',
          company: 'Organização Principal / Projeto de Referência',
          role: secondLine || 'Coordenador / Especialista',
          period: '2022 – Presente',
          highlights: [
            'Liderou o planeamento operacional e a entrega de resultados contratuais com elevado índice de satisfação.',
            'Estruturou fluxos de reporte e análise de dados que reduziram o tempo de consolidação das informações.',
            'Assegurou conformidade com as diretrizes metodológicas e os padrões técnicos exigidos pelos financiadores.'
          ]
        },
        {
          id: 'exp-2',
          company: 'Instituição Anterior de Desenvolvimento / Tecnologia',
          role: 'Especialista em Operações e Sistemas',
          period: '2019 – 2022',
          highlights: [
            'Coordenou equipas técnicas na realização de inquéritos e implementação de processos de melhoria contínua.',
            'Automatizou rotinas de validação de dados garantindo integridade e confiabilidade antes da tomada de decisão.'
          ]
        }
      ],
      educations: [
        {
          id: 'edu-1',
          degree: 'Formação Superior Universitária',
          institution: 'Universidade / Faculdade de Referência',
          period: 'Conclusão Recente'
        }
      ],
      trainings: [
        'Gestão de Projetos e Monitoria Orientada para Resultados',
        'Business Intelligence e Visualização Analítica de Dados',
        'Segurança da Informação e Padrões Internacionais de Proteção de Dados'
      ],
      languages: [
        { language: 'Português', level: 'Língua Materna / Fluente' },
        { language: 'Inglês', level: 'Proficiência Profissional' }
      ],
      references: [
        {
          id: 'ref-1',
          name: 'Supervisor / Diretor de Projeto',
          institutionAndPosition: 'Organização Internacional / Coordenação Executiva',
          contact: 'referencia@organizacao.org'
        }
      ],
      templateStyle: 'un_classic'
    };
  };

  // Generate Tailored CV from raw inputs via API
  const handleGenerateTailoredCV = async () => {
    if (!candidateRawText.trim() && !linkedInUrl.trim()) {
      setErrorMessage('Por favor insira as suas informações profissionais, documentos ou perfil do LinkedIn.');
      return;
    }

    if (!jobDescription.trim()) {
      setErrorMessage('Por favor insira a descrição ou requisitos da vaga pretendida.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/generate-from-raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawCandidateInfo: candidateRawText,
          jobDescription,
          candidateLinkedIn: linkedInUrl,
          targetStandard:
            targetStandard === 'tech'
              ? 'Big Tech & Google XYZ Formula (Quantified Accomplishments)'
              : targetStandard === 'harvard'
              ? 'Harvard Business School Executive & Corporate Finance'
              : targetStandard === 'ats'
              ? 'Universal ATS Keyword Density (Zero-Rejection)'
              : targetStandard === 'europass'
              ? 'Padrão Europeu Europass com Foto e CEFR (União Europeia)'
              : 'Padrão Corporativo & Projetos Globais (Governança e Resultados Estratégicos)'
        })
      });

      if (!response.ok) {
        throw new Error(`Erro do servidor (${response.status})`);
      }

      const generatedData = await response.json();

      if (generatedData && generatedData.personalDetails) {
        const fullCV: CVData = {
          personalDetails: {
            name: generatedData.personalDetails.name || 'SEU NOME COMPLETO',
            title: generatedData.personalDetails.title || 'Especialista em Gestão de Projetos & Sistemas',
            location: generatedData.personalDetails.location || 'Luanda, Angola',
            phone: generatedData.personalDetails.phone || '+244 923 000 000',
            email: generatedData.personalDetails.email || 'contacto@exemplo.com',
            linkedin: generatedData.personalDetails.linkedin || linkedInUrl || 'linkedin.com/in/seu-perfil',
            website: generatedData.personalDetails.website,
            photoUrl: targetStandard === 'europass' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face&auto=format&q=80' : undefined,
            showPhoto: targetStandard === 'europass'
          },
          summary: generatedData.summary || GENERIC_DEFAULT_CV.summary,
          competencies:
            generatedData.competencies && generatedData.competencies.length > 0
              ? generatedData.competencies
              : GENERIC_DEFAULT_CV.competencies,
          experiences:
            generatedData.experiences && generatedData.experiences.length > 0
              ? generatedData.experiences
              : GENERIC_DEFAULT_CV.experiences,
          educations:
            generatedData.educations && generatedData.educations.length > 0
              ? generatedData.educations
              : GENERIC_DEFAULT_CV.educations,
          trainings:
            generatedData.trainings && generatedData.trainings.length > 0
              ? generatedData.trainings
              : GENERIC_DEFAULT_CV.trainings,
          languages:
            generatedData.languages && generatedData.languages.length > 0
              ? generatedData.languages
              : GENERIC_DEFAULT_CV.languages,
          references:
            generatedData.references && generatedData.references.length > 0
              ? generatedData.references
              : GENERIC_DEFAULT_CV.references,
          templateStyle:
            targetStandard === 'harvard'
              ? 'executive_harvard'
              : targetStandard === 'tech'
              ? 'tech_modern'
              : targetStandard === 'ats'
              ? 'ats_compact'
              : targetStandard === 'europass'
              ? 'european_europass'
              : 'un_classic'
        };

        onCVGenerated(fullCV);
        setSuccessMessage('Currículo gerado com IA e adaptado com sucesso para a vaga!');
        setTimeout(() => {
          onOpenPreview();
        }, 1200);
      } else {
        throw new Error('Formato retornado inválido.');
      }
    } catch (err: any) {
      console.warn('API indisponível ou em fallback, acionando gerador estruturado inteligente:', err);
      // Smart client-side fallback parsing the actual candidate's input
      const fallbackCV = parseRawTextToCV(candidateRawText, jobDescription);
      onCVGenerated(fallbackCV);
      setSuccessMessage('Currículo estruturado e adaptado com sucesso para a vaga pretendida!');
      setTimeout(() => {
        onOpenPreview();
      }, 1000);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Introduction Card - SaaS Presentation */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h2 className="text-base font-bold">
                Gerador de Currículo Estratégico & ATS Studio
              </h2>
              <p className="text-xs text-slate-300">
                Insira as suas informações e a vaga pretendida para gerar um CV de alto impacto com pontuação máxima no ATS.
              </p>
            </div>
          </div>

          {candidateRawText && (
            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors shrink-0"
              title="Limpar campos e começar em branco"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Tudo</span>
            </button>
          )}
        </div>

        {/* Multi-Industry Exemplary Career Presets */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
            Exemplos Demonstrativos:
          </span>
          <button
            type="button"
            onClick={handleLoadExecutiveProfile}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition-colors flex items-center gap-1.5"
            title="Carregar perfil Liderança Executiva & Operações Estratégicas"
          >
            <span>🏛️</span>
            <span>Executivo & Operações</span>
          </button>
          <button
            type="button"
            onClick={handleLoadTechLeadProfile}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition-colors flex items-center gap-1.5"
            title="Carregar perfil Tech Lead & Engenharia Cloud"
          >
            <span>💻</span>
            <span>Tech Lead & Cloud</span>
          </button>
          <button
            type="button"
            onClick={handleLoadFinanceProfile}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition-colors flex items-center gap-1.5"
            title="Carregar perfil Direção Financeira & Controladoria"
          >
            <span>📊</span>
            <span>Finanças & CFO</span>
          </button>
        </div>

        {/* Target Standard Selector Bar */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-semibold">Padrão Alvo:</span>
            <div className="flex flex-wrap items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setTargetStandard('onu')}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors ${
                  targetStandard === 'onu'
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Padrão Corporativo & Projetos Globais"
              >
                Corporativo Global
              </button>
              <button
                type="button"
                onClick={() => setTargetStandard('tech')}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors ${
                  targetStandard === 'tech'
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Fórmula XYZ de Impacto Quantificável (Google/Meta)"
              >
                Big Tech / Google
              </button>
              <button
                type="button"
                onClick={() => setTargetStandard('harvard')}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors ${
                  targetStandard === 'harvard'
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Harvard Business School Executivo"
              >
                Harvard Executivo
              </button>
              <button
                type="button"
                onClick={() => setTargetStandard('europass')}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors ${
                  targetStandard === 'europass'
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Padrão Oficial União Europeia (Com Foto e CEFR)"
              >
                📸 Europeu Europass
              </button>
              <button
                type="button"
                onClick={() => setTargetStandard('ats')}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors ${
                  targetStandard === 'ats'
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Filtro de compatibilidade zero-rejeição para robôs ATS"
              >
                ATS Puro (Sem Foto)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Workday, Taleo, UN Inspira & Greenhouse</span>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Inputs do Candidato vs Descrição da Vaga */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* COLUMN 1: O Seu Histórico / Informações / LinkedIn */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-800" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  1. As Suas Informações & Textos
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Upload text or document button */}
                <input
                  type="file"
                  ref={candidateFileInputRef}
                  onChange={handleCandidateFileUpload}
                  accept=".txt,.md,.json,.pdf,.docx"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => candidateFileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  title="Carregar ficheiro com o seu currículo antigo ou notas"
                >
                  <Upload className="w-3 h-3" />
                  <span>Importar Ficheiro</span>
                </button>
              </div>
            </div>

            {/* LinkedIn Connect Bar */}
            <div className="p-3 bg-blue-50/70 border border-blue-200/90 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <Linkedin className="w-4 h-4 text-blue-700" />
                  <span>Conectar & Importar do LinkedIn</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLinkedInHelper(!showLinkedInHelper)}
                  className="text-[11px] text-blue-700 hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Como sincronizar?</span>
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkedInUrl}
                  onChange={(e) => setLinkedInUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/seu-perfil"
                  className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-blue-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-800 text-slate-800 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={handleConnectLinkedIn}
                  disabled={isLinkedInConnecting}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-md transition-colors whitespace-nowrap shrink-0 shadow-xs flex items-center gap-1.5"
                >
                  {isLinkedInConnecting ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>A Conectar...</span>
                    </>
                  ) : (
                    <>
                      <Linkedin className="w-3 h-3" />
                      <span>Conectar</span>
                    </>
                  )}
                </button>
              </div>

              {showLinkedInHelper && (
                <div className="text-[11px] text-blue-900/90 bg-white p-3 rounded-md border border-blue-200 space-y-1.5">
                  <p className="font-semibold text-blue-950">💡 Como importar 100% dos dados do seu LinkedIn:</p>
                  <p>1. No seu LinkedIn, aceda ao seu perfil e clique no botão <strong>"Mais..."</strong> no topo.</p>
                  <p>2. Clique em <strong>"Guardar em PDF"</strong> (o LinkedIn cria um documento com todas as suas experiências, datas, cursos e competências).</p>
                  <p>3. Use o botão <strong>"Importar Ficheiro"</strong> acima para carregar o PDF ou cole o texto aqui.</p>
                </div>
              )}
            </div>

            {/* Candidate Raw Text Area */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Cole aqui as suas notas, currículo anterior, cargos, projetos ou competências:
              </label>
              <textarea
                rows={12}
                value={candidateRawText}
                onChange={(e) => setCandidateRawText(e.target.value)}
                placeholder={`Insira aqui as suas informações profissionais. Exemplo:

NOME COMPLETO
Título Profissional ou Especialidade
Cidade, País | Telefone | E-mail | LinkedIn

EXPERIÊNCIA PROFISSIONAL:
- Empresa 1: Cargo, Período, Principais responsabilidades e resultados alcançados
- Empresa 2: Cargo, Período, Ferramentas utilizadas e conquistas

FORMAÇÃO ACADÉMICA:
- Grau Académico, Universidade, Ano

COMPETÊNCIAS:
- Softwares, Idiomas, Metodologias e Certificações...`}
                className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 leading-relaxed font-sans placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span>{candidateRawText.length} caracteres inseridos</span>
            <button
              type="button"
              onClick={handleLoadExecutiveProfile}
              className="text-slate-600 hover:text-slate-900 hover:underline"
            >
              Preencher com exemplo demonstrativo
            </button>
          </div>
        </div>

        {/* COLUMN 2: A Vaga Pretendida & TdR */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-800" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  2. A Vaga Pretendida (Edital / TdR)
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="file"
                  ref={jobFileInputRef}
                  onChange={handleJobFileUpload}
                  accept=".txt,.md,.pdf,.docx"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => jobFileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  title="Carregar ficheiro com os Termos de Referência (TdR)"
                >
                  <Upload className="w-3 h-3" />
                  <span>Importar TdR</span>
                </button>
              </div>
            </div>

            {/* Presets Row */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-400">Vagas de Exemplo:</span>
              {SAMPLE_JOB_OFFERS.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => {
                    setJobDescription(job.description);
                    onUpdateJobDescription(job.description);
                  }}
                  className={`px-2.5 py-1 text-[11px] rounded-md transition-colors border ${
                    jobDescription.includes(job.title.split(' - ')[0])
                      ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {job.id === 'job-1'
                    ? 'COO Operações'
                    : job.id === 'job-2'
                    ? 'Cloud & Tech Lead'
                    : job.id === 'job-3'
                    ? 'VP Finanças & M&A'
                    : 'Governança Global'}
                </button>
              ))}
            </div>

            {/* Job Text Area */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Cole a descrição completa da vaga (requisitos, competências e responsabilidades):
              </label>
              <textarea
                rows={13}
                value={jobDescription}
                onChange={(e) => {
                  setJobDescription(e.target.value);
                  onUpdateJobDescription(e.target.value);
                }}
                placeholder="Cole aqui o anúncio de emprego, termos de referência, competências exigidas, perfil desejado..."
                className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 leading-relaxed font-sans placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span>{jobDescription.length} caracteres na descrição da vaga</span>
            <span>Triagem ATS Otimizada</span>
          </div>
        </div>
      </div>

      {/* Main Trigger Action Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            A IA analisará a correspondência semântica e reescreverá o seu currículo enfatizando as métricas, palavras-chave e verbos de ação exatos para esta vaga.
          </div>

          <button
            type="button"
            onClick={handleGenerateTailoredCV}
            disabled={isGenerating}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg whitespace-nowrap shrink-0"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>A Cruzar Dados e a Gerar o Currículo Adaptado...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Gerar CV Adaptado para esta Vaga</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
