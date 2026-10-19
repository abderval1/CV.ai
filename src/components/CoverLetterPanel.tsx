import React, { useState } from 'react';
import { CVData } from '../types/cv';
import {
  Sparkles,
  Copy,
  Check,
  Printer,
  Loader2,
  Download,
  Languages,
  Globe
} from 'lucide-react';
import { generateCoverLetterDocx, triggerDownload } from '../utils/docxExport';

interface CoverLetterPanelProps {
  cv: CVData;
  jobDescription: string;
  letterBody: string;
  setLetterBody: (body: string) => void;
  onExportWord?: () => void;
  isExportingWord?: boolean;
}

type SupportedLanguage = 'en' | 'pt' | 'fr' | 'es' | 'custom';

const BUILT_IN_LETTERS: Record<
  'en' | 'pt' | 'fr' | 'es',
  (cv: CVData) => string
> = {
  en: (cv) => `To: The Selection and Recruitment Committee
Expertise France / European Union Delegation in Angola
Luanda, Angola

Subject: Application for the Position of MEAL & Information Systems Coordinator

Dear Members of the Selection Committee,

It is with great interest and deep professional dedication that I submit my application for the position of Senior MEAL & Information Systems Coordinator. With solid progressive experience in designing, operationalizing, and automating digital Monitoring, Evaluation, Accountability, and Learning (MEAL) systems, I bring a proven track record of direct leadership in large-scale international development programmes funded by the European Union (such as the FRESAN Programme, co-managed by Camões, I.P., FAO, and UNDP) and the United Nations World Food Programme (WFP) in Angola.

Under technical assistance with Camões, I.P., I was directly responsible for architecting, programming, and deploying the collaborative digital platform for the project's Results-Oriented MEAL Information System (accessible in production at https://sgi-fresancamoes.com/). Leading the full delivery of contractual Terms of Reference (ToR) products, I structured multi-tier public and private interfaces, automated provincial data flows across Huíla, Namibe, and Cunene with real-time pre-analysis verification thresholds, and ensured strict OECD/DAC (2019) alignment and compliance with Camões, I.P. Information Security Policies.

Furthermore, my operational expertise in electronic mobile data collection (KoBoToolbox, ODK, Survey Solutions, and WFP MoDA), data quality assurance (DQA) field audits, and executive dashboard modeling in Power BI enables leadership teams and international donors to make agile, evidence-based strategic decisions. In multi-agency consortia, I have consistently harmonized methodologies and indicators between national ministries (INE, MINAGRIF) and field implementing partners.

Driven by the strategic vision and humanitarian impact of your initiative, and prepared for immediate deployment, I welcome the opportunity to discuss my qualifications in greater detail during a technical interview.

Sincerely,

${cv.personalDetails.name || 'Agostinho do Rosário'}
${cv.personalDetails.title || 'Senior MEAL & Information Systems Specialist'}
${cv.personalDetails.phone || '+244 930 744 338'} | ${cv.personalDetails.email || 'rosarioabderval@gmail.com'}`,

  pt: (cv) => `A/C: Comité de Seleção e Recrutamento
Expertise France / Delegação da União Europeia em Angola
Luanda, Angola

Assunto: Candidatura ao posto de MEAL & Information Systems Coordinator

Exmos. Senhores Membros do Comité de Seleção,

É com elevado interesse e sentido de compromisso que apresento a minha candidatura à posição de MEAL & Information Systems Coordinator. Com sólida trajetória no desenho, operacionalização e automação de sistemas digitais de Monitoria, Avaliação, Prestação de Contas e Aprendizagem (MEAL), trago a experiência comprovada de atuação direta em programas de grande escala financiados pela União Europeia (como o Programa FRESAN, co-gerido pelo Camões, I.P., FAO e PNUD) e pelo Programa Alimentar Mundial das Nações Unidas (WFP) em Angola.

No âmbito da assistência técnica ao Camões, I.P., fui o responsável direto pela concepção, programação e entrada em produção da Plataforma Digital Colaborativa do Sistema de Gestão de Informação MEAL (disponível em https://sgi-fresancamoes.com/). Liderando a entrega de todos os produtos do Termo de Referência (TdR), estruturei as interfaces pública e privada, automatizei os fluxos de dados de campo das províncias da Huíla, Namibe e Cunene com regras de alerta pré-análise para a equipa M&A da UIC, e garanti a integração de indicadores orientados a resultados segundo os referenciais da OCDE/CAD e as Políticas de Segurança da Informação do Camões, I.P.

Destaco igualmente a minha experiência na estruturação de fluxos de recolha móvel (KoboToolbox, ODK, Survey Solutions e WFP MoDA), auditorias de qualidade de dados (DQA), e concepção de painéis analíticos interativos em Power BI para suporte a decisões estratégicas e reporte a doadores internacionais. Adicionalmente, a minha intervenção em consórcios multiatores consolidou a minha capacidade de diálogo e harmonização metodológica com ministérios setoriais (INE, MINAGRIF) e parceiros de implementação no terreno.

Motivado pela relevância dos vossos objetivos e com plena capacidade de entrega imediata, coloco-me à disposição para aprofundar a demonstração das minhas competências numa entrevista técnica.

Com os meus melhores cumprimentos,

${cv.personalDetails.name || 'Agostinho do Rosário'}
${cv.personalDetails.title || 'Senior MEAL & Information Systems Specialist'}
${cv.personalDetails.phone || '+244 930 744 338'} | ${cv.personalDetails.email || 'rosarioabderval@gmail.com'}`,

  fr: (cv) => `À l'attention du : Comité de Sélection et de Recrutement
Expertise France / Délégation de l'Union Européenne en Angola
Luanda, Angola

Objet : Candidature au poste de Coordonnateur MEAL et Systèmes d'Information

Madame, Monsieur les Membres du Comité de Sélection,

C'est avec un vif intérêt et un profond engagement professionnel que je vous soumets ma candidature au poste de Coordonnateur MEAL et Systèmes d'Information. Fort d'une expérience progressive dans la conception, l'opérationnalisation et l'automatisation des systèmes numériques de Suivi, Évaluation, Redevabilité et Apprentissage (MEAL), j'apporte un bilan éprouvé de leadership au sein de programmes d'envergure financés par l'Union Européenne (notamment le programme FRESAN, cogéré par Camões, I.P., la FAO et le PNUD) et le Programme Alimentaire Mondial des Nations Unies (PAM / WFP) en Angola.

Dans le cadre de mon assistance technique auprès de Camões, I.P., j'ai été directement responsable de la conception architecturale, du développement logiciel et du déploiement en production de la Plateforme Numérique Collaborative du Système d'Information MEAL (accessible en production sur https://sgi-fresancamoes.com/). Assurant la livraison intégrale des livrables contractuels des Termes de Référence (TdR), j'ai structuré les interfaces publique et privée, automatisé les flux de données de terrain des provinces de Huíla, Namibe et Cunene avec des seuils d'alerte de pré-analyse pour l'équipe S&E de l'UIC, en stricte conformité avec les critères de l'OCDE/CAD (2019) et les politiques de sécurité de l'information.

De surcroît, mon expertise dans les outils de collecte mobile (KoBoToolbox, ODK, Survey Solutions et WFP MoDA), les audits d'assurance qualité des données (DQA) et la modélisation de tableaux de bord interactifs sur Power BI permet aux équipes de direction et aux bailleurs de prendre des décisions stratégiques fondées sur des données probantes. Au sein de consortiums multipartites, j'ai harmonisé avec succès les méthodologies entre ministères nationaux (INE, MINAGRIF) et partenaires d'exécution.

Résolument motivé par la portée stratégique de vos interventions et immédiatement disponible, je me tiens à votre entière disposition pour tout entretien technique.

Veuillez agréer, Madame, Monsieur les Membres du Comité de Sélection, l'expression de mes salutations distinguées.

${cv.personalDetails.name || 'Agostinho do Rosário'}
${cv.personalDetails.title || 'Spécialiste MEAL & Systèmes d\'Information'}
${cv.personalDetails.phone || '+244 930 744 338'} | ${cv.personalDetails.email || 'rosarioabderval@gmail.com'}`,

  es: (cv) => `A la atención de: Comité de Selección y Reclutamiento
Expertise France / Delegación de la Unión Europea en Angola
Luanda, Angola

Asunto: Candidatura al puesto de Coordinador MEAL y Sistemas de Información

Estimados Miembros del Comité de Selección:

Es con gran interés y sólido compromiso profesional que presento mi candidatura al puesto de Coordinador MEAL y Sistemas de Información. Con una trayectoria progresiva en el diseño, operacionalización y automatización de sistemas digitales de Monitoreo, Evaluación, Rendición de Cuentas y Aprendizaje (MEAL), aporto experiencia comprobada en programas internacionales financiados por la Unión Europea (como el Programa FRESAN, cogestionado por Camões, I.P., FAO y PNUD) y por el Programa Mundial de Alimentos de las Naciones Unidas (WFP) en Angola.

En el marco de la asistencia técnica a Camões, I.P., fui el responsable directo de la arquitectura, programación y puesta en producción de la Plataforma Digital Colaborativa del Sistema de Información MEAL (disponible en https://sgi-fresancamoes.com/). Liderando la entrega de todos los productos de los Términos de Referencia (TdR), diseñé interfaces públicas y privadas multinivel, automaticé los flujos de datos de campo en Huíla, Namibe y Cunene con umbrales de alerta previa para el equipo de M&E de la UIC, garantizando la alineación con los estándares OCDE/CAD (2019) y las Políticas de Seguridad de la Información.

Asimismo, mi dominio de la recolección móvil (KoBoToolbox, ODK, Survey Solutions y WFP MoDA), auditorías de calidad de datos (DQA) y tableros ejecutivos en Power BI proporciona a las direcciones estratégicas y a los donantes información rigurosa y en tiempo real. En consorcios multiagenciales, he armonizado con éxito metodologías de seguimiento con ministerios nacionales (INE, MINAGRIF) y socios locales.

Motivado por la misión y el impacto de su proyecto, y con plena disponibilidad de incorporación inmediata, quedo a su disposición para profundizar en mis competencias en una entrevista técnica.

Atentamente,

${cv.personalDetails.name || 'Agostinho do Rosário'}
${cv.personalDetails.title || 'Especialista en MEAL y Sistemas de Información'}
${cv.personalDetails.phone || '+244 930 744 338'} | ${cv.personalDetails.email || 'rosarioabderval@gmail.com'}`
};

export const CoverLetterPanel: React.FC<CoverLetterPanelProps> = ({
  cv,
  jobDescription,
  letterBody,
  setLetterBody,
  onExportWord,
  isExportingWord: externalExporting
}) => {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('en');
  const [customLanguageName, setCustomLanguageName] = useState<string>('Alemão');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExportingInternal, setIsExportingInternal] = useState<boolean>(false);

  const isExportingDocx = externalExporting ?? isExportingInternal;

  // Language switch handler (instant switch between high-impact preloads)
  const handleSelectLanguage = (lang: 'en' | 'pt' | 'fr' | 'es') => {
    setSelectedLang(lang);
    setLetterBody(BUILT_IN_LETTERS[lang](cv));
  };

  // Translate letter with Gemini AI
  const handleTranslateWithAi = async (targetLangName: string) => {
    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: letterBody,
          targetLanguage: targetLangName
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.translatedText) {
          setLetterBody(data.translatedText);
        }
      }
    } catch (e) {
      console.warn('Erro na tradução com IA, mantendo texto:', e);
      alert('Não foi possível traduzir com o serviço online neste momento.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Generate / Regenerate with AI in the current language
  const handleGenerateAiLetter = async () => {
    setIsGeneratingAi(true);
    const langNames: Record<SupportedLanguage, string> = {
      en: 'English (United Nations / International Standard)',
      pt: 'Português (Padrão Camões, I.P. / União Europeia)',
      fr: 'Français (Expertise France / Francophonie)',
      es: 'Español (AECID / Cooperación Internacional)',
      custom: customLanguageName
    };

    try {
      const response = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData: cv,
          jobDescription,
          language: langNames[selectedLang]
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.letterBody) {
          setLetterBody(data.letterBody);
        }
      }
    } catch (e) {
      console.warn('Cover letter AI fetch failed, fallback to template:', e);
      if (selectedLang in BUILT_IN_LETTERS) {
        setLetterBody(BUILT_IN_LETTERS[selectedLang as 'en' | 'pt' | 'fr' | 'es'](cv));
      }
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Export to Word (.docx)
  const handleExportDocx = async () => {
    if (onExportWord) {
      onExportWord();
      return;
    }
    setIsExportingInternal(true);
    try {
      const blob = await generateCoverLetterDocx(cv, letterBody);
      const sanitizedName =
        cv.personalDetails.name.trim().replace(/\s+/g, '_') || 'Agostinho_do_Rosario';
      const langSuffix = selectedLang.toUpperCase();
      triggerDownload(blob, `Cover_Letter_${sanitizedName}_${langSuffix}.docx`);
    } catch (e) {
      console.error('Erro ao gerar carta em Word:', e);
      alert('Erro ao gerar documento Word da carta de apresentação.');
    } finally {
      setIsExportingInternal(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(letterBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Configuration & Language Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-700" />
              <span>Carta de Apresentação Internacional</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Escolha o idioma de envio oficial da vaga ou traduza para qualquer língua com IA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Action: Download Word (.docx) */}
            <button
              type="button"
              onClick={handleExportDocx}
              disabled={isExportingDocx}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
              title="Descarregar Carta de Apresentação em formato Word (.docx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingDocx ? 'A Gerar .docx...' : 'Descarregar Word (.docx)'}</span>
            </button>

            <button
              type="button"
              onClick={handleGenerateAiLetter}
              disabled={isGeneratingAi}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-60 rounded-lg transition-colors shadow-xs"
            >
              {isGeneratingAi ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span>Regerar c/ IA</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiada!' : 'Copiar'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Language Selector Segmented Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-700 mr-1 flex items-center gap-1">
              <Languages className="w-3.5 h-3.5" />
              <span>Idioma Oficial:</span>
            </span>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => handleSelectLanguage('en')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  selectedLang === 'en'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇬🇧 Inglês (EN)
              </button>

              <button
                type="button"
                onClick={() => handleSelectLanguage('pt')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  selectedLang === 'pt'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇵🇹 Português (PT)
              </button>

              <button
                type="button"
                onClick={() => handleSelectLanguage('fr')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  selectedLang === 'fr'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇫🇷 Francês (FR)
              </button>

              <button
                type="button"
                onClick={() => handleSelectLanguage('es')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  selectedLang === 'es'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇪🇸 Espanhol (ES)
              </button>
            </div>
          </div>

          {/* Translate to other custom language with AI */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={customLanguageName}
              onChange={(e) => setCustomLanguageName(e.target.value)}
              placeholder="Outro idioma (ex: Alemão, Árabe)"
              className="text-xs px-2.5 py-1 border border-slate-200 rounded-md w-36 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
            <button
              type="button"
              onClick={() => handleTranslateWithAi(customLanguageName)}
              disabled={isTranslating || !customLanguageName.trim()}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 rounded-md transition-colors shadow-xs flex items-center gap-1"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>A Traduzir...</span>
                </>
              ) : (
                <span>Traduzir c/ IA</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Letter Canvas Container */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-100">
          <span className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
            Corpo da Carta ({selectedLang === 'en' ? 'Inglês Internacional' : selectedLang === 'pt' ? 'Português' : selectedLang === 'fr' ? 'Francês' : selectedLang === 'es' ? 'Espanhol' : customLanguageName}) — Editável em Tempo Real
          </span>
          <span>{letterBody.split('\n').length} parágrafos</span>
        </div>

        <textarea
          rows={19}
          value={letterBody}
          onChange={(e) => setLetterBody(e.target.value)}
          className="w-full text-[13.5px] leading-relaxed p-4 border border-slate-200 rounded-lg font-serif-cv text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-800"
        />
      </div>
    </div>
  );
};
