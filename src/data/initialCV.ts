import { CVData } from '../types/cv';

export const AGOSTINHO_CV: CVData = {
  personalDetails: {
    name: 'AGOSTINHO DO ROSÁRIO',
    title: 'MEAL & Information Systems Specialist | Senior Data Expert',
    location: 'Luanda, Angola',
    phone: '+244 930 744 338',
    email: 'rosarioabderval@gmail.com',
    linkedin: 'linkedin.com/in/abderval',
    website: 'https://linkedin.com/in/abderval'
  },
  summary:
    'Senior MEAL & Information Systems Specialist with solid progressive experience in designing, operationalizing, and automating Monitoring, Evaluation, Accountability, and Learning (MEAL) systems, digital data pipelines, and results frameworks for complex, multi-partner programmes funded by the European Union (EU) and United Nations (WFP). Proven expertise in leading indicator tracking, data quality assurance (DQA), baseline/diagnostic reviews, and developing high-impact interactive dashboards (Power BI). Demonstrated success in harmonizing monitoring workflows across institutional consortia (Camões, I.P., UN agencies) and national public institutions (INE, MINAGRIF) in Angola, combining deep local knowledge with international Results-Based Management (RBM) standards.',
  competencies: [
    {
      id: 'comp-1',
      category: 'MEAL Frameworks & Theory of Change',
      description:
        'Logframe refinement, Output/Outcome/Context indicator development, Indicator Reference Sheets (PIRS), EU results reporting compliance.'
    },
    {
      id: 'comp-2',
      category: 'Data Quality Assurance & Surveys',
      description:
        'Baseline/Endline quality control, sampling methodology review, automated validation scripts, field audits, Post-Distribution Monitoring (PDM).'
    },
    {
      id: 'comp-3',
      category: 'Digital Data Systems & Mobile Data Collection',
      description:
        'Advanced deployment of KoboToolbox, ODK, MoDA, Survey Solutions, Enketo, and collaborative database architectures.'
    },
    {
      id: 'comp-4',
      category: 'Business Intelligence & Advanced Analytics',
      description:
        'Executive Power BI dashboard prototyping, statistical modeling (SPSS, STATA, R, Python), GIS spatial analysis (ArcGIS), Excel modeling.'
    },
    {
      id: 'comp-5',
      category: 'Consortium Coordination & Capacity Building',
      description:
        'Multi-partner reporting harmonization, technical mentoring of national MEAL officers/enumerators, drafting operational guidelines and field manuals.'
    }
  ],
  experiences: [
    {
      id: 'exp-1',
      company: 'Camões, I.P. – FRESAN Programme (Strengthening Resilience and Food and Nutrition Security in Angola)',
      role: 'Lead MEAL Software & Information Systems Consultant',
      period: '09/2023 – 11/2023',
      location: 'Huíla, Namibe, Cunene & Luanda',
      donor: "Financed by the European Union (€65M) | Co-managed by Camões, I.P., FAO, UNDP & Vall d'Hebron | Live: https://sgi-fresancamoes.com/",
      highlights: [
        "Contracted under official Terms of Reference (TdR) to architect, program, and deploy the Collaborative Digital Platform MVP (Public and Private Interfaces) for FRESAN's Results-Oriented Monitoring, Evaluation, and Learning (MEAL) Information System, successfully launched in production at https://sgi-fresancamoes.com/.",
        'Engineered multi-tier role-based access architectures: Primary (Central UIC Lubango), Secondary (FAO, UNDP, institutional partners, civil society grantees across Huíla, Namibe, and Cunene), and Tertiary (Public transparency interface).',
        'Implemented automated data validation engines with real-time alert thresholds (limiares de confirmação pré-análise) enabling the UIC MEAL unit to audit data consistency and integrity prior to official indicator computation.',
        'Aligned field data collection pipelines and multi-partner reporting with project Logframe components: I. Resilient Agriculture; II. Nutrition & Social Transfers; III. Multi-sectoral Performance; IV. Cost-Benefit Actions, under international OECD/DAC (2019) and ENISA (2022) criteria.',
        'Executed end-to-end data migration from legacy survey instruments and existing databases into the centralized collaborative repository, establishing daily automated backups and strict compliance with Camões, I.P. Information Security Policies.',
        'Authored complete system technical documentation (System Architecture, Security & Privacy Protocols, User Manuals for all tiers) and delivered intensive technical capacity building to UIC IT and MEAL teams to guarantee 100% autonomous operation.'
      ]
    },
    {
      id: 'exp-2',
      company: 'UN World Food Programme (WFP), Angola',
      role: 'Vulnerability Analysis and Mapping (VAM) & MEAL Data Specialist',
      period: '2021 – PRESENT',
      location: 'Luanda & Southern Provinces, Angola',
      donor: 'Country Office – Luanda & Southern Provinces',
      highlights: [
        'Lead data collection design, management, and analysis for large-scale food security, nutrition, and market assessments across southern Angola (Cunene, Huíla, Namibe) and crisis-affected provinces.',
        'Design, program, and pilot electronic survey instruments on KoBoToolbox, ODK, and WFP MoDA for Post-Distribution Monitoring (PDM), School Feeding, and Community-based Management of Acute Malnutrition (CMAM).',
        'Prototype and maintain interactive Power BI monitoring dashboards for strategic decision-making, tracking project reach, output/outcome indicators, and resource distribution against settled targets.',
        'Perform statistical data cleaning and compute core food security indicators (Food Consumption Score [FCS], Reduced Coping Strategy Index [rCSI], Household Hunger Scale).',
        'Analyze geographic patterns of food insecurity and vulnerability by integrating primary field survey data with GIS spatial layers in ArcGIS and relational databases.',
        'Trained and supervised over 100 field enumerators, supervisors, and provincial focal points on mobile data collection tools, ethical data standards, and quality verification protocols.',
        'Manage procurement and logistics workflow monitoring using SAP MM (PRs, POs, SES, Loans/Reallocations) ensuring data alignment with operational commitments.'
      ]
    },
    {
      id: 'exp-3',
      company: 'National Institute of Statistics (INE) - Angola',
      role: 'Data Processing Specialist & Systems Developer',
      period: '2019 – 2021',
      location: 'Luanda, Angola',
      donor: 'Central Operations – Luanda',
      highlights: [
        "Served as Application & Systems Technical Specialist for the national Census of Agriculture, Livestock and Fisheries (RAPP) using the World Bank's Survey Solutions platform (Designer, Headquarters, and Supervisor/Interviewer).",
        'Designed and enforced automated validation criteria to audit, approve, and reject field questionnaires in real-time, drastically reducing survey errors across all provinces.',
        'Configured mobile data collection infrastructure, deploying tablets, synchronization rules, and field troubleshooting systems for hundreds of census agents.',
        'Generated technical monitoring reports tracking field progress, survey velocity, non-response rates, and provincial data consistency for executive leadership.',
        "Developed INE's internal Human Resources Web System and contributed to the architecture of the official INE statistical database portal (www.ine.gov.ao)."
      ]
    }
  ],
  educations: [
    {
      id: 'edu-1',
      degree: "Master's Degree in Applied Informatics",
      institution: 'Universidad de Ciego de Ávila',
      period: '2023 – 2025'
    },
    {
      id: 'edu-2',
      degree: 'Bachelor of Science in Computer Engineering',
      institution: 'Universidad de Ciego de Ávila',
      period: '2014 – 2019',
      gpaOrHonors: 'GPA: 4.34 / 5.0'
    }
  ],
  trainings: [
    'Results-Based Monitoring, Evaluation and Learning (MEAL) Frameworks (Applied UN/EU Standards)',
    'Advanced Mobile Data Collection & Survey Architecture (Survey Solutions, ODK, KoboToolbox)',
    'Data Visualization & Executive Dashboards with Power BI and Advanced DAX',
    'Spatial Data Analysis and Thematic Mapping with ArcGIS in Humanitarian & Development Settings',
    'SAP Materials Management (SAP MM: Procurement, SES, and Operational Monitoring)'
  ],
  languages: [
    {
      language: 'Portuguese',
      level: 'Native / Mother Tongue'
    },
    {
      language: 'English',
      level: 'Professional Working Proficiency (Fluent in technical writing, reporting & meetings)'
    },
    {
      language: 'Spanish',
      level: 'Bilingual / Full Working Proficiency'
    }
  ],
  references: [
    {
      id: 'ref-1',
      name: 'António Manuel Paulo',
      institutionAndPosition: 'UN World Food Programme (WFP), Angola\nInternational VAM Consultant',
      contact: 'antonio.paulo@wfp.org\napaulo2007@hotmail.com'
    },
    {
      id: 'ref-2',
      name: 'Aliou Diouf Mballo',
      institutionAndPosition: 'Escritório da Coordenação Residente das Nações Unidas (UN RCO) – Cabo Verde\nEconomista Sénior / Especialista em Avaliação',
      contact: 'aliou.mballo@un.org\nmballoaliou2000@yahoo.fr\na.mballo@ifad.org'
    }
  ],
  templateStyle: 'un_classic'
};

export const SAMPLE_JOB_OFFERS = [
  {
    id: 'job-fresan',
    title: 'Camões, I.P. / FRESAN - TdR MVP Plataforma Digital MEAL (sgi-fresancamoes.com)',
    organization: 'Camões, I.P. – Programa FRESAN (União Europeia)',
    description: `TERMOS DE REFERÊNCIA (TdR): AQUISIÇÃO DE SERVIÇO DE DESENVOLVIMENTO DE SOFTWARE PARA O DESENVOLVIMENTO DE UM MVP (MINIMUM VIABLE PRODUCT), PRODUTO VIÁVEL MÍNIMO, E CONFIGURAÇÃO DA PLATAFORMA DIGITAL (INTERFACE PÚBLICA E PRIVADA) DO SISTEMA DE INFORMAÇÃO | MONITORIA, AVALIAÇÃO E APRENDIZAGEM ORIENTADA PARA RESULTADOS, NO ÂMBITO DO PROJETO FORTALECIMENTO DA RESILIÊNCIA E DA SEGURANÇA ALIMENTAR E NUTRICIONAL EM ANGOLA | FRESAN/CAMÕES, I.P.
Portal em produção: https://sgi-fresancamoes.com/

1. ENQUADRAMENTO:
O programa FRESAN, financiado pela União Europeia e co-gerido pelo Camões, I.P., FAO, PNUD e Vall d'Hebron, visa reduzir a fome e pobreza nas províncias do sul de Angola (Cunene, Huíla e Namibe).
A Ação apresenta 4 componentes: I. Resiliência e produção agrícola familiar; II. Melhoria da nutrição através de transferências sociais e educação; III. Reforço institucional e gestão da performance multissetorial; IV. Ações promotoras da nutrição.
O Sistema de Informação (SI) do FRESAN envolve a recolha, gestão, armazenamento, validação e visualização de dados contínuos geridos localmente pela Unidade de Implementação do Camões, I.P. (UIC) no Lubango.

2. ESPECIFICAÇÕES TÉCNICAS E PRODUTOS DO MVP:
- Desenvolver o MVP da Plataforma Digital Colaborativa com interface pública e privada.
- Automatizar o processo de recolha móvel, armazenamento, validação de regras, processamento e visualização de dados.
- Implementar mecanismos automáticos de limites/critérios de alerta para a equipa de M&A da UIC pré-análise.
- Garantir princípios e critérios de sistemas de informação e M&A: OECD (2002), OECD/DAC (2019), ENISA (2022).
- Garantir segurança, confidencialidade e backups diários orientados pela Política de Segurança da Informação do Camões, I.P.
- Migração de dados de instrumentos e bases existentes para o MVP.
- Documentação da arquitetura, manuais de utilizadores (Primários UIC, Secundários Parceiros, Terciários Público).

3. PRODUTOS CONTRATUAIS:
- Produto 1: Plano de Trabalho e Cronograma detalhado.
- Produto 2: MVP Versão Teste (aplicação web e móvel).
- Produto 3: MVP Versão Final operacional (em produção em https://sgi-fresancamoes.com/).
- Produto 4: Documentação Técnica da Plataforma (Arquitetura, Segurança, Usuários).
- Produto 5: Relatório Final de Serviço validado pela UIC.`
  },
  {
    id: 'job-1',
    title: 'Expertise France / EU - Senior MEAL & Digital Information Systems Coordinator',
    organization: 'Expertise France (European Union Delegation Project)',
    description: `Title: Senior MEAL & Information Systems Coordinator (Angola & Southern Africa)
Organization: Expertise France / EU Multi-Partner Consortium
Location: Luanda, Angola (with travel to Huíla, Namibe, Cunene)

Background & Objectives:
The project aims to reinforce food systems, climate resilience, and public policy monitoring in southern Angola. We seek an experienced MEAL & Information Systems Specialist to lead the development, harmonization, and operationalization of the project's Results-Based Management (RBM) and digital monitoring architecture.

Key Responsibilities:
- Lead the design and implementation of the project MEAL Plan, Logical Framework (Logframe), Indicator Reference Sheets (PIRS), and baseline/mid-term/endline evaluations in line with European Union and OECD/DAC standards.
- Architect and oversee the collaborative MEAL Information System, integrating automated data pipelines, quality assurance (DQA) mechanisms, and validation workflows.
- Deploy and configure electronic data collection tools using KoboToolbox, ODK, and Survey Solutions for field monitoring across provincial implementing partners.
- Design executive interactive Power BI dashboards to track Key Performance Indicators (KPIs), target achievement rates, and resource allocation for donor reporting.
- Perform quantitative and qualitative statistical data analysis (SPSS, STATA, R, Python) and spatial analysis using GIS (ArcGIS/QGIS).
- Coordinate with institutional consortium partners, national ministries (MINAGRIF, INE), and local civil society organizations.
- Supervise and build capacity of provincial MEAL officers and field enumerators through technical training, field manuals, and quality audits.

Requirements & Competencies:
- Advanced university degree (Master's preferred) in Computer Engineering, Applied Informatics, Statistics, Data Science, or related development discipline.
- Minimum 5 years of progressive experience in MEAL and data management within EU, UN (WFP, FAO, UNDP), or international development consortia.
- Proven mastery of mobile data collection (Kobo, ODK), Power BI dashboard development, relational databases, and data cleaning protocols.
- Demonstrated experience in conducting baseline surveys, Post-Distribution Monitoring (PDM), and field data quality audits.
- Full professional fluency in Portuguese and English (spoken and written). Spanish is an added advantage.`
  },
  {
    id: 'job-2',
    title: 'UN World Food Programme (WFP) - Regional VAM & M&E Officer',
    organization: 'United Nations World Food Programme',
    description: `Position: Regional Vulnerability Analysis and Mapping (VAM) & Monitoring Specialist
Organization: UN WFP
Location: Southern Africa Regional Bureau / Country Office

Key Responsibilities:
- Direct food security assessments, emergency needs assessments, and market monitoring across vulnerable provinces.
- Supervise the design and execution of electronic surveys using WFP MoDA, KoBoToolbox, and ODK.
- Compute key UN food security indicators: Food Consumption Score (FCS), Coping Strategy Index (rCSI), Household Hunger Scale (HHS).
- Integrate GIS geospatial analysis with household survey data to generate spatial vulnerability heatmaps.
- Design automated Power BI and Tableau dashboards for executive briefings and donor reporting.
- Ensure strict adherence to UN data protection and ethical survey standards.`
  },
  {
    id: 'job-3',
    title: 'International Tech / NGO - Senior Data Systems & Analytics Architect',
    organization: 'Global Development Data Initiative',
    description: `Position: Senior Data Systems & Analytics Lead
Domain: International Humanitarian Tech

Key Responsibilities:
- Architect end-to-end data pipelines for multi-country monitoring frameworks.
- Automate data validation, ETL workflows, and reporting APIs using Python and SQL.
- Build resilient field data collection infrastructure for remote teams with offline-first synchronization.
- Lead dashboard creation in Power BI / Metabase and mentor junior data specialists.
- Liaise with executive stakeholders, donors, and technical engineering teams.`
  }
];
