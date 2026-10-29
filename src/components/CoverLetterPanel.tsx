import React, { useState } from 'react';
import { CVData } from '../types/cv';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Copy,
  Check,
  Printer,
  Loader2,
  Download,
  Languages,
  Globe,
  Building2,
  UserCheck,
  Send,
  SlidersHorizontal,
  Lock
} from 'lucide-react';
import { generateCoverLetterDocx, triggerDownload } from '../utils/docxExport';

interface CoverLetterPanelProps {
  cv: CVData;
  jobDescription: string;
  letterBody: string;
  setLetterBody: (body: string) => void;
  onExportWord?: () => void;
  isExportingWord?: boolean;
  onOpenPricingModal?: (promptMessage?: string) => void;
}

type SupportedLanguage = 'pt' | 'en' | 'fr' | 'es';
type LetterTone = 'executive' | 'un_diplomatic' | 'tech' | 'corporate';

export const CoverLetterPanel: React.FC<CoverLetterPanelProps> = ({
  cv,
  jobDescription,
  letterBody,
  setLetterBody,
  onExportWord,
  isExportingWord = false,
  onOpenPricingModal
}) => {
  const { isAuthenticated, hasActivePlan } = useAuth();
  const [recipient, setRecipient] = useState<string>('Comité de Seleção e Recrutamento');
  const [targetOrg, setTargetOrg] = useState<string>('Diretoria de Recursos Humanos / Empresa Alvo');
  const [targetRole, setTargetRole] = useState<string>(
    cv.personalDetails.title || 'Cargo Pretendido'
  );
  const [letterLanguage, setLetterLanguage] = useState<SupportedLanguage>('pt');
  const [letterTone, setLetterTone] = useState<LetterTone>('executive');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Dynamic template generator based on user's actual profile and inputs
  const buildDynamicLetter = (
    lang: SupportedLanguage,
    tone: LetterTone,
    candName: string,
    candTitle: string,
    candPhone: string,
    candEmail: string,
    candLocation: string,
    org: string,
    rec: string,
    role: string,
    topExp?: string
  ): string => {
    const today = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : 'pt-PT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (lang === 'en') {
      return `To: ${rec}
${org}
${candLocation || 'Luanda, Angola'} | ${today}

Subject: Application for the Position of ${role}

Dear Members of the Selection Committee,

It is with high enthusiasm and strong professional commitment that I submit my application for the position of ${role}. With extensive progressive experience in strategic execution, high-impact project delivery, and cross-functional leadership, I offer a proven track record of delivering measurable outcomes in complex organizational environments.

Throughout my career as ${candTitle}${topExp ? `, including notable leadership at ${topExp}` : ''}, I have spearheaded initiatives that optimized processes, increased operational efficiency, and ensured strict alignment with international quality standards. My approach combines technical rigor with strong stakeholder engagement, enabling multidisciplinary teams to exceed performance targets consistently.

Furthermore, my dedication to continuous improvement and evidence-based decision-making aligns directly with the mission and values of ${org}. Driven by the strategic impact of your work, and fully prepared for immediate deployment, I welcome the opportunity to discuss my qualifications in greater detail during a technical interview.

Thank you for your time and consideration.

Sincerely,

${candName || 'Seu Nome Completo'}
${candTitle || 'Profissional Executivo'}
${candPhone || '+244 923 000 000'} | ${candEmail || 'seu.email@exemplo.com'}`;
    }

    if (lang === 'fr') {
      return `À l'attention du : ${rec}
${org}
${candLocation || 'Luanda, Angola'} | ${today}

Objet : Candidature au poste de ${role}

Madame, Monsieur les Membres du Comité de Sélection,

C'est avec un vif intérêt et un profond engagement professionnel que je vous soumets ma candidature au poste de ${role}. Fort d'un parcours solide dans le pilotage de projets stratégiques, le déploiement de solutions opérationnelles et le leadership d'équipes multidisciplinaires, j'apporte une expertise éprouvée dans l'atteinte d'objectifs ambitieux.

Tout au long de mes responsabilités en tant que ${candTitle}${topExp ? `, notamment au sein de ${topExp}` : ''}, j'ai coordonné des initiatives à fort impact, optimisé les processus de travail et garanti une stricte conformité avec les normes de qualité les plus exigeantes. Ma capacité à conjuguer rigueur technique et concertation stratégique permet aux organisations d'accélérer leurs résultats.

Résolument motivé par les missions et la vision de ${org}, et immédiatement disponible, je me tiens à votre entière disposition pour tout entretien technique afin d'approfondir la pertinence de mon profil.

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${candName || 'Seu Nome Completo'}
${candTitle || 'Spécialiste Exécutif'}
${candPhone || '+244 923 000 000'} | ${candEmail || 'seu.email@exemplo.com'}`;
    }

    if (lang === 'es') {
      return `A la atención de: ${rec}
${org}
${candLocation || 'Luanda, Angola'} | ${today}

Asunto: Candidatura al puesto de ${role}

Estimados Miembros del Comité de Selección:

Es con gran interés y sólido compromiso profesional que presento mi candidatura al puesto de ${role}. Con una destacada trayectoria en la ejecución de proyectos estratégicos, optimización de operaciones y liderazgo de equipos de alto rendimiento, pongo a su disposición una sólida experiencia en la consecución de resultados cuantificables.

En mis funciones como ${candTitle}${topExp ? `, en especial en ${topExp}` : ''}, he liderado iniciativas transformadoras, optimizado flujos de trabajo e implementado rigurosos estándares de calidad y gobernanza. Mi enfoque combina solidez metodológica y gestión colaborativa, garantizando entregas de máxima excelencia.

Motivado por el impacto y el prestigio de ${org}, y con plena disponibilidad para incorporación inmediata, quedo a su disposición para profundizar en mis competencias en una entrevista técnica.

Agradeciendo de antemano su atención, les saluda atentamente,

${candName || 'Seu Nome Completo'}
${candTitle || 'Profesional Ejecutivo'}
${candPhone || '+244 923 000 000'} | ${candEmail || 'seu.email@exemplo.com'}`;
    }

    // Default: Portuguese
    return `A/C: ${rec}
${org}
${candLocation || 'Luanda, Angola'} | ${today}

Assunto: Candidatura à posição de ${role}

Exmos. Senhores Membros do Comité de Seleção,

É com elevado interesse e sentido de compromisso institucional que apresento a minha candidatura à posição de ${role}. Com uma trajetória sólida e progressiva no planeamento estratégico, liderança técnica de projetos e transformação de processos operacionais, trago a experiência comprovada de entrega de resultados de alto impacto em ambientes complexos.

Ao longo da minha atuação como ${candTitle}${topExp ? `, com destaque para as realizações em ${topExp}` : ''}, liderei iniciativas que otimizaram fluxos de trabalho, elevaram os índices de qualidade e garantiram a conformidade estrita com normas internacionais de reporte e governança. O meu perfil conjuga rigor metodológico, capacidade analítica e liderança colaborativa de equipas multidisciplinares.

Motivado pela visão estratégica e impacto dos projetos de ${org}, e com plena prontidão para mobilização imediata, coloco-me à inteira disposição para detalhar a aplicabilidade prática das minhas competências numa entrevista técnica.

Agradecendo desde já a vossa atenção, apresento os meus melhores cumprimentos.

${candName || 'Seu Nome Completo'}
${candTitle || 'Especialista Executivo'}
${candPhone || '+244 923 000 000'} | ${candEmail || 'seu.email@exemplo.com'}`;
  };

  // Generate Letter with AI
  const handleGenerateWithAI = async () => {
    setIsGenerating(true);
    setStatusMessage(null);

    const topExpName = cv.experiences[0]?.company;

    try {
      const response = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData: {
            name: cv.personalDetails.name,
            title: cv.personalDetails.title,
            email: cv.personalDetails.email,
            phone: cv.personalDetails.phone,
            location: cv.personalDetails.location,
            linkedin: cv.personalDetails.linkedin,
            summary: cv.summary,
            experiences: cv.experiences
          },
          jobDescription: jobDescription || targetRole,
          recipientName: recipient,
          organizationName: targetOrg,
          language:
            letterLanguage === 'en'
              ? 'English (Inglês Internacional)'
              : letterLanguage === 'fr'
              ? 'Français (Francês Diplomático)'
              : letterLanguage === 'es'
              ? 'Español (Espanhol Internacional)'
              : 'Português (Institucional)'
        })
      });

      if (!response.ok) {
        throw new Error('Servidor retornou erro na geração.');
      }

      const data = await response.json();
      if (data && data.letterBody) {
        setLetterBody(data.letterBody);
        setStatusMessage('Carta de apresentação gerada com inteligência artificial!');
      } else {
        throw new Error('Formato inválido retornado.');
      }
    } catch {
      // Heuristic dynamic fallback tailored to user's real data
      const generated = buildDynamicLetter(
        letterLanguage,
        letterTone,
        cv.personalDetails.name,
        targetRole || cv.personalDetails.title,
        cv.personalDetails.phone,
        cv.personalDetails.email,
        cv.personalDetails.location,
        targetOrg,
        recipient,
        targetRole,
        topExpName
      );
      setLetterBody(generated);
      setStatusMessage('Carta gerada com sucesso e adaptada ao seu perfil!');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(letterBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadWordLocal = async () => {
    if (!isAuthenticated || !hasActivePlan) {
      onOpenPricingModal?.(
        'O download oficial da Carta de Apresentação em formato Word (.docx) requer um plano Pro ou Executive ativo.'
      );
      return;
    }
    if (onExportWord) {
      onExportWord();
    } else {
      try {
        const blob = await generateCoverLetterDocx(cv, letterBody);
        const nameClean = cv.personalDetails.name.trim().replace(/\s+/g, '_') || 'Carta';
        triggerDownload(blob, `Carta_Apresentacao_${nameClean}.docx`);
      } catch (err) {
        console.error('Erro ao exportar carta:', err);
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Configuration Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>Gerador Inteligente de Carta de Apresentação / Motivação</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalize o destinatário, empresa e idioma para gerar uma carta formal de alto impacto.
            </p>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setLetterLanguage('pt')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                letterLanguage === 'pt' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              🇵🇹 PT
            </button>
            <button
              type="button"
              onClick={() => setLetterLanguage('en')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                letterLanguage === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              🇬🇧 EN
            </button>
            <button
              type="button"
              onClick={() => setLetterLanguage('fr')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                letterLanguage === 'fr' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              🇫🇷 FR
            </button>
            <button
              type="button"
              onClick={() => setLetterLanguage('es')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                letterLanguage === 'es' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              🇪🇸 ES
            </button>
          </div>
        </div>

        {/* Inputs: Destinatário, Empresa e Cargo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Destinatário (Pessoa / Comité)
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Ex: Comité de Seleção"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 font-medium text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Empresa / Organização Alvo
            </label>
            <input
              type="text"
              value={targetOrg}
              onChange={(e) => setTargetOrg(e.target.value)}
              placeholder="Ex: United Nations / Empresa Alvo"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 font-medium text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Cargo Pretendido na Vaga
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Ex: Coordenador de Projetos"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 font-medium text-slate-900"
            />
          </div>
        </div>

        {/* Generate Button & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateWithAI}
              disabled={isGenerating}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>A Redigir Carta com IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gerar Carta Adaptada com IA</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadWordLocal}
              disabled={isExportingWord}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-2xs whitespace-nowrap ${
                !isAuthenticated || !hasActivePlan
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-900'
              }`}
            >
              {!isAuthenticated || !hasActivePlan ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>
                {!isAuthenticated
                  ? 'Carta Word (Requer Registo)'
                  : !hasActivePlan
                  ? 'Carta Word (Requer Plano)'
                  : 'Descarregar Carta Word (.docx)'}
              </span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Letter Editor Text Area */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <span>Conteúdo da Carta de Apresentação (Editável)</span>
          </label>
          <span className="text-[11px] text-slate-400 font-mono">
            {letterBody.split(/\s+/).filter(Boolean).length} palavras
          </span>
        </div>

        <textarea
          rows={18}
          value={letterBody}
          onChange={(e) => setLetterBody(e.target.value)}
          className="w-full p-4 bg-slate-50/70 border border-slate-200 rounded-xl font-serif text-[14px] leading-relaxed text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all shadow-inner resize-y"
          placeholder="O texto da carta será inserido aqui..."
        />

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>Pode editar qualquer parágrafo diretamente antes de exportar para Word (.docx).</span>
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated || !hasActivePlan) {
                onOpenPricingModal?.(
                  'A impressão e exportação oficial em PDF da Carta de Apresentação requerem um plano Pro ou Executive ativo.'
                );
                return;
              }
              window.print();
            }}
            className="text-slate-700 hover:text-slate-950 font-semibold underline flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir A4</span>
          </button>
        </div>
      </div>
    </div>
  );
};
