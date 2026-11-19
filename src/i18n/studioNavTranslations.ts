import { SiteLanguageCode } from './siteTranslations';

export interface StudioTabMeta {
  label: string;
  shortLabel: string;
  tooltip: string;
  guideText: string;
}

export interface StudioNavDictionary {
  primaryGroupLabel: string;
  toolsGroupLabel: string;
  tabs: {
    raw: StudioTabMeta;
    editor: StudioTabMeta;
    cover: StudioTabMeta;
    ai: StudioTabMeta;
    ats: StudioTabMeta;
    jobs: StudioTabMeta;
    interview: StudioTabMeta;
  };
  editorGuides: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    stepTabsTitle: {
      profile: string;
      career: string;
      credentials: string;
      structure: string;
    };
    readinessTooltip: string;
    checklistTooltip: string;
    photoToggleTooltip: string;
    photoManageTooltip: string;
    examplesTooltip: string;
    aiOptimizeTooltip: string;
    addRoleTooltip: string;
    achievementTemplatesTooltip: string;
    actionVerbsTooltip: string;
    addBulletTooltip: string;
    clustersTooltip: string;
    densityTooltips: {
      compact: string;
      normal: string;
      relaxed: string;
    };
    addOptionalRefBtn: string;
    optionalRefTooltip: string;
    step4Instruction: string;
    sectionOrderInstruction: string;
  };
}

export const STUDIO_NAV_TRANSLATIONS: Record<SiteLanguageCode, StudioNavDictionary> = {
  pt: {
    primaryGroupLabel: 'Fluxo principal',
    toolsGroupLabel: 'Melhorar e candidatar',
    tabs: {
      raw: {
        label: '1. Importar',
        shortLabel: '1. Importar',
        tooltip: 'Comece aqui: importe do LinkedIn, envie um PDF ou cole o seu texto para preencher o currículo automaticamente.',
        guideText: 'Passo 1: Cole o link do LinkedIn, envie um PDF ou escreva os seus dados — o sistema cria o currículo organizado automaticamente.'
      },
      editor: {
        label: '2. Editar CV',
        shortLabel: '2. Editar CV',
        tooltip: 'Ajuste os seus dados pessoais, experiências profissionais, formação, competências e o visual do currículo.',
        guideText: 'Passo 2: Preencha ou refine cada secção do currículo. Passe o rato sobre qualquer botão para ver o que faz.'
      },
      cover: {
        label: '3. Carta',
        shortLabel: '3. Carta',
        tooltip: 'Gere e edite uma carta de apresentação personalizada com base no seu currículo e na vaga.',
        guideText: 'Passo 3: Crie uma carta de apresentação alinhada ao seu currículo e pronta a descarregar em PDF ou Word.'
      },
      ai: {
        label: 'Otimizar IA',
        shortLabel: 'Otimizar IA',
        tooltip: 'Reescreve e adapta o currículo à descrição de uma vaga específica com palavras-chave estratégicas.',
        guideText: 'Cole a descrição da vaga para adaptar automaticamente o resumo, conquistas e competências com IA.'
      },
      ats: {
        label: 'ATS Radar',
        shortLabel: 'ATS Radar',
        tooltip: 'Verifica se o currículo passa nos sistemas automáticos de triagem (ATS) usados pelos recrutadores.',
        guideText: 'Analise a compatibilidade do seu currículo com os filtros automáticos de RH e veja o que melhorar.'
      },
      jobs: {
        label: 'Vagas',
        shortLabel: 'Vagas',
        tooltip: 'Descubra oportunidades compatíveis com o seu perfil e alinhe o currículo à vaga escolhida.',
        guideText: 'Explore sugestões de vagas alinhadas ao seu perfil e aplique os requisitos diretamente no seu CV.'
      },
      interview: {
        label: 'Entrevista',
        shortLabel: 'Entrevista',
        tooltip: 'Simulador de entrevista com perguntas prováveis da vaga e sugestões de resposta baseadas no seu CV.',
        guideText: 'Treine perguntas reais de entrevista personalizadas para o seu currículo e a vaga pretendida.'
      }
    },
    editorGuides: {
      step1: 'Comece pelo nome, contactos e um resumo curto de 3 a 4 linhas.',
      step2: 'Adicione os seus cargos mais recentes e foque em resultados concretos.',
      step3: 'Inclua formação académica, certificados, competências e idiomas.',
      step4: 'Escolha o modelo, cor, tipo de letra e a ordem das secções.',
      stepTabsTitle: {
        profile: 'Passo 1: Dados pessoais, contactos, foto e resumo profissional',
        career: 'Passo 2: Histórico profissional, cargos e conquistas principais',
        credentials: 'Passo 3: Formação académica, certificações, competências e idiomas',
        structure: 'Passo 4: Modelo visual, cor, tipografia, espaçamento e ordem das secções'
      },
      readinessTooltip: 'Pontuação estimada de prontidão do currículo para sistemas ATS',
      checklistTooltip: 'Abrir lista do que falta preencher para deixar o currículo completo',
      photoToggleTooltip: 'Mostrar ou ocultar a foto no documento final (modelos ATS internacionais costumam omitir foto)',
      photoManageTooltip: 'Carregar nova foto, escolher avatar ou ajustar a imagem do currículo',
      examplesTooltip: 'Inserir um exemplo de resumo pronto para a sua área e editar depois',
      aiOptimizeTooltip: 'Abrir o assistente de IA para adaptar o texto à vaga pretendida',
      addRoleTooltip: 'Criar uma nova entrada de experiência profissional',
      achievementTemplatesTooltip: 'Inserir exemplos prontos de conquistas com métricas por área',
      actionVerbsTooltip: 'Escolher um verbo de impacto (ex.: Liderou, Reduziu, Implementou) para iniciar o ponto',
      addBulletTooltip: 'Adicionar nova linha de conquista ou responsabilidade neste cargo',
      clustersTooltip: 'Adicionar rapidamente um conjunto de competências da sua área',
      densityTooltips: {
        compact: 'Espaçamento compacto: reduz margens para caber em menos páginas (ideal para 1 página A4)',
        normal: 'Espaçamento normal: equilíbrio padrão entre leitura confortável e densidade',
        relaxed: 'Espaçamento amplo: mais respiro visual entre secções'
      },
      addOptionalRefBtn: 'Adicionar referência profissional (opcional)',
      optionalRefTooltip: 'Opcional: hoje só se incluem referências quando o recrutador solicita expressamente',
      step4Instruction: 'Todas as alterações visuais aparecem ao vivo na folha ao lado.',
      sectionOrderInstruction: 'Use as setas para reordenar ou o ícone de olho para mostrar/ocultar uma secção.'
    }
  },
  en: {
    primaryGroupLabel: 'Main flow',
    toolsGroupLabel: 'Enhance & apply',
    tabs: {
      raw: {
        label: '1. Import',
        shortLabel: '1. Import',
        tooltip: 'Start here: import your LinkedIn profile, upload a PDF, or paste existing text to build your CV automatically.',
        guideText: 'Step 1: Paste your LinkedIn URL, upload a PDF, or type your background — we organize everything into your CV.'
      },
      editor: {
        label: '2. Edit CV',
        shortLabel: '2. Edit CV',
        tooltip: 'Edit personal details, work experience, education, skills, and visual styling.',
        guideText: 'Step 2: Review or edit each section. Hover over any button for a quick explanation.'
      },
      cover: {
        label: '3. Letter',
        shortLabel: '3. Letter',
        tooltip: 'Generate and customize a tailored cover letter based on your CV and target role.',
        guideText: 'Step 3: Create a personalized cover letter ready to export as PDF or Word.'
      },
      ai: {
        label: 'AI Tailor',
        shortLabel: 'AI Tailor',
        tooltip: 'Tailor your CV text and keywords to match a specific job posting.',
        guideText: 'Paste the job description to adapt your summary, achievements, and skills with AI.'
      },
      ats: {
        label: 'ATS Radar',
        shortLabel: 'ATS Radar',
        tooltip: 'Check how well your resume passes automated recruiter screening (ATS) filters.',
        guideText: 'Check your resume compatibility with HR screening software and spot missing keywords.'
      },
      jobs: {
        label: 'Jobs',
        shortLabel: 'Jobs',
        tooltip: 'Explore matching roles and align your CV directly with job requirements.',
        guideText: 'Browse matching roles and apply their requirements straight into your CV.'
      },
      interview: {
        label: 'Interview',
        shortLabel: 'Interview',
        tooltip: 'Practice likely interview questions tailored to your CV and target job.',
        guideText: 'Practice personalized interview questions based on your CV and target role.'
      }
    },
    editorGuides: {
      step1: 'Start with your name, contact info, and a crisp 3–4 line summary.',
      step2: 'Add your recent roles and highlight measurable results.',
      step3: 'Include degrees, certifications, core skills, and languages.',
      step4: 'Pick your template, accent color, font, and section order.',
      stepTabsTitle: {
        profile: 'Step 1: Personal details, contacts, photo, and executive summary',
        career: 'Step 2: Work experience, roles, and key achievements',
        credentials: 'Step 3: Education, certifications, skills, and languages',
        structure: 'Step 4: Template design, color, typography, spacing, and section order'
      },
      readinessTooltip: 'Estimated resume readiness score for ATS screening',
      checklistTooltip: 'Open the checklist of remaining items to complete your resume',
      photoToggleTooltip: 'Show or hide your photo on the exported CV (US/ATS formats usually omit photos)',
      photoManageTooltip: 'Upload a photo or manage your profile picture settings',
      examplesTooltip: 'Insert a ready-to-edit summary template for your profession',
      aiOptimizeTooltip: 'Open AI Tailor to adapt your summary to a specific job offer',
      addRoleTooltip: 'Add a new work experience entry',
      achievementTemplatesTooltip: 'Insert ready-made achievement bullets with metrics for your field',
      actionVerbsTooltip: 'Pick a strong action verb (e.g., Led, Reduced, Built) to start your bullet',
      addBulletTooltip: 'Add a new achievement or responsibility line to this role',
      clustersTooltip: 'Quickly add a curated skill group for your industry',
      densityTooltips: {
        compact: 'Compact spacing: tighter margins to help fit on 1 A4 page',
        normal: 'Normal spacing: balanced layout for comfortable reading',
        relaxed: 'Relaxed spacing: extra breathing room between sections'
      },
      addOptionalRefBtn: 'Add professional reference (optional)',
      optionalRefTooltip: 'Optional: modern CVs usually omit references unless explicitly requested',
      step4Instruction: 'All visual changes update live on the A4 preview beside you.',
      sectionOrderInstruction: 'Use arrows to reorder sections or the eye icon to show/hide a section.'
    }
  },
  es: {
    primaryGroupLabel: 'Flujo principal',
    toolsGroupLabel: 'Mejorar y postular',
    tabs: {
      raw: {
        label: '1. Importar',
        shortLabel: '1. Importar',
        tooltip: 'Empieza aquí: importa tu LinkedIn, sube un PDF o pega tu texto para crear el CV automáticamente.',
        guideText: 'Paso 1: Pega tu enlace de LinkedIn, sube un PDF o escribe tu perfil — organizamos todo en tu CV.'
      },
      editor: {
        label: '2. Editar CV',
        shortLabel: '2. Editar CV',
        tooltip: 'Edita tus datos personales, experiencia, formación, habilidades y diseño visual.',
        guideText: 'Paso 2: Completa o ajusta cada sección. Pasa el ratón sobre cualquier botón para ver su función.'
      },
      cover: {
        label: '3. Carta',
        shortLabel: '3. Carta',
        tooltip: 'Genera y edita una carta de presentación adaptada a tu CV y al puesto.',
        guideText: 'Paso 3: Crea una carta de presentación personalizada lista para descargar en PDF o Word.'
      },
      ai: {
        label: 'Optimizar IA',
        shortLabel: 'IA',
        tooltip: 'Adapta el contenido y las palabras clave del CV a una oferta de empleo específica.',
        guideText: 'Pega la descripción del puesto para adaptar automáticamente tu resumen y logros con IA.'
      },
      ats: {
        label: 'ATS Radar',
        shortLabel: 'ATS',
        tooltip: 'Analiza si tu CV supera los filtros automáticos de selección (ATS).',
        guideText: 'Evalúa la compatibilidad de tu CV con los sistemas ATS y descubre qué palabras clave faltan.'
      },
      jobs: {
        label: 'Empleos',
        shortLabel: 'Empleos',
        tooltip: 'Explora vacantes compatibles y adapta tu CV a la oferta seleccionada.',
        guideText: 'Encuentra ofertas acordes a tu perfil y aplica sus requisitos directamente en tu CV.'
      },
      interview: {
        label: 'Entrevista',
        shortLabel: 'Entrevista',
        tooltip: 'Practica preguntas frecuentes de entrevista adaptadas a tu CV y al puesto.',
        guideText: 'Entrena preguntas reales de entrevista personalizadas para tu CV y oferta.'
      }
    },
    editorGuides: {
      step1: 'Empieza por tu nombre, contacto y un resumen breve de 3 a 4 líneas.',
      step2: 'Añade tus puestos más recientes destacando resultados medibles.',
      step3: 'Incluye formación académica, certificados, competencias e idiomas.',
      step4: 'Elige plantilla, color, tipografía y orden de las secciones.',
      stepTabsTitle: {
        profile: 'Paso 1: Datos personales, contacto, foto y resumen profesional',
        career: 'Paso 2: Trayectoria profesional, cargos y logros clave',
        credentials: 'Paso 3: Formación, certificaciones, competencias e idiomas',
        structure: 'Paso 4: Diseño visual, color, tipografía, espaciado y orden'
      },
      readinessTooltip: 'Puntuación estimada de preparación del CV para filtros ATS',
      checklistTooltip: 'Abrir lista de comprobación para completar tu currículum al 100%',
      photoToggleTooltip: 'Mostrar u ocultar la foto en el documento exportado',
      photoManageTooltip: 'Subir o gestionar la fotografía del currículum',
      examplesTooltip: 'Insertar un ejemplo de resumen profesional listo para editar',
      aiOptimizeTooltip: 'Abrir el optimizador de IA para adaptar el texto a una oferta',
      addRoleTooltip: 'Añadir una nueva experiencia profesional',
      achievementTemplatesTooltip: 'Insertar ejemplos de logros con métricas según tu sector',
      actionVerbsTooltip: 'Elegir un verbo de acción de alto impacto para iniciar el punto',
      addBulletTooltip: 'Añadir un nuevo punto de logro o responsabilidad en este cargo',
      clustersTooltip: 'Añadir rápidamente un grupo de competencias de tu área',
      densityTooltips: {
        compact: 'Espaciado compacto: reduce márgenes para ajustar a menos páginas',
        normal: 'Espaciado normal: equilibrio estándar de lectura',
        relaxed: 'Espaciado amplio: mayor aire visual entre secciones'
      },
      addOptionalRefBtn: 'Añadir referencia profesional (opcional)',
      optionalRefTooltip: 'Opcional: normalmente solo se añaden referencias si el reclutador las solicita',
      step4Instruction: 'Todos los cambios visuales se actualizan al instante en la vista previa.',
      sectionOrderInstruction: 'Usa las flechas para reordenar o el icono del ojo para mostrar/ocultar una sección.'
    }
  },
  fr: {
    primaryGroupLabel: 'Parcours principal',
    toolsGroupLabel: 'Optimiser et postuler',
    tabs: {
      raw: {
        label: '1. Importer',
        shortLabel: '1. Importer',
        tooltip: 'Commencez ici : importez votre LinkedIn, un PDF ou collez votre texte pour générer votre CV.',
        guideText: 'Étape 1 : Collez votre lien LinkedIn, importez un PDF ou saisissez votre parcours — tout est structuré automatiquement.'
      },
      editor: {
        label: '2. Éditer CV',
        shortLabel: '2. Éditer CV',
        tooltip: 'Modifiez vos coordonnées, expériences, formations, compétences et mise en page.',
        guideText: 'Étape 2 : Complétez ou ajustez chaque rubrique. Survolez un bouton pour voir son explication.'
      },
      cover: {
        label: '3. Lettre',
        shortLabel: '3. Lettre',
        tooltip: 'Générez une lettre de motivation adaptée à votre CV et à l’offre visée.',
        guideText: 'Étape 3 : Créez une lettre de motivation personnalisée prête pour l’export PDF ou Word.'
      },
      ai: {
        label: 'Optimiser IA',
        shortLabel: 'IA',
        tooltip: 'Adapte votre CV et ses mots-clés à une offre d’emploi précise.',
        guideText: 'Collez l’offre d’emploi pour adapter automatiquement votre résumé et vos réalisations.'
      },
      ats: {
        label: 'Radar ATS',
        shortLabel: 'ATS',
        tooltip: 'Vérifie la compatibilité du CV avec les logiciels de tri des candidatures (ATS).',
        guideText: 'Analysez la compatibilité ATS de votre CV et repérez les mots-clés manquants.'
      },
      jobs: {
        label: 'Offres',
        shortLabel: 'Offres',
        tooltip: 'Découvrez des offres adaptées à votre profil et alignez votre CV dessus.',
        guideText: 'Consultez des offres compatibles et intégrez leurs critères dans votre CV.'
      },
      interview: {
        label: 'Entretien',
        shortLabel: 'Entretien',
        tooltip: 'Préparez les questions probables d’entretien selon votre CV et le poste.',
        guideText: 'Entraînez-vous sur des questions d’entretien ciblées d’après votre CV.'
      }
    },
    editorGuides: {
      step1: 'Commencez par votre nom, vos coordonnées et un court résumé de 3 à 4 lignes.',
      step2: 'Ajoutez vos postes récents en mettant en avant des résultats chiffrés.',
      step3: 'Ajoutez diplômes, certifications, compétences et langues.',
      step4: 'Choisissez le modèle, la couleur, la police et l’ordre des sections.',
      stepTabsTitle: {
        profile: 'Étape 1 : Identité, coordonnées, photo et résumé professionnel',
        career: 'Étape 2 : Expériences professionnelles et réalisations clés',
        credentials: 'Étape 3 : Formation, certifications, compétences et langues',
        structure: 'Étape 4 : Style visuel, couleur, typographie, densité et ordre des sections'
      },
      readinessTooltip: 'Score estimé de compatibilité ATS de votre CV',
      checklistTooltip: 'Voir la liste des éléments à compléter pour finaliser votre CV',
      photoToggleTooltip: 'Afficher ou masquer la photo sur le document exporté',
      photoManageTooltip: 'Importer ou gérer votre photo de profil',
      examplesTooltip: 'Insérer un exemple de résumé prêt à adapter',
      aiOptimizeTooltip: 'Ouvrir l’assistant IA pour adapter le texte à une offre',
      addRoleTooltip: 'Ajouter une nouvelle expérience professionnelle',
      achievementTemplatesTooltip: 'Insérer des exemples de réalisations chiffrées par métier',
      actionVerbsTooltip: 'Choisir un verbe d’action percutant pour débuter la ligne',
      addBulletTooltip: 'Ajouter une nouvelle réalisation ou mission pour ce poste',
      clustersTooltip: 'Ajouter rapidement un groupe de compétences du secteur',
      densityTooltips: {
        compact: 'Espacement compact : réduit les marges pour tenir sur moins de pages',
        normal: 'Espacement normal : équilibre standard de lecture',
        relaxed: 'Espacement aéré : plus d’espace entre les rubriques'
      },
      addOptionalRefBtn: 'Ajouter une référence professionnelle (optionnel)',
      optionalRefTooltip: 'Optionnel : les références ne sont généralement incluses que sur demande',
      step4Instruction: 'Chaque modification visuelle s’applique en direct sur l’aperçu A4.',
      sectionOrderInstruction: 'Utilisez les flèches pour réordonner ou l’icône œil pour afficher/masquer.'
    }
  },
  de: {
    primaryGroupLabel: 'Hauptablauf',
    toolsGroupLabel: 'Optimieren & Bewerben',
    tabs: {
      raw: {
        label: '1. Import',
        shortLabel: '1. Import',
        tooltip: 'Hier starten: LinkedIn-Profil, PDF hochladen oder Text einfügen, um den Lebenslauf automatisch zu erstellen.',
        guideText: 'Schritt 1: LinkedIn-Link, PDF oder Text eingeben — wir strukturieren Ihren Lebenslauf automatisch.'
      },
      editor: {
        label: '2. Lebenslauf',
        shortLabel: '2. Editor',
        tooltip: 'Kontaktdaten, Berufserfahrung, Ausbildung, Skills und Design bearbeiten.',
        guideText: 'Schritt 2: Jede Sektion prüfen oder anpassen. Fahren Sie mit der Maus über Buttons für Hinweise.'
      },
      cover: {
        label: '3. Anschreiben',
        shortLabel: '3. Brief',
        tooltip: 'Passendes Anschreiben auf Basis Ihres Lebenslaufs und der Stelle erstellen.',
        guideText: 'Schritt 3: Individuelles Anschreiben als PDF oder Word exportieren.'
      },
      ai: {
        label: 'KI-Optimierung',
        shortLabel: 'KI',
        tooltip: 'Lebenslauf und Schlüsselwörter gezielt auf eine Stellenanzeige abstimmen.',
        guideText: 'Stellenbeschreibung einfügen, um Profil und Erfolge per KI anzupassen.'
      },
      ats: {
        label: 'ATS-Radar',
        shortLabel: 'ATS',
        tooltip: 'Prüft, wie gut Ihr Lebenslauf automatische Bewerbermanagementsysteme (ATS) besteht.',
        guideText: 'ATS-Kompatibilität prüfen und fehlende Schlüsselwörter erkennen.'
      },
      jobs: {
        label: 'Stellen',
        shortLabel: 'Stellen',
        tooltip: 'Passende Stellen entdecken und den Lebenslauf direkt darauf ausrichten.',
        guideText: 'Passende Stellenangebote durchsuchen und Anforderungen übernehmen.'
      },
      interview: {
        label: 'Interview',
        shortLabel: 'Interview',
        tooltip: 'Typische Interviewfragen passend zu Ihrem Lebenslauf und der Stelle trainieren.',
        guideText: 'Relevante Interviewfragen auf Basis Ihres Lebenslaufs üben.'
      }
    },
    editorGuides: {
      step1: 'Beginnen Sie mit Namen, Kontaktdaten und einer kurzen 3–4-zeiligen Zusammenfassung.',
      step2: 'Fügen Sie aktuelle Positionen mit messbaren Ergebnissen hinzu.',
      step3: 'Ergänzen Sie Studium, Zertifikate, Kompetenzen und Sprachen.',
      step4: 'Wählen Sie Vorlage, Akzentfarbe, Schriftart und Abschnittsreihenfolge.',
      stepTabsTitle: {
        profile: 'Schritt 1: Kontaktdaten, Foto und Kurzprofil',
        career: 'Schritt 2: Berufserfahrung, Positionen und Erfolge',
        credentials: 'Schritt 3: Ausbildung, Zertifikate, Kompetenzen und Sprachen',
        structure: 'Schritt 4: Designvorlage, Farbe, Schrift, Abstände und Reihenfolge'
      },
      readinessTooltip: 'Geschätzte ATS-Bereitschaft Ihres Lebenslaufs',
      checklistTooltip: 'Checkliste öffnen, um fehlende Angaben zu vervollständigen',
      photoToggleTooltip: 'Foto im exportierten Dokument ein- oder ausblenden',
      photoManageTooltip: 'Bewerbungsfoto hochladen oder verwalten',
      examplesTooltip: 'Vorlage für ein Kurzprofil Ihrer Branche einfügen',
      aiOptimizeTooltip: 'KI-Assistent öffnen, um den Text auf eine Stelle abzustimmen',
      addRoleTooltip: 'Neue Berufserfahrung hinzufügen',
      achievementTemplatesTooltip: 'Erfolgsbeispiele mit Kennzahlen nach Berufsfeld einfügen',
      actionVerbsTooltip: 'Starkes Aktionsverb für den Einstieg in den Punkt wählen',
      addBulletTooltip: 'Neuen Erfolgs- oder Aufgabenpunkt zu dieser Stelle hinzufügen',
      clustersTooltip: 'Branchenspezifisches Kompetenzpaket schnell hinzufügen',
      densityTooltips: {
        compact: 'Kompakt: engere Abstände für weniger Seiten (ideal für 1 A4-Seite)',
        normal: 'Normal: ausgewogenes Layout für gute Lesbarkeit',
        relaxed: 'Locker: mehr Weißraum zwischen den Abschnitten'
      },
      addOptionalRefBtn: 'Referenz hinzufügen (optional)',
      optionalRefTooltip: 'Optional: Referenzen werden meist nur auf ausdrückliche Anfrage angegeben',
      step4Instruction: 'Alle Design-Änderungen erscheinen live in der A4-Vorschau.',
      sectionOrderInstruction: 'Pfeile verschieben Abschnitte, das Augensymbol blendet sie ein/aus.'
    }
  },
  it: {
    primaryGroupLabel: 'Flusso principale',
    toolsGroupLabel: 'Ottimizza e candidati',
    tabs: {
      raw: {
        label: '1. Importa',
        shortLabel: '1. Importa',
        tooltip: 'Inizia qui: importa da LinkedIn, carica un PDF o incolla il tuo testo per generare il CV.',
        guideText: 'Passo 1: Incolla il link LinkedIn, carica un PDF o scrivi il tuo profilo — organizziamo tutto nel CV.'
      },
      editor: {
        label: '2. Modifica CV',
        shortLabel: '2. Modifica',
        tooltip: 'Modifica dati personali, esperienze, formazione, competenze e stile grafico.',
        guideText: 'Passo 2: Compila o rifinisci ogni sezione. Passa il mouse sui pulsanti per i suggerimenti.'
      },
      cover: {
        label: '3. Lettera',
        shortLabel: '3. Lettera',
        tooltip: 'Genera e personalizza una lettera di presentazione adatta al tuo CV e all’offerta.',
        guideText: 'Passo 3: Crea una lettera di presentazione pronta da esportare in PDF o Word.'
      },
      ai: {
        label: 'Ottimizza IA',
        shortLabel: 'IA',
        tooltip: 'Adatta il CV e le parole chiave a una specifica offerta di lavoro.',
        guideText: 'Incolla la descrizione dell’offerta per adattare automaticamente profilo e risultati con l’IA.'
      },
      ats: {
        label: 'Radar ATS',
        shortLabel: 'ATS',
        tooltip: 'Verifica quanto il CV supera i filtri automatici di selezione (ATS).',
        guideText: 'Controlla la compatibilità ATS del CV e individua eventuali parole chiave mancanti.'
      },
      jobs: {
        label: 'Offerte',
        shortLabel: 'Offerte',
        tooltip: 'Scopri offerte in linea con il tuo profilo e allinea il CV alla posizione.',
        guideText: 'Esplora offerte compatibili e applica i requisiti direttamente nel tuo CV.'
      },
      interview: {
        label: 'Colloquio',
        shortLabel: 'Colloquio',
        tooltip: 'Esercitati con domande di colloquio basate sul tuo CV e sul ruolo.',
        guideText: 'Prepara risposte mirate alle domande di colloquio per il tuo profilo.'
      }
    },
    editorGuides: {
      step1: 'Inizia da nome, contatti e un breve riepilogo di 3–4 righe.',
      step2: 'Aggiungi i ruoli più recenti evidenziando risultati misurabili.',
      step3: 'Inserisci titoli di studio, certificati, competenze e lingue.',
      step4: 'Scegli modello, colore, carattere e ordine delle sezioni.',
      stepTabsTitle: {
        profile: 'Passo 1: Dati personali, contatti, foto e riepilogo professionale',
        career: 'Passo 2: Esperienza lavorativa, ruoli e risultati chiave',
        credentials: 'Passo 3: Formazione, certificazioni, competenze e lingue',
        structure: 'Passo 4: Modello visivo, colore, carattere, spaziatura e ordine'
      },
      readinessTooltip: 'Punteggio stimato di prontezza del CV per i sistemi ATS',
      checklistTooltip: 'Apri la checklist di ciò che manca per completare il CV',
      photoToggleTooltip: 'Mostra o nascondi la foto nel documento finale',
      photoManageTooltip: 'Carica una nuova foto o gestisci l’immagine del profilo',
      examplesTooltip: 'Inserisci un esempio di riepilogo pronto da modificare',
      aiOptimizeTooltip: 'Apri l’assistente IA per adattare il testo a un’offerta di lavoro',
      addRoleTooltip: 'Aggiungi una nuova esperienza lavorativa',
      achievementTemplatesTooltip: 'Inserisci esempi di risultati con metriche per il tuo settore',
      actionVerbsTooltip: 'Scegli un verbo d’azione efficace per iniziare il punto',
      addBulletTooltip: 'Aggiungi un nuovo punto di risultato o responsabilità',
      clustersTooltip: 'Aggiungi rapidamente un set di competenze del tuo settore',
      densityTooltips: {
        compact: 'Spaziatura compatta: margini ridotti per stare in meno pagine',
        normal: 'Spaziatura normale: equilibrio standard di lettura',
        relaxed: 'Spaziatura ampia: più respiro visivo tra le sezioni'
      },
      addOptionalRefBtn: 'Aggiungi referenza professionale (opzionale)',
      optionalRefTooltip: 'Opzionale: di solito le referenze si aggiungono solo su richiesta del selezionatore',
      step4Instruction: 'Tutte le modifiche visive si aggiornano in tempo reale nell’anteprima A4.',
      sectionOrderInstruction: 'Usa le frecce per riordinare o l’icona occhio per mostrare/nascondere una sezione.'
    }
  }
};
