import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SiteLanguageCode,
  SiteLanguageInfo,
  SITE_LANGUAGES,
  SiteDictionary,
  SITE_DICTIONARIES
} from '../i18n/siteTranslations';
import { StudioTexts, STUDIO_TRANSLATIONS } from '../i18n/studioTranslations';

export type { SiteLanguageCode, SiteLanguageInfo, SiteDictionary, StudioTexts };
export { SITE_LANGUAGES };

export type LanguageCode = 'pt' | 'en' | 'es' | 'fr' | 'de';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  direction?: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'pt', name: 'Português', nativeName: 'Português (BR/PT)', flag: '🇧🇷' },
  { code: 'en', name: 'Inglês', nativeName: 'English (US/UK)', flag: '🇺🇸' },
  { code: 'es', name: 'Espanhol', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Francês', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Alemão', nativeName: 'Deutsch', flag: '🇩🇪' },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  pt: {
    // Navigation & Header
    'nav.home': 'Início',
    'nav.editor': 'Editor de Currículo',
    'nav.tools': 'Ferramentas de IA & Vaga',
    'nav.templates': 'Modelos',
    'nav.pricing': 'Planos',
    'nav.myResumes': 'Meus Currículos',
    'nav.admin': 'Painel SaaS',
    'nav.profile': 'Minha Conta',
    'nav.signIn': 'Entrar',
    'nav.signOut': 'Terminar Sessão',
    'nav.downloadWord': 'Descarregar Word (.docx)',
    'nav.downloading': 'A exportar...',

    // Tool Menu Items
    'tool.atsRadar': 'Radar ATS & Compatibilidade de Vaga',
    'tool.atsRadarDesc': 'Diagnóstico contra filtros de recrutamento com pontuação',
    'tool.aiOptimizer': 'Otimizador IA de Conquistas & Verbos',
    'tool.aiOptimizerDesc': 'Reformulação Google XYZ para máximo impacto executivo',
    'tool.interviewSim': 'Simulador de Entrevista STAR com IA',
    'tool.interviewSimDesc': 'Perguntas comportamentais e avaliação de respostas',
    'tool.coverLetter': 'Carta de Apresentação Executiva',
    'tool.coverLetterDesc': 'Carta de motivação personalizada para a vaga',
    'tool.importData': 'Importar Dados / LinkedIn',
    'tool.importDataDesc': 'Preencha o currículo colando texto ou URL',

    // Editor Sections
    'editor.title': 'Editor de Conteúdo Executivo',
    'editor.subtitle': 'Formule seu histórico com métricas quantificáveis e conformidade ATS',
    'editor.tab.personal': 'Dados Pessoais',
    'editor.tab.summary': 'Resumo Executivo',
    'editor.tab.competencies': 'Competências-Chave',
    'editor.tab.experiences': 'Experiência Profissional',
    'editor.tab.educations': 'Formação Académica',
    'editor.tab.trainings': 'Cursos & Certificações',
    'editor.tab.languages': 'Idiomas',
    'editor.tab.references': 'Referências',
    'editor.tab.layout': 'Layout & Estilo',

    // Editor Actions & Fields
    'editor.fullName': 'Nome Completo',
    'editor.jobTitle': 'Título Profissional Executivo',
    'editor.email': 'E-mail Profissional',
    'editor.phone': 'Telefone / WhatsApp',
    'editor.location': 'Localização (Cidade, País)',
    'editor.linkedin': 'Perfil do LinkedIn',
    'editor.website': 'Website / Portfólio',
    'editor.photo': 'Fotografia Profissional',
    'editor.showPhoto': 'Exibir foto no currículo',
    'editor.addExperience': 'Adicionar Experiência',
    'editor.addEducation': 'Adicionar Formação',
    'editor.addCompetency': 'Adicionar Competência',
    'editor.addReference': 'Adicionar Referência',
    'editor.save': 'Guardar Alterações',
    'editor.saved': 'Guardado!',

    // Document View Toolbar
    'doc.zoomIn': 'Aumentar Zoom',
    'doc.zoomOut': 'Diminuir Zoom',
    'doc.density': 'Espaçamento',
    'doc.densityCompact': 'Compacto',
    'doc.densityNormal': 'Normal',
    'doc.densityRelaxed': 'Arejado',
    'doc.accentColor': 'Cor de Destaque',
    'doc.photoToggle': 'Foto',
    'doc.copyText': 'Copiar Texto',
    'doc.copied': 'Copiado!',
    'doc.exportJson': 'Backup JSON',
    'doc.pdfPrint': 'PDF / Imprimir',
    'doc.pdfReqPlan': 'PDF (Requer Plano)',
    'doc.pdfReqAuth': 'PDF (Requer Registo)',
    'doc.wordDocx': 'Word (.docx)',
    'doc.downloadMultilang': 'Baixar em Outros Idiomas',
    'doc.downloadMultilangDesc': 'Exporte seu currículo traduzido profissionalmente para Inglês, Espanhol, Francês ou Alemão.',
    'doc.officialDocNotice': 'Downloads Oficiais Requerem Assinatura',
    'doc.officialDocSub': 'Ative um plano para exportar em PDF de Alta Resolução e Word sem marca de água.',

    // Multi-Language CV Download Modal
    'cvLang.modalTitle': 'Baixar Currículo em Outro Idioma',
    'cvLang.modalSubtitle': 'Tradução executiva completa com preservação de formatação, métricas Google XYZ e compatibilidade ATS.',
    'cvLang.selectLang': 'Selecione o idioma de destino:',
    'cvLang.currentDoc': 'Idioma Atual do Documento',
    'cvLang.translateAction': 'Traduzir Currículo com IA',
    'cvLang.translating': 'Traduzindo com IA Executiva...',
    'cvLang.downloadPdf': 'Baixar / Imprimir PDF',
    'cvLang.downloadDocx': 'Baixar Word (.docx)',
    'cvLang.applyToEditor': 'Carregar no Editor Principal',
    'cvLang.previewTranslated': 'Pré-visualização do Documento Traduzido',
    'cvLang.translationReady': 'Tradução concluída com sucesso! Escolha o formato de download desejado:',

    // Pricing / Plans
    'pricing.title': 'Planos de Acesso Estratégico',
    'pricing.subtitle': 'Desbloqueie downloads sem marca de água, otimização IA e exportações multilíngues',
    'pricing.free': 'Plano Gratuito',
    'pricing.pro': 'Profissional Pro',
    'pricing.executive': 'Executivo VIP',
    'pricing.monthly': 'Mensal',
    'pricing.yearly': 'Anual (25% desconto)',
    'pricing.subscribeStripe': 'Assinar com Cartão',
    'pricing.payPix': 'Pagar com PIX Instantâneo',
    'pricing.currentPlan': 'Plano Atual',
    'pricing.upgrade': 'Fazer Upgrade',

    // Generic Common
    'common.language': 'Idioma',
    'common.currency': 'Moeda',
    'common.cancel': 'Cancelar',
    'common.close': 'Fechar',
    'common.confirm': 'Confirmar',
    'common.loading': 'A carregar...',
    'common.success': 'Sucesso',
    'common.error': 'Erro'
  },
  en: {
    // Navigation & Header
    'nav.home': 'Home',
    'nav.editor': 'Resume Editor',
    'nav.tools': 'AI & Career Tools',
    'nav.templates': 'Templates',
    'nav.pricing': 'Pricing',
    'nav.myResumes': 'My Resumes',
    'nav.admin': 'SaaS Dashboard',
    'nav.profile': 'My Account',
    'nav.signIn': 'Sign In',
    'nav.signOut': 'Sign Out',
    'nav.downloadWord': 'Download Word (.docx)',
    'nav.downloading': 'Exporting...',

    // Tool Menu Items
    'tool.atsRadar': 'ATS Radar & Job Match',
    'tool.atsRadarDesc': 'Recruiter screening algorithm diagnostic with match score',
    'tool.aiOptimizer': 'AI Action Verb & Metric Optimizer',
    'tool.aiOptimizerDesc': 'Google XYZ rephrasing for maximum leadership impact',
    'tool.interviewSim': 'AI STAR Interview Simulator',
    'tool.interviewSimDesc': 'Behavioral questions and intelligent answer scoring',
    'tool.coverLetter': 'Executive Cover Letter',
    'tool.coverLetterDesc': 'Tailored statement of interest aligned with job posting',
    'tool.importData': 'Import Data / LinkedIn',
    'tool.importDataDesc': 'Pre-fill your resume by pasting raw text or LinkedIn URL',

    // Editor Sections
    'editor.title': 'Executive Content Editor',
    'editor.subtitle': 'Structure your career history with quantifiable metrics and 100% ATS compliance',
    'editor.tab.personal': 'Personal Details',
    'editor.tab.summary': 'Executive Summary',
    'editor.tab.competencies': 'Core Competencies',
    'editor.tab.experiences': 'Professional Experience',
    'editor.tab.educations': 'Education',
    'editor.tab.trainings': 'Certifications & Courses',
    'editor.tab.languages': 'Languages',
    'editor.tab.references': 'References',
    'editor.tab.layout': 'Layout & Style',

    // Editor Actions & Fields
    'editor.fullName': 'Full Name',
    'editor.jobTitle': 'Target Executive Title',
    'editor.email': 'Professional Email',
    'editor.phone': 'Phone / WhatsApp',
    'editor.location': 'Location (City, Country)',
    'editor.linkedin': 'LinkedIn Profile',
    'editor.website': 'Website / Portfolio',
    'editor.photo': 'Professional Headshot',
    'editor.showPhoto': 'Display photo on resume',
    'editor.addExperience': 'Add Experience',
    'editor.addEducation': 'Add Education',
    'editor.addCompetency': 'Add Competency',
    'editor.addReference': 'Add Reference',
    'editor.save': 'Save Changes',
    'editor.saved': 'Saved!',

    // Document View Toolbar
    'doc.zoomIn': 'Zoom In',
    'doc.zoomOut': 'Zoom Out',
    'doc.density': 'Density',
    'doc.densityCompact': 'Compact',
    'doc.densityNormal': 'Normal',
    'doc.densityRelaxed': 'Spacious',
    'doc.accentColor': 'Accent Color',
    'doc.photoToggle': 'Photo',
    'doc.copyText': 'Copy Plain Text',
    'doc.copied': 'Copied!',
    'doc.exportJson': 'JSON Backup',
    'doc.pdfPrint': 'PDF / Print',
    'doc.pdfReqPlan': 'PDF (Plan Required)',
    'doc.pdfReqAuth': 'PDF (Sign In Required)',
    'doc.wordDocx': 'Word (.docx)',
    'doc.downloadMultilang': 'Download in Other Languages',
    'doc.downloadMultilangDesc': 'Export your resume professionally translated into English, Spanish, French, or German.',
    'doc.officialDocNotice': 'Official Downloads Require Subscription',
    'doc.officialDocSub': 'Activate a plan to export clean, watermark-free high-res PDFs and Word documents.',

    // Multi-Language CV Download Modal
    'cvLang.modalTitle': 'Download Resume in Other Languages',
    'cvLang.modalSubtitle': 'Full executive translation preserving formatting, Google XYZ metrics, and ATS compatibility.',
    'cvLang.selectLang': 'Select target language:',
    'cvLang.currentDoc': 'Current Document Language',
    'cvLang.translateAction': 'Translate Resume with AI',
    'cvLang.translating': 'Translating with Executive AI...',
    'cvLang.downloadPdf': 'Download / Print PDF',
    'cvLang.downloadDocx': 'Download Word (.docx)',
    'cvLang.applyToEditor': 'Load into Main Editor',
    'cvLang.previewTranslated': 'Preview Translated Document',
    'cvLang.translationReady': 'Translation completed! Choose your download format:',

    // Pricing / Plans
    'pricing.title': 'Strategic Membership Plans',
    'pricing.subtitle': 'Unlock watermark-free downloads, AI optimization, and multi-language exports',
    'pricing.free': 'Free Tier',
    'pricing.pro': 'Professional Pro',
    'pricing.executive': 'Executive VIP',
    'pricing.monthly': 'Monthly',
    'pricing.yearly': 'Annual (25% off)',
    'pricing.subscribeStripe': 'Subscribe with Card',
    'pricing.payPix': 'Pay with Instant PIX',
    'pricing.currentPlan': 'Current Plan',
    'pricing.upgrade': 'Upgrade Now',

    // Generic Common
    'common.language': 'Language',
    'common.currency': 'Currency',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.loading': 'Loading...',
    'common.success': 'Success',
    'common.error': 'Error'
  },
  es: {
    // Navigation & Header
    'nav.home': 'Inicio',
    'nav.editor': 'Editor de CV',
    'nav.tools': 'Herramientas de IA & Vacante',
    'nav.templates': 'Plantillas',
    'nav.pricing': 'Planes',
    'nav.myResumes': 'Mis Currículums',
    'nav.admin': 'Panel SaaS',
    'nav.profile': 'Mi Cuenta',
    'nav.signIn': 'Iniciar Sesión',
    'nav.signOut': 'Cerrar Sesión',
    'nav.downloadWord': 'Descargar Word (.docx)',
    'nav.downloading': 'Exportando...',

    // Tool Menu Items
    'tool.atsRadar': 'Radar ATS & Compatibilidad de Puesto',
    'tool.atsRadarDesc': 'Diagnóstico contra filtros de reclutamiento con puntuación',
    'tool.aiOptimizer': 'Optimizador IA de Logros & Verbos',
    'tool.aiOptimizerDesc': 'Reformulación Google XYZ para máximo impacto ejecutivo',
    'tool.interviewSim': 'Simulador de Entrevistas STAR con IA',
    'tool.interviewSimDesc': 'Preguntas conductuales y evaluación inteligente de respuestas',
    'tool.coverLetter': 'Carta de Presentación Ejecutiva',
    'tool.coverLetterDesc': 'Carta de motivación personalizada para el puesto',
    'tool.importData': 'Importar Datos / LinkedIn',
    'tool.importDataDesc': 'Rellene su CV pegando texto o enlace de LinkedIn',

    // Editor Sections
    'editor.title': 'Editor de Contenido Ejecutivo',
    'editor.subtitle': 'Estructure su trayectoria con métricas cuantificables y 100% compatible con ATS',
    'editor.tab.personal': 'Datos Personales',
    'editor.tab.summary': 'Resumen Ejecutivo',
    'editor.tab.competencies': 'Competencias Clave',
    'editor.tab.experiences': 'Experiencia Profesional',
    'editor.tab.educations': 'Formación Académica',
    'editor.tab.trainings': 'Cursos & Certificaciones',
    'editor.tab.languages': 'Idiomas',
    'editor.tab.references': 'Referencias',
    'editor.tab.layout': 'Diseño & Estilo',

    // Editor Actions & Fields
    'editor.fullName': 'Nombre Completo',
    'editor.jobTitle': 'Título Profesional Ejecutivo',
    'editor.email': 'Correo Electrónico',
    'editor.phone': 'Teléfono / WhatsApp',
    'editor.location': 'Ubicación (Ciudad, País)',
    'editor.linkedin': 'Perfil de LinkedIn',
    'editor.website': 'Sitio Web / Portafolio',
    'editor.photo': 'Foto Profesional',
    'editor.showPhoto': 'Mostrar foto en el CV',
    'editor.addExperience': 'Agregar Experiencia',
    'editor.addEducation': 'Agregar Formación',
    'editor.addCompetency': 'Agregar Competencia',
    'editor.addReference': 'Agregar Referencia',
    'editor.save': 'Guardar Cambios',
    'editor.saved': '¡Guardado!',

    // Document View Toolbar
    'doc.zoomIn': 'Aumentar Zoom',
    'doc.zoomOut': 'Reducir Zoom',
    'doc.density': 'Espaciado',
    'doc.densityCompact': 'Compacto',
    'doc.densityNormal': 'Normal',
    'doc.densityRelaxed': 'Espacioso',
    'doc.accentColor': 'Color de Acento',
    'doc.photoToggle': 'Foto',
    'doc.copyText': 'Copiar Texto',
    'doc.copied': '¡Copiado!',
    'doc.exportJson': 'Copia JSON',
    'doc.pdfPrint': 'PDF / Imprimir',
    'doc.pdfReqPlan': 'PDF (Requiere Plan)',
    'doc.pdfReqAuth': 'PDF (Requiere Registro)',
    'doc.wordDocx': 'Word (.docx)',
    'doc.downloadMultilang': 'Descargar en Otros Idiomas',
    'doc.downloadMultilangDesc': 'Exporte su CV traducido profesionalmente a Inglés, Francés o Alemán.',
    'doc.officialDocNotice': 'Las Descargas Oficiales Requieren Suscripción',
    'doc.officialDocSub': 'Active un plan para descargar PDFs en alta resolución y Word sin marca de agua.',

    // Multi-Language CV Download Modal
    'cvLang.modalTitle': 'Descargar CV en Otros Idiomas',
    'cvLang.modalSubtitle': 'Traducción ejecutiva completa manteniendo formato, métricas Google XYZ y ATS.',
    'cvLang.selectLang': 'Seleccione el idioma de destino:',
    'cvLang.currentDoc': 'Idioma Actual del Documento',
    'cvLang.translateAction': 'Traducir CV con IA',
    'cvLang.translating': 'Traduciendo con IA Ejecutiva...',
    'cvLang.downloadPdf': 'Descargar / Imprimir PDF',
    'cvLang.downloadDocx': 'Descargar Word (.docx)',
    'cvLang.applyToEditor': 'Cargar en el Editor Principal',
    'cvLang.previewTranslated': 'Vista Previa del Documento Traducido',
    'cvLang.translationReady': '¡Traducción completada con éxito! Elija el formato de descarga:',

    // Pricing / Plans
    'pricing.title': 'Planes de Membresía Estratégica',
    'pricing.subtitle': 'Desbloquee descargas sin marca de agua, optimización con IA y exportación multilingüe',
    'pricing.free': 'Plan Gratuito',
    'pricing.pro': 'Profesional Pro',
    'pricing.executive': 'Ejecutivo VIP',
    'pricing.monthly': 'Mensual',
    'pricing.yearly': 'Anual (25% descuento)',
    'pricing.subscribeStripe': 'Suscribirse con Tarjeta',
    'pricing.payPix': 'Pagar con PIX Instantáneo',
    'pricing.currentPlan': 'Plan Actual',
    'pricing.upgrade': 'Actualizar Plan',

    // Generic Common
    'common.language': 'Idioma',
    'common.currency': 'Moneda',
    'common.cancel': 'Cancelar',
    'common.close': 'Cerrar',
    'common.confirm': 'Confirmar',
    'common.loading': 'Cargando...',
    'common.success': 'Éxito',
    'common.error': 'Error'
  },
  fr: {
    // Navigation & Header
    'nav.home': 'Accueil',
    'nav.editor': 'Éditeur de CV',
    'nav.tools': 'Outils IA & Carrière',
    'nav.templates': 'Modèles',
    'nav.pricing': 'Tarifs',
    'nav.myResumes': 'Mes CV',
    'nav.admin': 'Tableau de bord',
    'nav.profile': 'Mon Compte',
    'nav.signIn': 'Connexion',
    'nav.signOut': 'Déconnexion',
    'nav.downloadWord': 'Télécharger Word (.docx)',
    'nav.downloading': 'Exportation...',

    // Tool Menu Items
    'tool.atsRadar': 'Radar ATS & Adéquation du Poste',
    'tool.atsRadarDesc': 'Diagnostic face aux filtres de recrutement avec score',
    'tool.aiOptimizer': 'Optimiseur IA d’Accomplissements & Verbes',
    'tool.aiOptimizerDesc': 'Reformulation Google XYZ pour un impact de leadership maximal',
    'tool.interviewSim': 'Simulateur d’Entretien STAR avec IA',
    'tool.interviewSimDesc': 'Questions comportementales et évaluation intelligente des réponses',
    'tool.coverLetter': 'Lettre de Motivation Exécutive',
    'tool.coverLetterDesc': 'Lettre d’intérêt sur mesure alignée avec le profil du poste',
    'tool.importData': 'Importer des Données / LinkedIn',
    'tool.importDataDesc': 'Remplissez votre CV en collant du texte ou un lien LinkedIn',

    // Editor Sections
    'editor.title': 'Éditeur de Contenu Exécutif',
    'editor.subtitle': 'Structurez votre parcours avec des métriques quantifiables et 100% de conformité ATS',
    'editor.tab.personal': 'Coordonnées Personnelles',
    'editor.tab.summary': 'Profil Exécutif',
    'editor.tab.competencies': 'Compétences Clés',
    'editor.tab.experiences': 'Expérience Professionnelle',
    'editor.tab.educations': 'Formation & Diplômes',
    'editor.tab.trainings': 'Certifications & Formations',
    'editor.tab.languages': 'Langues',
    'editor.tab.references': 'Références',
    'editor.tab.layout': 'Mise en page & Style',

    // Editor Actions & Fields
    'editor.fullName': 'Nom Complet',
    'editor.jobTitle': 'Titre Professionnel Exécutif',
    'editor.email': 'E-mail Professionnel',
    'editor.phone': 'Téléphone / WhatsApp',
    'editor.location': 'Localisation (Ville, Pays)',
    'editor.linkedin': 'Profil LinkedIn',
    'editor.website': 'Site Web / Portfolio',
    'editor.photo': 'Photo Professionnelle',
    'editor.showPhoto': 'Afficher la photo sur le CV',
    'editor.addExperience': 'Ajouter une Expérience',
    'editor.addEducation': 'Ajouter une Formation',
    'editor.addCompetency': 'Ajouter une Compétence',
    'editor.addReference': 'Ajouter une Référence',
    'editor.save': 'Enregistrer les Modifications',
    'editor.saved': 'Enregistré !',

    // Document View Toolbar
    'doc.zoomIn': 'Zoom Avant',
    'doc.zoomOut': 'Zoom Arrière',
    'doc.density': 'Espacement',
    'doc.densityCompact': 'Compact',
    'doc.densityNormal': 'Normal',
    'doc.densityRelaxed': 'Aéré',
    'doc.accentColor': 'Couleur Principale',
    'doc.photoToggle': 'Photo',
    'doc.copyText': 'Copier le Texte',
    'doc.copied': 'Copié !',
    'doc.exportJson': 'Sauvegarde JSON',
    'doc.pdfPrint': 'PDF / Imprimer',
    'doc.pdfReqPlan': 'PDF (Abonnement Requis)',
    'doc.pdfReqAuth': 'PDF (Connexion Requise)',
    'doc.wordDocx': 'Word (.docx)',
    'doc.downloadMultilang': 'Télécharger en d’autres langues',
    'doc.downloadMultilangDesc': 'Exportez votre CV traduit professionnellement en anglais, espagnol ou allemand.',
    'doc.officialDocNotice': 'Téléchargements Officiels Réservés aux Abonnés',
    'doc.officialDocSub': 'Activez un forfait pour exporter des PDF haute résolution et des fichiers Word sans filigrane.',

    // Multi-Language CV Download Modal
    'cvLang.modalTitle': 'Télécharger le CV dans d’autres langues',
    'cvLang.modalSubtitle': 'Traduction exécutive complète préservant la mise en page, les métriques Google XYZ et l’ATS.',
    'cvLang.selectLang': 'Sélectionnez la langue cible :',
    'cvLang.currentDoc': 'Langue Actuelle du Document',
    'cvLang.translateAction': 'Traduire le CV avec l’IA',
    'cvLang.translating': 'Traduction avec l’IA Exécutive...',
    'cvLang.downloadPdf': 'Télécharger / Imprimer en PDF',
    'cvLang.downloadDocx': 'Télécharger en Word (.docx)',
    'cvLang.applyToEditor': 'Charger dans l’Éditeur Principal',
    'cvLang.previewTranslated': 'Aperçu du Document Traduit',
    'cvLang.translationReady': 'Traduction réussie ! Choisissez votre format de téléchargement :',

    // Pricing / Plans
    'pricing.title': 'Formules d’Accès Stratégique',
    'pricing.subtitle': 'Débloquez les téléchargements sans filigrane, l’optimisation IA et les exports multilingues',
    'pricing.free': 'Formule Gratuite',
    'pricing.pro': 'Professionnel Pro',
    'pricing.executive': 'Exécutif VIP',
    'pricing.monthly': 'Mensuel',
    'pricing.yearly': 'Annuel (-25%)',
    'pricing.subscribeStripe': 'S’abonner par Carte',
    'pricing.payPix': 'Payer par PIX Instantané',
    'pricing.currentPlan': 'Formule Actuelle',
    'pricing.upgrade': 'Passer au niveau supérieur',

    // Generic Common
    'common.language': 'Langue',
    'common.currency': 'Devise',
    'common.cancel': 'Annuler',
    'common.close': 'Fermer',
    'common.confirm': 'Confirmer',
    'common.loading': 'Chargement...',
    'common.success': 'Succès',
    'common.error': 'Erreur'
  },
  de: {
    // Navigation & Header
    'nav.home': 'Startseite',
    'nav.editor': 'Lebenslauf-Editor',
    'nav.tools': 'KI & Karriere-Tools',
    'nav.templates': 'Vorlagen',
    'nav.pricing': 'Preise',
    'nav.myResumes': 'Meine Lebensläufe',
    'nav.admin': 'SaaS-Dashboard',
    'nav.profile': 'Mein Konto',
    'nav.signIn': 'Anmelden',
    'nav.signOut': 'Abmelden',
    'nav.downloadWord': 'Word (.docx) herunterladen',
    'nav.downloading': 'Wird exportiert...',

    // Tool Menu Items
    'tool.atsRadar': 'ATS-Radar & Stellenabgleich',
    'tool.atsRadarDesc': 'Diagnose gegen Bewerberfilter mit Übereinstimmungsbewertung',
    'tool.aiOptimizer': 'KI-Aktionsverben- & Metriken-Optimierer',
    'tool.aiOptimizerDesc': 'Google-XYZ-Formulierung für maximale Führungswirkung',
    'tool.interviewSim': 'KI-STAR-Interview-Simulator',
    'tool.interviewSimDesc': 'Verhaltensfragen und intelligente Antwortbewertung',
    'tool.coverLetter': 'Exekutives Anschreiben',
    'tool.coverLetterDesc': 'Maßgeschneidertes Motivationsschreiben für die Stelle',
    'tool.importData': 'Daten / LinkedIn importieren',
    'tool.importDataDesc': 'Lebenslauf durch Text oder LinkedIn-Link vorausfüllen',

    // Editor Sections
    'editor.title': 'Exekutiver Inhaltseditor',
    'editor.subtitle': 'Strukturieren Sie Ihren Werdegang mit messbaren Metriken und 100% ATS-Konformität',
    'editor.tab.personal': 'Persönliche Daten',
    'editor.tab.summary': 'Exekutiv-Zusammenfassung',
    'editor.tab.competencies': 'Kernkompetenzen',
    'editor.tab.experiences': 'Berufserfahrung',
    'editor.tab.educations': 'Ausbildung & Studium',
    'editor.tab.trainings': 'Zertifikate & Weiterbildung',
    'editor.tab.languages': 'Sprachen',
    'editor.tab.references': 'Referenzen',
    'editor.tab.layout': 'Layout & Stil',

    // Editor Actions & Fields
    'editor.fullName': 'Vollständiger Name',
    'editor.jobTitle': 'Angestrebter Führungstitel',
    'editor.email': 'Geschäftliche E-Mail',
    'editor.phone': 'Telefon / WhatsApp',
    'editor.location': 'Standort (Stadt, Land)',
    'editor.linkedin': 'LinkedIn-Profil',
    'editor.website': 'Website / Portfolio',
    'editor.photo': 'Professionelles Foto',
    'editor.showPhoto': 'Foto im Lebenslauf anzeigen',
    'editor.addExperience': 'Erfahrung hinzufügen',
    'editor.addEducation': 'Ausbildung hinzufügen',
    'editor.addCompetency': 'Kompetenz hinzufügen',
    'editor.addReference': 'Referenz hinzufügen',
    'editor.save': 'Änderungen speichern',
    'editor.saved': 'Gespeichert!',

    // Document View Toolbar
    'doc.zoomIn': 'Vergrößern',
    'doc.zoomOut': 'Verkleinern',
    'doc.density': 'Dichte / Abstand',
    'doc.densityCompact': 'Kompakt',
    'doc.densityNormal': 'Normal',
    'doc.densityRelaxed': 'Großzügig',
    'doc.accentColor': 'Akzentfarbe',
    'doc.photoToggle': 'Foto',
    'doc.copyText': 'Klartext kopieren',
    'doc.copied': 'Kopiert!',
    'doc.exportJson': 'JSON-Sicherung',
    'doc.pdfPrint': 'PDF / Drucken',
    'doc.pdfReqPlan': 'PDF (Abo erforderlich)',
    'doc.pdfReqAuth': 'PDF (Anmeldung erforderlich)',
    'doc.wordDocx': 'Word (.docx)',
    'doc.downloadMultilang': 'In anderen Sprachen herunterladen',
    'doc.downloadMultilangDesc': 'Exportieren Sie Ihren Lebenslauf professionell übersetzt ins Englische, Spanische oder Französische.',
    'doc.officialDocNotice': 'Offizielle Downloads erfordern ein Abonnement',
    'doc.officialDocSub': 'Aktivieren Sie einen Tarif für hochauflösende PDFs und Word-Dokumente ohne Wasserzeichen.',

    // Multi-Language CV Download Modal
    'cvLang.modalTitle': 'Lebenslauf in anderen Sprachen herunterladen',
    'cvLang.modalSubtitle': 'Vollständige Übersetzung unter Beibehaltung von Layout, Google-XYZ-Metriken und ATS-Kompatibilität.',
    'cvLang.selectLang': 'Zielsprache auswählen:',
    'cvLang.currentDoc': 'Aktuelle Dokumentensprache',
    'cvLang.translateAction': 'Lebenslauf mit KI übersetzen',
    'cvLang.translating': 'Übersetzung mit KI läuft...',
    'cvLang.downloadPdf': 'PDF herunterladen / Drucken',
    'cvLang.downloadDocx': 'Word (.docx) herunterladen',
    'cvLang.applyToEditor': 'In Haupteditor übernehmen',
    'cvLang.previewTranslated': 'Vorschau des übersetzten Dokuments',
    'cvLang.translationReady': 'Übersetzung abgeschlossen! Wählen Sie das gewünschte Download-Format:',

    // Pricing / Plans
    'pricing.title': 'Strategische Mitgliedschaften',
    'pricing.subtitle': 'Schalten Sie wasserzeichenfreie Downloads, KI-Optimierung und mehrsprachige Exporte frei',
    'pricing.free': 'Kostenloser Plan',
    'pricing.pro': 'Professional Pro',
    'pricing.executive': 'Executive VIP',
    'pricing.monthly': 'Monatlich',
    'pricing.yearly': 'Jährlich (25% Rabatt)',
    'pricing.subscribeStripe': 'Mit Kreditkarte abonnieren',
    'pricing.payPix': 'Mit Sofort-PIX bezahlen',
    'pricing.currentPlan': 'Aktueller Plan',
    'pricing.upgrade': 'Jetzt upgraden',

    // Generic Common
    'common.language': 'Sprache',
    'common.currency': 'Währung',
    'common.cancel': 'Abbrechen',
    'common.close': 'Schließen',
    'common.confirm': 'Bestätigen',
    'common.loading': 'Wird geladen...',
    'common.success': 'Erfolg',
    'common.error': 'Fehler'
  }
};

interface LanguageContextType {
  // Independent Website UI Language (6 languages: PT, EN, ES, FR, DE, IT)
  siteLanguage: SiteLanguageCode;
  setSiteLanguage: (lang: SiteLanguageCode) => void;
  currentSiteLanguage: SiteLanguageInfo;
  siteLanguages: SiteLanguageInfo[];
  siteText: SiteDictionary;
  studioText: StudioTexts;

  // Legacy CV/Letter content language helpers kept compatible for export/modals
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  currentLanguage: LanguageInfo;
  languages: LanguageInfo[];
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siteLanguage, setSiteLanguageState] = useState<SiteLanguageCode>(() => {
    try {
      const urlLang = new URLSearchParams(window.location.search).get('lang') as SiteLanguageCode;
      if (urlLang && SITE_LANGUAGES.some((l) => l.code === urlLang)) {
        return urlLang;
      }
      const saved = localStorage.getItem('site_ui_language') as SiteLanguageCode;
      if (saved && SITE_LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return 'pt';
  });

  useEffect(() => {
    try {
      document.documentElement.lang = siteLanguage;
    } catch {
      // ignore SSR/dom errors
    }
  }, [siteLanguage]);

  const setSiteLanguage = (lang: SiteLanguageCode) => {
    setSiteLanguageState(lang);
    try {
      localStorage.setItem('site_ui_language', lang);
    } catch {
      // ignore storage errors
    }
  };

  const currentSiteLanguage =
    SITE_LANGUAGES.find((l) => l.code === siteLanguage) || SITE_LANGUAGES[0];

  const siteText = SITE_DICTIONARIES[siteLanguage] || SITE_DICTIONARIES.pt;
  const studioText = STUDIO_TRANSLATIONS[siteLanguage] || STUDIO_TRANSLATIONS.pt;

  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem('app_language') as LanguageCode;
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return 'pt';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('app_language', lang);
    } catch {
      // ignore
    }
  };

  const currentLanguage =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const t = (key: string, defaultText?: string): string => {
    const uiBaseLang: LanguageCode = siteLanguage === 'it' ? 'en' : siteLanguage;
    const dict = TRANSLATIONS[uiBaseLang];
    if (dict && dict[key]) {
      return dict[key];
    }
    const enDict = TRANSLATIONS.en;
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    const ptDict = TRANSLATIONS.pt;
    if (ptDict && ptDict[key]) {
      return ptDict[key];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        siteLanguage,
        setSiteLanguage,
        currentSiteLanguage,
        siteLanguages: SITE_LANGUAGES,
        siteText,
        studioText,
        language,
        setLanguage,
        currentLanguage,
        languages: SUPPORTED_LANGUAGES,
        t
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
