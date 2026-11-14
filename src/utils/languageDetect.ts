import { CVData } from '../types/cv';

export type DetectedLang = 'pt' | 'en' | 'es' | 'fr' | 'de';

const LANGUAGE_MARKERS: Record<DetectedLang, RegExp[]> = {
  pt: [
    /\b(de|da|do|dos|das|em|no|na|nos|nas|para|por|com|sem|uma|um|uns|umas|não|nao|como|entre|sobre|até|pelo|pela)\b/gi,
    /\b(experiência|experiencia|profissional|formação|formacao|competências|competencias|resumo|habilidades|educação|educacao|presente|atuando|liderança|gestão|gestao|equipa|equipe|desenvolvimento|implementação|projetos|organização|empresa|cargo|período|português|inglês|nativo|fluente)\b/gi,
    /[ãõçê]/gi
  ],
  en: [
    /\b(the|and|with|for|in|of|to|from|by|at|on|as|an|or|that|this|across|within|including|through)\b/gi,
    /\b(experience|professional|summary|skills|education|competencies|achievements|present|current|led|managed|developed|implemented|designed|strategy|management|operations|team|growth|performance|english|native|fluent)\b/gi
  ],
  es: [
    /\b(el|la|los|las|un|una|unos|unas|del|con|por|para|en|sobre|entre|desde|hasta|hacia|sin)\b/gi,
    /\b(experiencia|profesional|formación|competencias|resumen|habilidades|educación|actualidad|presente|liderazgo|gestión|equipo|desarrollo|implementación|proyectos|organización|empresa|puesto|español|inglés|nativo)\b/gi,
    /[ñ¿¡]/gi
  ],
  fr: [
    /\b(le|la|les|des|du|de|un|une|avec|pour|dans|par|sur|entre|chez|sans|sous|vers)\b/gi,
    /\b(expérience|professionnelle|formation|compétences|résumé|éducation|actuel|présent|gestion|équipe|développement|projets|entreprise|poste|période|français|anglais|courant|natif)\b/gi,
    /[àâçéèêëîïôùûüœ]/gi
  ],
  de: [
    /\b(der|die|das|den|dem|des|ein|eine|einer|und|mit|für|von|zu|bei|nach|auf|über|unter|durch)\b/gi,
    /\b(erfahrung|berufserfahrung|ausbildung|kompetenzen|zusammenfassung|fähigkeiten|heute|aktuell|leitung|führung|entwicklung|projekte|unternehmen|deutsch|englisch|fließend|muttersprache)\b/gi,
    /[äöüß]/gi
  ]
};

export function detectTextLanguage(text: string): DetectedLang | null {
  const clean = (text || '').trim();
  if (clean.length < 15) return null;

  const scores: Record<DetectedLang, number> = {
    pt: 0,
    en: 0,
    es: 0,
    fr: 0,
    de: 0
  };

  (Object.keys(LANGUAGE_MARKERS) as DetectedLang[]).forEach((lang) => {
    const patterns = LANGUAGE_MARKERS[lang];
    patterns.forEach((regex, idx) => {
      const matches = clean.match(regex);
      if (matches) {
        // Weight domain vocabulary (idx === 1) higher than generic stopwords or single chars
        const weight = idx === 1 ? 2.5 : idx === 0 ? 1.2 : 1.0;
        scores[lang] += matches.length * weight;
      }
    });
  });

  // Penalize English slightly when Portuguese/French/Spanish/German strong diacritics are present
  if (/[ãõç]/i.test(clean)) scores.pt += 4;
  if (/[ñ¿¡]/i.test(clean)) scores.es += 5;
  if (/[äöüß]/i.test(clean)) scores.de += 5;

  const sorted = (Object.entries(scores) as [DetectedLang, number][]).sort((a, b) => b[1] - a[1]);
  const [topLang, topScore] = sorted[0];
  const [, secondScore] = sorted[1];

  if (topScore < 3) return null;
  if (topScore - secondScore < 1.5 && topScore < 8) return null;
  return topLang;
}

export function detectCVLanguage(cv: CVData | null | undefined): DetectedLang | null {
  if (!cv) return null;
  const sampleParts: string[] = [
    cv.personalDetails?.title || '',
    cv.personalDetails?.location || '',
    cv.summary || '',
    ...(cv.competencies || []).slice(0, 6).flatMap((c) => [c.category, c.description]),
    ...(cv.experiences || []).slice(0, 4).flatMap((e) => [e.role, e.period, ...(e.highlights || []).slice(0, 4)]),
    ...(cv.educations || []).slice(0, 3).map((e) => `${e.degree} ${e.period}`),
    ...(cv.trainings || []).slice(0, 4)
  ];
  return detectTextLanguage(sampleParts.filter(Boolean).join(' \n '));
}
