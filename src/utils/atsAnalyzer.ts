import { CVData, AtsAuditResult } from '../types/cv';

// Essential domain dictionaries for international development, MEAL, data & software roles
const DOMAIN_KEYWORD_POOL = [
  'meal',
  'monitoring',
  'evaluation',
  'accountability',
  'learning',
  'logframe',
  'logical framework',
  'theory of change',
  'pirs',
  'dqa',
  'data quality',
  'data quality assurance',
  'power bi',
  'kobotoolbox',
  'kobo',
  'odk',
  'survey solutions',
  'm&e',
  'results-based management',
  'rbm',
  'baseline',
  'endline',
  'pdm',
  'post-distribution monitoring',
  'arcgis',
  'gis',
  'qgis',
  'stata',
  'spss',
  'python',
  'r programming',
  'sql',
  'database',
  'consortium',
  'european union',
  'wfp',
  'fao',
  'undp',
  'camões',
  'ine',
  'sap mm',
  'sap',
  'food security',
  'nutrition',
  'fcs',
  'rcsi',
  'sampling methodology',
  'indicators',
  'kpi',
  'oecd/dac',
  'oecd',
  'capacity building',
  'dashboard',
  'data pipeline',
  'automation',
  'data cleaning',
  'survey architecture',
  'enumerators',
  'field audit',
  'humanitarian',
  'resilience',
  'coordination'
];

const STRONG_ACTION_VERBS = [
  'designed',
  'operationalized',
  'deployed',
  'architected',
  'automated',
  'structured',
  'configured',
  'authored',
  'formulated',
  'spearheaded',
  'led',
  'trained',
  'supervised',
  'computed',
  'modeled',
  'integrated',
  'streamlined',
  'standardized',
  'audited',
  'directed',
  'harmonized',
  'developed',
  'engineered',
  'prototyped'
];

const WEAK_PASSIVE_PHRASES = [
  'responsible for',
  'assisted in',
  'helped with',
  'worked on',
  'participated in',
  'handled some',
  'tasked with',
  'duties included'
];

export function auditCVAgainstJob(cv: CVData, jobText: string): AtsAuditResult {
  // Aggregate CV text
  const cvCorpus = [
    cv.personalDetails.title,
    cv.summary,
    ...cv.competencies.map((c) => `${c.category} ${c.description}`),
    ...cv.experiences.flatMap((e) => [e.role, e.company, e.donor || '', ...e.highlights]),
    ...cv.educations.map((ed) => `${ed.degree} ${ed.institution}`),
    ...cv.trainings,
    ...cv.languages.map((l) => `${l.language} ${l.level}`)
  ]
    .join(' ')
    .toLowerCase();

  const jobLower = (jobText || '').toLowerCase();

  // Extract relevant keywords from the job description
  const targetKeywords: string[] = [];

  // Match known domain keywords present in job description
  DOMAIN_KEYWORD_POOL.forEach((kw) => {
    if (jobLower.includes(kw) && !targetKeywords.includes(kw)) {
      targetKeywords.push(kw);
    }
  });

  // Extract capitalized phrases / technical terms from job description (heuristics)
  const regexTechnical = /\b[A-Z]{2,}(?:\/[A-Z]+)?\b|\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
  const matches = jobText.match(regexTechnical) || [];
  matches.forEach((m) => {
    const clean = m.trim().toLowerCase();
    if (
      clean.length > 2 &&
      !['the', 'and', 'with', 'for', 'minimum', 'years', 'within'].includes(clean) &&
      !targetKeywords.includes(clean)
    ) {
      targetKeywords.push(clean);
    }
  });

  // If no job text provided, use domain pool baseline
  const evaluatedKeywords = targetKeywords.length > 3 ? targetKeywords : DOMAIN_KEYWORD_POOL.slice(0, 20);

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  evaluatedKeywords.forEach((kw) => {
    if (cvCorpus.includes(kw)) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  });

  // Check action verbs
  const strongActionVerbsFound: string[] = [];
  STRONG_ACTION_VERBS.forEach((verb) => {
    if (cvCorpus.includes(verb)) {
      strongActionVerbsFound.push(verb);
    }
  });

  // Check weak passive phrases
  const weakPhrasesFound: string[] = [];
  WEAK_PASSIVE_PHRASES.forEach((phrase) => {
    if (cvCorpus.includes(phrase)) {
      weakPhrasesFound.push(phrase);
    }
  });

  // Check quantifiable metrics (digits, %, numbers, currency)
  const metricRegex = /\b\d+(?:[.,]\d+)?%|\b\d+\s*(?:agents|enumerators|provinces|partners|users|indicators|projects|anos|years)|\b\$\d+|\b€\d+|\b\d+\b/gi;
  const metricsMatches = cvCorpus.match(metricRegex) || [];
  const quantifiableMetricsCount = metricsMatches.length;

  // Calculate ATS Score
  const keywordMatchRatio =
    evaluatedKeywords.length > 0 ? matchedKeywords.length / evaluatedKeywords.length : 0.8;

  let rawScore = keywordMatchRatio * 60; // 60% weight on keywords

  // Metrics bonus (up to 20%)
  if (quantifiableMetricsCount >= 10) rawScore += 20;
  else if (quantifiableMetricsCount >= 5) rawScore += 12;
  else rawScore += 5;

  // Action verbs bonus (up to 15%)
  if (strongActionVerbsFound.length >= 8) rawScore += 15;
  else if (strongActionVerbsFound.length >= 4) rawScore += 10;
  else rawScore += 5;

  // Length & completeness (up to 5%)
  if (cv.summary.length > 150 && cv.experiences.length >= 2) rawScore += 5;

  // Penalize for weak passive phrases
  if (weakPhrasesFound.length > 0) {
    rawScore = Math.max(10, rawScore - weakPhrasesFound.length * 4);
  }

  const score = Math.min(98, Math.max(25, Math.round(rawScore)));

  // Generate actionable recommendations
  const recommendations: string[] = [];

  if (missingKeywords.length > 0) {
    recommendations.push(
      `Inclua as palavras-chave críticas faltantes: "${missingKeywords.slice(0, 4).join(', ')}" nas competências ou bullets de experiência.`
    );
  }

  if (quantifiableMetricsCount < 8) {
    recommendations.push(
      'Adicione mais métricas quantificáveis (ex: percentagens de erro reduzidas, número de agentes treinados, valor orçamental ou parceiros envolvidos).'
    );
  }

  if (weakPhrasesFound.length > 0) {
    recommendations.push(
      `Substitua termos passivos como "${weakPhrasesFound.join(', ')}" por verbos de ação executiva ("Liderou", "Estruturou", "Automatizou").`
    );
  }

  if (cv.summary.length < 200) {
    recommendations.push(
      'O seu Resumo Profissional é muito curto para o padrão internacional. Expanda para 4-5 linhas destacando autoridade técnica e anos de experiência.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Excelente alinhamento! O seu currículo atende aos critérios estruturais e de palavras-chave da vaga.'
    );
  }

  return {
    score,
    matchedKeywords,
    missingKeywords,
    quantifiableMetricsCount,
    strongActionVerbs: strongActionVerbsFound,
    weakPhrasesFound,
    recommendations
  };
}
