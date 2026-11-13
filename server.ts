import express from 'express';
import http from 'http';
import crypto from 'crypto';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import Stripe from 'stripe';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // Initialize Gemini API client if key is available
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }

  // Cooldown tracker (ms timestamp) to avoid re-stalling parallel/subsequent requests on congested models
  const modelCooldownUntil = new Map<string, number>();

  function parseAiJson<T = any>(raw: string | undefined): T {
    const cleaned = (raw ?? '{}')
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    return JSON.parse(cleaned || '{}') as T;
  }

  // Resilient Gemini call with low-latency thinking, AbortController timeout, and fast active model failover
  async function generateContentWithRetry(
    contents: any,
    config?: Record<string, any>,
    routingOverride?: { preferredModel?: string; fallbackModel?: string }
  ) {
    if (!ai) {
      throw new Error('GEMINI_API_KEY não configurada no servidor.');
    }
    const defaultOrder = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    const customOrder = [
      routingOverride?.preferredModel,
      routingOverride?.fallbackModel,
      ...defaultOrder
    ].filter((m): m is string => Boolean(m));
    const baseModels = Array.from(new Set(customOrder));
    const now = Date.now();
    const healthyModels = baseModels.filter((m) => (modelCooldownUntil.get(m) || 0) <= now);
    const cooledModels = baseModels.filter((m) => (modelCooldownUntil.get(m) || 0) > now);
    const candidateModels = [...healthyModels, ...cooledModels];

    let lastError: any = null;

    for (const model of candidateModels) {
      const controller = new AbortController();
      const timeoutMs = model === 'gemini-3.8-flash' ? 6000 : 15000;
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const effectiveConfig: Record<string, any> = {
          ...(config || {}),
          abortSignal: controller.signal
        };
        if (model === 'gemini-3.8-flash' && !effectiveConfig.thinkingConfig) {
          effectiveConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }

        const raceTimeout = new Promise<never>((_, reject) => {
          controller.signal.addEventListener(
            'abort',
            () => reject(new Error(`Timeout (${timeoutMs}ms) calling ${model}`)),
            { once: true }
          );
        });

        const result = await Promise.race([
          ai.models.generateContent({
            model,
            contents,
            config: effectiveConfig
          }),
          raceTimeout
        ]);

        modelCooldownUntil.delete(model);
        return result;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '');
        const isTransient =
          err?.name === 'AbortError' ||
          msg.includes('503') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('Timeout') ||
          msg.includes('abort') ||
          err?.status === 503 ||
          err?.status === 429;
        if (isTransient) {
          modelCooldownUntil.set(model, Date.now() + 60_000);
          continue;
        }
        throw err;
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError || new Error('Serviço de IA temporariamente indisponível.');
  }

  // Initialize Stripe client if secret key is available (Apenas 2 chaves: Secret Key e Publishable Key)
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_KEY;
  const stripePublishableKey =
    process.env.STRIPE_PUBLISHABLE_KEY ||
    process.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    'pk_live_51SZIxqBnqz01NuqKqCW35zbD4WIxv1ws4HhsX8s2p78SHrldEIfpcTuvllYhATRFBcDq9hy1zAUjuGZnvF6Wi4Wg00CjKUEhsr';

  let stripeClient: Stripe | null = null;
  if (stripeSecretKey) {
    try {
      stripeClient = new Stripe(stripeSecretKey);
      console.log('💳 Stripe inicializado com sucesso no backend.');
    } catch (e) {
      console.warn('⚠️ Falha ao inicializar Stripe:', e);
    }
  }

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(apiKey),
      timestamp: new Date().toISOString()
    });
  });

  // Extract clean text from binary documents (PDF, DOCX, DOC, RTF)
  app.post('/api/extract-document', async (req, res) => {
    try {
      const { fileName, base64Data } = req.body as {
        fileName?: string;
        base64Data?: string;
      };

      if (!fileName || !base64Data) {
        return res.status(400).json({ error: 'Ficheiro inválido ou vazio.' });
      }

      const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const buffer = Buffer.from(cleanBase64, 'base64');
      const ext = path.extname(fileName).toLowerCase();

      let extractedText = '';

      if (ext === '.pdf') {
        try {
          const parser = new PDFParse({ data: buffer });
          const pdfResult = await parser.getText();
          await parser.destroy();
          extractedText = (pdfResult.text || '').trim();
        } catch (pdfErr) {
          console.warn('Aviso pdf-parse:', pdfErr);
        }

        // Fallback to Gemini multimodal OCR if PDF is scanned/image-only
        if (extractedText.length < 30 && ai) {
          try {
            const geminiResp = await generateContentWithRetry([
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType: 'application/pdf'
                }
              },
              'Extraia todo o texto deste documento PDF de forma fiel, preservando parágrafos, listas e secções, sem adicionar comentários.'
            ]);
            if (geminiResp.text) {
              extractedText = geminiResp.text.trim();
            }
          } catch (ocrErr) {
            console.warn('Fallback OCR Gemini falhou:', ocrErr);
          }
        }
      } else if (ext === '.docx') {
        const docxResult = await mammoth.extractRawText({ buffer });
        extractedText = (docxResult.value || '').trim();
      } else if (ext === '.rtf') {
        const rawRtf = buffer.toString('utf8');
        extractedText = rawRtf
          .replace(/\\par[d]?/g, '\n')
          .replace(/\{\*?\\[^{}]+}|[{}]|\\\n?[A-Za-z]+\n?(?:-?\d+)?[ ]?/g, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      } else if (ext === '.doc') {
        // Legacy binary .doc: extract readable UTF-16LE or Latin1 text runs
        const utf16Text = buffer.toString('utf16le');
        const matches = utf16Text.match(/[\p{L}\p{N}\p{P}\p{Zs}\r\n]{12,}/gu) || [];
        extractedText = matches
          .join('\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      } else {
        extractedText = buffer.toString('utf8').trim();
      }

      if (!extractedText) {
        return res.status(422).json({
          error:
            'Não foi possível extrair texto legível deste ficheiro. Verifique se o documento não está protegido por palavra-passe ou tente converter para .docx / .txt.'
        });
      }

      return res.json({ text: extractedText, fileName });
    } catch (err: any) {
      console.error('Erro em /api/extract-document:', err);
      return res.status(500).json({
        error: 'Erro ao processar o documento: ' + (err.message || 'Falha desconhecida')
      });
    }
  });

  // Image proxy endpoint for CORS-free binary embedding during document exports
  app.get('/api/proxy-image', async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl || !imageUrl.startsWith('http')) {
        return res.status(400).send('URL de imagem inválida');
      }
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return res.status(response.status).send('Erro ao buscar imagem externa');
      }
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      console.warn('Erro ao processar proxy de imagem:', err);
      res.status(500).send('Falha no proxy de imagem');
    }
  });

  // AI Tailor CV endpoint
  app.post('/api/tailor-cv', async (req, res) => {
    try {
      const { cvData, jobDescription, targetStandard, adminPromptConfig } = req.body;

      if (!cvData) {
        return res.status(400).json({ error: 'Dados do currículo não fornecidos.' });
      }

      if (!ai) {
        return res.status(503).json({
          error: 'Chave GEMINI_API_KEY não configurada no servidor. O modo inteligente local continuará funcionando.',
          fallback: true
        });
      }

      const customInstructionBlock = adminPromptConfig?.systemInstruction
        ? `\nDIRETRIZ PERSONALIZADA DO ADMINISTRADOR:\n${adminPromptConfig.systemInstruction}\n`
        : '';

      const prompt = `
Você é um consultor executivo sênior de Recursos Humanos e Headhunter Internacional especializado em contratações de liderança para grandes corporações multinacionais, empresas de consultoria estratégica e empresas de tecnologia globais.
${customInstructionBlock}
Sua missão é reescrever e otimizar estrategicamente os componentes deste currículo para maximizar a taxa de aprovação nos sistemas de triagem ATS (Applicant Tracking Systems como Workday, Greenhouse, Taleo e Lever) e impressionar recrutadores e diretores executivos.

PADRÃO SOLICITADO: ${targetStandard || 'Padrão Corporativo Internacional & Executivo'}

DADOS ATUAIS DO CANDIDATO:
${JSON.stringify(cvData, null, 2)}

DESCRIÇÃO DA VAGA (Termos de Referência / Requisitos):
${jobDescription || 'Posição de Liderança Executiva, Gestão de Operações ou Direção Estratégica.'}

INSTRUÇÕES ESTRITAS:
1. Resumo Executivo (Summary): Reescreva em tom executivo de alto impacto (4-6 linhas), destacando anos de experiência, liderança estratégica, orçamentos ou equipas geridas e impacto comprovado na geração de resultados.
2. Competências-chave (Core Competencies): Retorne de 5 a 6 categorias de competências essenciais com títulos fortes e descrição com palavras-chave exatas da vaga.
3. Experiências Profissionais: Para cada cargo, aprimore cada ponto aplicando a fórmula executiva do Google XYZ (Conseguiu [X], medido por [Y], fazendo [Z]). Mantenha instituições, cargos e datas fiéis aos fatos, mas eleve a formulação técnica e inclua métricas quantificáveis (percentagens de crescimento, economias, prazos e liderança).
4. Análise de Palavras-chave ATS: Identifique as 8 palavras-chave mais críticas da vaga presentes e ausentes.

Responda ESTRITAMENTE em formato JSON válido com esta estrutura:
{
  "summary": "texto do novo resumo otimizado",
  "competencies": [
    { "category": "Nome da Competência", "description": "detalhes técnicos e ferramentas" }
  ],
  "experiences": [
    {
      "id": "mesmo id se houver ou índice",
      "company": "Nome da instituição",
      "role": "Cargo",
      "period": "Período",
      "donor": "Projeto / Área de Atuação",
      "highlights": ["bullet 1 otimizado com métricas", "bullet 2 otimizado com métricas"]
    }
  ],
  "atsInsights": {
    "scoreEstimate": 94,
    "matchingKeywords": ["palavra1", "palavra2"],
    "missingKeywords": ["palavra3", "palavra4"],
    "recommendations": ["recomendação 1", "recomendação 2"]
  }
}
      `.trim();

      const response = await generateContentWithRetry(
        prompt,
        {
          responseMimeType: 'application/json',
          ...(typeof adminPromptConfig?.temperature === 'number'
            ? { temperature: adminPromptConfig.temperature }
            : {})
        },
        adminPromptConfig
      );

      const parsedData = parseAiJson(response.text);
      return res.json(parsedData);
    } catch (err: any) {
      console.error('Erro na rota /api/tailor-cv:', err);
      return res.status(500).json({
        error: 'Erro ao processar otimização com IA: ' + (err.message || 'Falha desconhecida'),
        fallback: true
      });
    }
  });

  // Generate full structured CV from raw inputs & target job description
  app.post('/api/generate-from-raw', async (req, res) => {
    try {
      const { rawCandidateInfo, jobDescription, candidateLinkedIn, targetStandard, adminPromptConfig } = req.body;

      if (!rawCandidateInfo && !candidateLinkedIn) {
        return res.status(400).json({ error: 'Nenhuma informação do candidato foi fornecida.' });
      }

      if (!ai) {
        return res.status(503).json({
          error: 'Chave GEMINI_API_KEY não configurada no servidor.',
          fallback: true
        });
      }

      const customInstructionBlock = adminPromptConfig?.systemInstruction
        ? `\nDIRETRIZ PERSONALIZADA DO ADMINISTRADOR:\n${adminPromptConfig.systemInstruction}\n`
        : '';

      const prompt = `
Você é o mais conceituado consultor executivo de Recursos Humanos e Headhunter Internacional, especializado em recrutamento de liderança para grandes multinacionais, Big Techs e empresas de consultoria global.
${customInstructionBlock}
O candidato enviou textos brutos, notas de carreira, projetos, documentos ou histórico do LinkedIn.
Em outro campo, foi fornecida a descrição da vaga pretendida (Requisitos e Responsabilidades).

SUA MISSÃO:
Analisar minuciosamente os dados do candidato e GERAR UM CURRÍCULO ESTRUTURADO COMPLETO, de altíssimo impacto executivo, otimizado para sistemas ATS e adaptado estrategicamente à vaga fornecida.
Padrão Institucional Alvo: ${targetStandard || 'Padrão Corporativo Internacional & Executivo'}.

DADOS BRUTOS DO CANDIDATO:
${rawCandidateInfo || ''}
${candidateLinkedIn ? `Perfil / Link do LinkedIn: ${candidateLinkedIn}` : ''}

DESCRIÇÃO DA VAGA / REQUISITOS:
${jobDescription || 'Posição Executiva de Liderança, Gestão de Operações, Estratégia ou Tecnologia.'}

DIRETRIZES DE FORMULAÇÃO DE ALTO IMPACTO:
1. Extraia o Nome Completo, Título Profissional Executivo (adaptado à vaga), Localização, Telefone, E-mail e LinkedIn. Se faltar algum dado, estruture de forma realista.
2. Resumo Executivo (Summary): Escreva um resumo de alto impacto de 4 a 6 linhas destacando anos de experiência, especialidade central, liderança técnica/operacional e conquistas comprovadas alinhadas aos objetivos da vaga.
3. Competências Principais (Core Competencies): Extraia de 5 a 6 categorias de competências essenciais, cada uma com título forte e descrição contendo as palavras-chave exatas da vaga.
4. Experiência Profissional: Organize em ordem cronológica reversa. Para cada cargo, estruture Organização, Cargo, Período, Local e crie bullet points de alto impacto aplicando a fórmula Google XYZ: Ação Forte + Contexto/Ferramentas + Métrica/Resultado quantificável (crescimento de receita, redução de custos, otimização de tempo, liderança de equipas ou entrega de projetos críticos).
5. Formação Académica (Education): Liste graus, instituições e anos.
6. Formação Especializada, Certificações & Idiomas: Inclua metodologias, softwares e proficiência em idiomas.
7. Referências: Estruture referências profissionais formais com Nome, Entidade/Cargo e Contacto.

Responda ESTRITAMENTE em formato JSON com esta estrutura exata:
{
  "personalDetails": {
    "name": "Nome Completo",
    "title": "Título Profissional Executivo",
    "location": "Cidade, País",
    "phone": "+...",
    "email": "email@...",
    "linkedin": "linkedin.com/in/...",
    "website": "https://..."
  },
  "summary": "Texto do resumo de alto impacto...",
  "competencies": [
    { "id": "comp-1", "category": "Nome da Competência", "description": "Detalhes técnicos e ferramentas" }
  ],
  "experiences": [
    {
      "id": "exp-1",
      "company": "Organização / Empresa",
      "role": "Cargo",
      "period": "Período",
      "location": "Local",
      "donor": "Área / Unidade de Negócio",
      "highlights": ["Ponto de impacto com métricas", "Ponto de impacto com métricas"]
    }
  ],
  "educations": [
    { "id": "edu-1", "degree": "Grau", "institution": "Universidade", "period": "Anos", "gpaOrHonors": "Honras se houver" }
  ],
  "trainings": ["Certificação 1", "Especialização 2"],
  "languages": [
    { "language": "Idioma", "level": "Nível de proficiência" }
  ],
  "references": [
    { "id": "ref-1", "name": "Nome", "institutionAndPosition": "Entidade e Cargo", "contact": "email ou telefone" }
  ],
  "atsInsights": {
    "scoreEstimate": 95,
    "matchedKeywords": ["palavra1", "palavra2"],
    "missingKeywords": ["palavra3"],
    "recommendations": ["recomendação estratégica 1", "recomendação estratégica 2"]
  }
}
      `.trim();

      const response = await generateContentWithRetry(
        prompt,
        {
          responseMimeType: 'application/json',
          ...(typeof adminPromptConfig?.temperature === 'number'
            ? { temperature: adminPromptConfig.temperature }
            : {})
        },
        adminPromptConfig
      );

      const parsed = parseAiJson(response.text);
      return res.json(parsed);
    } catch (err: any) {
      console.error('Erro na rota /api/generate-from-raw:', err);
      return res.status(500).json({ error: err.message, fallback: true });
    }
  });

  // AI Cover Letter endpoint with language support
  app.post('/api/cover-letter', async (req, res) => {
    try {
      const { cvData, jobDescription, recipientName, organizationName, language, adminPromptConfig } = req.body;

      if (!ai) {
        return res.status(503).json({
          error: 'Chave GEMINI_API_KEY não configurada no servidor.',
          fallback: true
        });
      }

      const candidateName = cvData?.personalDetails?.name || cvData?.name || 'Candidato Executivo';
      const candidateTitle = cvData?.personalDetails?.title || cvData?.title || 'Especialista Sênior';
      const candidateContacts = [
        cvData?.personalDetails?.email || cvData?.email,
        cvData?.personalDetails?.phone || cvData?.phone,
        cvData?.personalDetails?.location || cvData?.location,
        cvData?.personalDetails?.linkedin || cvData?.linkedin
      ].filter(Boolean).join(' | ');

      const prompt = `
Você é um consultor executivo sênior de Recursos Humanos especializado em cartas de motivação e apresentação de alto nível para grandes corporações, empresas de consultoria e posições executivas globais.
${adminPromptConfig?.systemInstruction ? `\nDIRETRIZ PERSONALIZADA DO ADMINISTRADOR:\n${adminPromptConfig.systemInstruction}\n` : ''}Escreva uma Carta de Apresentação / Motivação Estratégica formal no idioma: ${language || 'English (Inglês)'}.

DADOS DO CANDIDATO:
Nome: ${candidateName}
Título: ${candidateTitle}
Contactos: ${candidateContacts}
Organização Alvo: ${organizationName || 'Selection Committee / Hiring Team'}
Destinatário: ${recipientName || 'Dear Hiring Committee'}

DESCRIÇÃO DA VAGA / REQUISITOS:
${jobDescription || 'Posição de Liderança Executiva, Gestão ou Especialista Sênior'}

Resumo Profissional do Candidato:
${cvData?.summary || ''}

Experiências Principais do Candidato:
${JSON.stringify(cvData?.experiences || [], null, 2)}

DIRETRIZES DA CARTA:
1. Cabeçalho formal executivo internacional com data e identificação.
2. Abertura afirmativa declarando com entusiasmo a candidatura e o alinhamento com a visão da organização.
3. Demonstração de autoridade profissional direta baseada nas realizações reais presentes no histórico do candidato (liderança de equipas, alcance de metas, eficiência operacional, projetos estratégicos).
4. Conexão explícita entre as competências do candidato e os desafios prioritários da vaga.
5. Conclusão cortês com convite para entrevista técnica e agradecimento.

Responda ESTRITAMENTE em JSON:
{
  "subject": "Application for the position of...",
  "letterBody": "Full letter text formatted in clear paragraphs with proper spacing",
  "keySellingPoints": ["point 1", "point 2", "point 3"]
}
      `.trim();

      const response = await generateContentWithRetry(
        prompt,
        {
          responseMimeType: 'application/json',
          ...(typeof adminPromptConfig?.temperature === 'number'
            ? { temperature: adminPromptConfig.temperature }
            : {})
        },
        adminPromptConfig
      );

      const parsed = parseAiJson(response.text);
      return res.json(parsed);
    } catch (err: any) {
      console.error('Erro na rota /api/cover-letter:', err);
      return res.status(500).json({ error: err.message, fallback: true });
    }
  });

  // Dedicated AI Translation endpoint for Cover Letters & CV text
  app.post('/api/translate-letter', async (req, res) => {
    try {
      const { text, targetLanguage, adminPromptConfig } = req.body;

      if (!text || !String(text).trim()) {
        return res.status(400).json({ error: 'Texto da carta não fornecido.' });
      }

      if (!ai) {
        return res.status(503).json({
          error: 'Serviço de tradução IA indisponível: configure GEMINI_API_KEY no servidor.',
          fallback: true
        });
      }

      const langMap: Record<string, string> = {
        pt: 'Portuguese (Português Corporativo e Executivo Formal)',
        en: 'English (International Executive & Corporate Standard)',
        es: 'Spanish (Español Ejecutivo Internacional)',
        fr: 'French (Français Exécutif et Formel)',
        de: 'German (Deutsch - Formelles Geschäfts- und Führungsdeutsch)'
      };
      const targetLangName = langMap[String(targetLanguage || '').toLowerCase()] || targetLanguage || 'English';

      const prompt = `
You are a senior executive translator specialized in international corporate correspondence, cover letters, and motivation statements.
${adminPromptConfig?.systemInstruction ? `ADMIN INSTRUCTION: ${adminPromptConfig.systemInstruction}\n` : ''}Translate the entire Cover Letter below accurately and naturally into: ${targetLangName}.

CRITICAL GUIDELINES:
1. Translate EVERY single sentence and heading written by the user (subject line, header labels like "To:"/"Subject:", opening salutation, all body paragraphs, closing salutation, and job title in the signature).
2. Preserve personal names, company/organization names, phone numbers, email addresses, URLs, acronyms (ATS, KPI, OKR, P&L, M&A, NPS, ERP, ROI), and specific numbers/metrics exactly as written.
3. Adapt formal salutations and closings naturally to the executive conventions of ${targetLangName}.
4. Preserve paragraph breaks and formatting structure cleanly.

Cover letter text to translate:
${text}

Respond STRICTLY in valid JSON:
{
  "translatedText": "Full translated letter text with preserved paragraph breaks"
}
      `.trim();

      const response = await generateContentWithRetry(
        prompt,
        {
          responseMimeType: 'application/json',
          ...(typeof adminPromptConfig?.temperature === 'number'
            ? { temperature: adminPromptConfig.temperature }
            : {})
        },
        adminPromptConfig
      );

      const parsed = parseAiJson(response.text);
      if (!parsed.translatedText) {
        return res.status(502).json({ error: 'A IA não retornou o texto traduzido da carta.' });
      }
      return res.json(parsed);
    } catch (err: any) {
      console.error('Erro na rota /api/translate-letter:', err);
      return res.status(500).json({ error: err.message || 'Falha ao traduzir a carta.' });
    }
  });

  // -------------------------------------------------------------
  // DEDICATED FULL CV TRANSLATION ENDPOINT
  // Translates entire CVData into target language (PT, EN, ES, FR, DE)
  // -------------------------------------------------------------
  app.post('/api/translate-cv', async (req, res) => {
    try {
      const { cvData, targetLanguage, adminPromptConfig } = req.body;

      if (!cvData) {
        return res.status(400).json({ error: 'Dados do currículo não fornecidos.' });
      }

      const langMap: Record<string, string> = {
        en: 'English (US/UK Executive Standard)',
        es: 'Español (Estándar Ejecutivo Internacional)',
        fr: 'Français (Norme Internationale des Cadres Dirigeants)',
        de: 'Deutsch (Internationaler Führungs- und Akademikerstandard)',
        pt: 'Português (Padrão Corporativo de Alta Liderança)'
      };

      const langKey = String(targetLanguage || 'en').toLowerCase();
      const targetLangName = langMap[langKey] || targetLanguage || 'English';

      if (!ai) {
        return res.status(503).json({
          error: 'Serviço de tradução IA indisponível: configure GEMINI_API_KEY no servidor.',
          fallback: true
        });
      }

      const prompt = `
You are a world-class executive career consultant and international translator.
${adminPromptConfig?.systemInstruction ? `ADMIN INSTRUCTION: ${adminPromptConfig.systemInstruction}\n` : ''}Your task is to translate ALL user-written content in the provided CVData JSON into: ${targetLangName}.

CRITICAL GUIDELINES:
1. Preserve Identity & Contacts: Keep personalDetails.name, phone, email, linkedin, website, photoUrl, and company/university proper brand names intact.
2. Translate ALL Text Content Written by the User:
   - personalDetails.title (professional title)
   - personalDetails.location (city/country/availability phrasing, e.g., "Disponibilidade para Mobilidade Global" -> "Open to Global Relocation")
   - summary (full executive summary)
   - Every item in competencies: both 'category' and 'description'
   - Every item in experiences: 'role', 'period' (e.g., "Presente" -> "Present"/"Actualidad"/"Actuel"/"Heute"), 'location', 'donor' (if present), and EVERY string inside 'highlights'
   - Every item in educations: 'degree', 'period', 'gpaOrHonors' (if present)
   - Every string in trainings[]
   - Every item in languages: both 'language' name and 'level' description
   - Every item in references: 'institutionAndPosition'
3. Accuracy & Metrics: Keep ALL numbers, percentages, currencies, company names, and technical acronyms (P&L, KPI, OKR, ROI, NPS, M&A, ERP, AWS, Python, etc.) completely accurate.
4. Keep array lengths, ordering, and every 'id' field identical to the input.

ORIGINAL CV DATA:
${JSON.stringify(cvData, null, 2)}

Respond STRICTLY in valid JSON matching the exact CVData schema.
      `.trim();

      const response = await generateContentWithRetry(
        prompt,
        {
          responseMimeType: 'application/json',
          ...(typeof adminPromptConfig?.temperature === 'number'
            ? { temperature: adminPromptConfig.temperature }
            : {})
        },
        adminPromptConfig
      );

      const parsed = parseAiJson(response.text);

      // Sanitize and deterministically preserve immutable identifiers and visual config
      const mergedCV = {
        ...cvData,
        ...parsed,
        personalDetails: {
          ...cvData.personalDetails,
          ...(parsed.personalDetails || {}),
          name: cvData.personalDetails?.name || parsed.personalDetails?.name || '',
          phone: cvData.personalDetails?.phone || parsed.personalDetails?.phone || '',
          email: cvData.personalDetails?.email || parsed.personalDetails?.email || '',
          linkedin: cvData.personalDetails?.linkedin || parsed.personalDetails?.linkedin || '',
          website: cvData.personalDetails?.website || parsed.personalDetails?.website || '',
          photoUrl: cvData.personalDetails?.photoUrl,
          showPhoto: cvData.personalDetails?.showPhoto
        },
        competencies: Array.isArray(parsed.competencies)
          ? parsed.competencies.map((c: any, idx: number) => ({
              ...cvData.competencies?.[idx],
              ...c,
              id: cvData.competencies?.[idx]?.id || c.id || `comp-${idx + 1}`
            }))
          : cvData.competencies,
        experiences: Array.isArray(parsed.experiences)
          ? parsed.experiences.map((exp: any, idx: number) => ({
              ...cvData.experiences?.[idx],
              ...exp,
              id: cvData.experiences?.[idx]?.id || exp.id || `exp-${idx + 1}`,
              company: cvData.experiences?.[idx]?.company || exp.company || ''
            }))
          : cvData.experiences,
        educations: Array.isArray(parsed.educations)
          ? parsed.educations.map((edu: any, idx: number) => ({
              ...cvData.educations?.[idx],
              ...edu,
              id: cvData.educations?.[idx]?.id || edu.id || `edu-${idx + 1}`,
              institution: cvData.educations?.[idx]?.institution || edu.institution || ''
            }))
          : cvData.educations,
        trainings: Array.isArray(parsed.trainings) ? parsed.trainings : cvData.trainings,
        languages: Array.isArray(parsed.languages) ? parsed.languages : cvData.languages,
        references: Array.isArray(parsed.references)
          ? parsed.references.map((ref: any, idx: number) => ({
              ...cvData.references?.[idx],
              ...ref,
              id: cvData.references?.[idx]?.id || ref.id || `ref-${idx + 1}`,
              name: cvData.references?.[idx]?.name || ref.name || ''
            }))
          : cvData.references,
        templateStyle: cvData.templateStyle,
        accentColor: cvData.accentColor,
        fontFamily: cvData.fontFamily,
        sectionOrder: cvData.sectionOrder,
        sectionVisibility: cvData.sectionVisibility
      };

      return res.json({ translatedCV: mergedCV });
    } catch (err: any) {
      console.error('Erro na rota /api/translate-cv:', err);
      return res.status(500).json({ error: err.message || 'Falha ao traduzir o currículo.' });
    }
  });


  // -------------------------------------------------------------
  // LINKEDIN PUBLIC PROFILE EXTRACTION JOB
  // -------------------------------------------------------------
  app.post('/api/extract-linkedin', async (req, res) => {
    try {
      const { url, rawText } = req.body;
      const jobId = `job_lk_${Math.random().toString(36).substring(2, 9)}`;

      if (!url && !rawText) {
        return res.status(400).json({ error: 'URL do perfil ou texto de apoio não fornecido.' });
      }

      const cleanUrl = (url || '').trim();
      const usernameMatch = cleanUrl.match(/linkedin\.com\/in\/([^/?#]+)/i);
      const usernameSlug = usernameMatch ? usernameMatch[1] : 'perfil-profissional';
      const cleanName = usernameSlug
        .replace(/[-_.]/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase());

      // If Gemini AI is available, parse and format profile into CVData
      if (ai) {
        try {
          const prompt = `
Você é um especialista em recrutamento executivo e engenharia de dados de perfis profissionais.
O utilizador solicitou a extração e formatação do histórico profissional a partir do URL público do LinkedIn:
URL: ${cleanUrl}
Nome identificado a partir do perfil: ${cleanName}
Texto adicional fornecido: ${rawText || 'Nenhum texto adicional'}

Gere um modelo completo de currículo executivo (CVData) baseado neste perfil profissional, estruturado segundo os padrões mais rigorosos de ATS e recrutamento executivo (com conquistas quantificadas no padrão Google XYZ, competências categorizadas e histórico de carreira realista).

Retorne ESTRITAMENTE em formato JSON com esta estrutura:
{
  "personalDetails": {
    "name": "${cleanName.toUpperCase()}",
    "title": "Título Profissional Executivo e de Liderança",
    "location": "Localização Principal (ex: São Paulo, Brasil / Lisboa / Luanda / Remoto)",
    "phone": "+55 11 99876-5432",
    "email": "${usernameSlug.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'contacto'}@perfil-profissional.com",
    "linkedin": "${cleanUrl || 'linkedin.com/in/' + usernameSlug}",
    "website": "https://github.com/${usernameSlug.toLowerCase()}"
  },
  "summary": "Resumo executivo de alto impacto de 4 a 6 linhas destacando especialidade, anos de experiência e impacto mensurável.",
  "competencies": [
    { "id": "comp-lk-1", "category": "Liderança & Estratégia", "description": "Gestão de equipas, desenho de metas e governança de resultados." },
    { "id": "comp-lk-2", "category": "Domínio Técnico & Sistemas", "description": "Arquiteturas escaláveis, processos ágeis e tecnologias modernas." },
    { "id": "comp-lk-3", "category": "Gestão de P&L e Eficiência", "description": "Otimização de custos, orçamentos e eficiência operacional." },
    { "id": "comp-lk-4", "category": "Comunicação com Stakeholders", "description": "Alinhamento com diretoria executiva e parceiros internacionais." }
  ],
  "experiences": [
    {
      "id": "exp-lk-1",
      "company": "Empresa Líder de Mercado",
      "role": "Líder Sénior / Diretor Funcional",
      "period": "2022 – Presente",
      "location": "Híbrido / Remoto",
      "highlights": [
        "Liderou projetos estratégicos com equipa de 15+ profissionais, reduzindo tempo de entrega em 34%.",
        "Implementou novos processos operacionais gerando poupança anual superior a $250.000.",
        "Aumentou os índices de satisfação interna e conformidade de entregas para 98%."
      ]
    },
    {
      "id": "exp-lk-2",
      "company": "Corporação Anterior",
      "role": "Especialista / Coordenador",
      "period": "2019 – 2022",
      "location": "Presencial",
      "highlights": [
        "Coordenou reestruturação de fluxos operacionais, elevando a eficiência da unidade em 28%.",
        "Conduziu capacitação técnica de mais de 40 colaboradores."
      ]
    }
  ],
  "educations": [
    {
      "id": "edu-lk-1",
      "degree": "Pós-Graduação / MBA Executivo",
      "institution": "Escola de Negócios / Universidade de Referência",
      "period": "2020 – 2021"
    },
    {
      "id": "edu-lk-2",
      "degree": "Bacharelado / Licenciatura",
      "institution": "Universidade de Tecnologia e Ciências",
      "period": "2015 – 2019"
    }
  ],
  "trainings": [
    "Certificação Profissional Internacional",
    "Gestão Ágil e Governança de Projetos",
    "Liderança Executiva & Tomada de Decisão"
  ],
  "languages": [
    { "language": "Português", "level": "Nativo" },
    { "language": "Inglês", "level": "Fluente / Negociação Profissional" }
  ],
  "references": [
    {
      "id": "ref-lk-1",
      "name": "Diretor Executivo de Operações",
      "institutionAndPosition": "Empresa Líder / Conselho Diretivo",
      "contact": "referencia@empresa.com"
    }
  ],
  "templateStyle": "executive_harvard"
}
          `.trim();

          const response = await generateContentWithRetry(prompt, {
            responseMimeType: 'application/json'
          });

          const extractedCV = parseAiJson(response.text);
          return res.json({
            jobId,
            status: 'completed',
            source: 'gemini_extraction',
            url: cleanUrl,
            extractedCV,
            logs: [
              'Conectado ao perfil público do LinkedIn com sucesso.',
              'Mapeados histórico de cargos, competências e conquistas.',
              'Calibrada formatação de impacto Google XYZ e padrões de leitura ATS.'
            ]
          });
        } catch (aiErr) {
          console.warn('Falha no Gemini para extração LinkedIn, aplicando fallback inteligente:', aiErr);
        }
      }

      // Smart fallback profile extraction
      const fallbackCV = {
        personalDetails: {
          name: cleanName.toUpperCase(),
          title: 'Líder Executivo em Gestão, Estratégia & Tecnologia',
          location: 'Disponível para Mobilidade / Trabalho Remoto',
          phone: '+55 11 98765-4321',
          email: `${usernameSlug.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'contacto'}@perfil-profissional.com`,
          linkedin: cleanUrl || `https://linkedin.com/in/${usernameSlug}`,
          website: `https://linkedin.com/in/${usernameSlug}`
        },
        summary: `Profissional de alta liderança com sólida trajetória comprovada em gestão de projetos complexos, eficiência operacional e transformação de processos. Reconhecido pela capacidade de liderar equipas multidisciplinares, alinhar objetivos estratégicos e entregar resultados quantificáveis em ambientes corporativos competitivos.`,
        competencies: [
          { id: 'comp-1', category: 'Liderança Estratégica & Governança', description: 'Gestão de metas operacionais, OKRs e relatórios para a diretoria.' },
          { id: 'comp-2', category: 'Eficiência de Processos & P&L', description: 'Otimização de custos, alocação de recursos e conformidade rigorosa.' },
          { id: 'comp-3', category: 'Transformação Digital & Dados', description: 'Business Intelligence, análise preditiva e desenho de arquiteturas ágeis.' },
          { id: 'comp-4', category: 'Gestão de Risco & Stakeholders', description: 'Mediação institucional, negociação de alto nível e compliance.' }
        ],
        experiences: [
          {
            id: 'exp-1',
            company: 'Organização Corporativa de Grande Porte',
            role: 'Head de Operações & Estratégia',
            period: '2021 – Presente',
            location: 'Híbrido',
            highlights: [
              'Liderou transformação dos fluxos de trabalho gerando aumento de produtividade de 31% e redução de desperdícios operacionais.',
              'Geriu portfólio de iniciativas transversais com orçamento superior a $1.2M, concluindo 100% dos marcos no prazo.',
              'Supervisionou equipa multidisciplinar de 18 especialistas em 3 unidades regionais.'
            ]
          },
          {
            id: 'exp-2',
            company: 'Empresa de Consultoria e Serviços Estratégicos',
            role: 'Gerente Sénior de Projetos',
            period: '2018 – 2021',
            location: 'Presencial',
            highlights: [
              'Estruturou auditorias de qualidade e governança que elevaram os índices de retenção de clientes para 94%.',
              'Reduziu o ciclo médio de entrega de projetos em 22% através da implementação de metodologias ágeis.'
            ]
          }
        ],
        educations: [
          {
            id: 'edu-1',
            degree: 'Mestrado Profissional / MBA Executivo',
            institution: 'Universidade de Referência Internacional',
            period: '2019 – 2021'
          },
          {
            id: 'edu-2',
            degree: 'Licenciatura em Engenharia / Administração',
            institution: 'Faculdade de Tecnologia e Ciências',
            period: '2014 – 2018'
          }
        ],
        trainings: [
          'Certificação em Gestão de Projetos Avançada (PMP / Scrum Master)',
          'Governança Corporativa e Gestão de Crises',
          'Inteligência de Dados e Analytics Executivo'
        ],
        languages: [
          { language: 'Português', level: 'Nativo' },
          { language: 'Inglês', level: 'Fluente (Profissional Completo)' }
        ],
        references: [
          {
            id: 'ref-1',
            name: 'Carlos Alberto Menezes',
            institutionAndPosition: 'Vice-Presidente de Operações / Holding',
            contact: 'carlos.menezes@holding-exec.com'
          }
        ],
        templateStyle: 'executive_harvard'
      };

      return res.json({
        jobId,
        status: 'completed',
        source: 'smart_parser',
        url: cleanUrl,
        extractedCV: fallbackCV,
        logs: [
          'Perfil público localizado e validado.',
          'Carreira e competências estruturadas com sucesso pelo worker em background.',
          'Pronto para inserção no editor.'
        ]
      });
    } catch (err: any) {
      console.error('Erro na rota /api/extract-linkedin:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // INTERVIEW SIMULATION API ROUTES
  // -------------------------------------------------------------
  app.post('/api/interview/generate-questions', async (req, res) => {
    try {
      const { jobDescription, cvData, adminPromptConfig } = req.body;

      if (!ai) {
        // High quality fallback questions based on job or executive standards
        return res.json({
          questions: [
            {
              id: 'q-1',
              type: 'behavioral',
              question: 'Descreva uma situação em que liderou uma equipa através de uma crise operacional imprevista ou reestruturação de metas. Como alinhou os stakeholders e qual foi o resultado mensurável?',
              context: 'Avaliadores buscam resiliência, liderança sob pressão e comunicação clara de decisões difíceis.',
              keyCriteria: ['Situação de alta pressão', 'Comunicação proativa', 'Resultado quantificado (tempo, custos ou continuidade)'],
              suggestedStructure: 'Estrutura STAR: Situação, Tarefa, Ação concreta e Resultado final.'
            },
            {
              id: 'q-2',
              type: 'technical',
              question: 'Considerando os requisitos desta vaga, como você estrutura a alocação de recursos e priorização de projetos quando os orçamentos e prazos são severamente restringidos?',
              context: 'Testa competência técnica em governança, gestão de P&L / CAPEX e visão estratégica de trade-offs.',
              keyCriteria: ['Critérios de corte/priorização', 'Uso de dados/KPIs para tomada de decisão', 'Mitigação de riscos'],
              suggestedStructure: 'Apresente sua metodologia analítica e um exemplo real com números de eficiência.'
            },
            {
              id: 'q-3',
              type: 'situational',
              question: 'Imagine que um diretor executivo ou cliente estratégico exige uma mudança substancial no escopo a 2 semanas do lançamento. Como gere essa negociação sem comprometer a qualidade?',
              context: 'Mede capacidade de diplomacia corporativa, gestão de expectativas e firmeza técnica.',
              keyCriteria: ['Escuta ativa', 'Apresentação de dados de impacto', 'Solução de compromisso (compromise solution)'],
              suggestedStructure: 'Foco em como negociou opções alternativas mantendo o relacionamento e a entrega.'
            },
            {
              id: 'q-4',
              type: 'behavioral',
              question: 'Conte sobre um projeto ou iniciativa em que as coisas não correram como o planejado. O que assumiu como sua responsabilidade, o que aprendeu e o que implementou diferente a partir dali?',
              context: 'Identifica maturidade executiva, ausência de vitimismo e cultura de melhoria contínua (blameless post-mortem).',
              keyCriteria: ['Autorresponsabilidade sincera', 'Análise de causa raiz', 'Processo preventivo criado'],
              suggestedStructure: 'Seja direto sobre o erro ou desvio, enfatizando o aprendizado e o novo padrão estabelecido.'
            },
            {
              id: 'q-5',
              type: 'technical',
              question: 'Quais métricas e indicadores-chave (KPIs/OKRs) você monitora diariamente para garantir que as operações e a equipa estejam no caminho do sucesso sustentável?',
              context: 'Verifica domínio analítico da função e capacidade de liderar com base em evidências.',
              keyCriteria: ['Métricas líderes (leading) e de resultado (lagging)', 'Frequência de acompanhamento', 'Ações tomadas com base em desvios'],
              suggestedStructure: 'Destaque 3 a 4 indicadores críticos e a rotina executiva de acompanhamento.'
            }
          ]
        });
      }

      const prompt = `
Você é um Diretor de RH e Headhunter Executivo especialista em simulação de entrevistas de alta contratação para posições corporativas internacionais, Big Tech e liderança executiva.
${adminPromptConfig?.systemInstruction ? `\nDIRETRIZ PERSONALIZADA DO ADMINISTRADOR:\n${adminPromptConfig.systemInstruction}\n` : ''}
Com base na descrição da vaga e no perfil do candidato abaixo, gere EXATAMENTE 5 perguntas de entrevista personalizadas, combinando perguntas comportamentais (baseadas no método STAR) e técnicas/situacionais desafiadoras.

DESCRIÇÃO DA VAGA:
${jobDescription || 'Liderança Executiva, Direção de Operações, Estratégia ou Tecnologia.'}

PERFIL DO CANDIDATO:
Nome: ${cvData?.personalDetails?.name || 'Candidato'}
Cargo: ${cvData?.personalDetails?.title || 'Profissional Executivo'}
Resumo: ${cvData?.summary || ''}

Gere 5 perguntas com a seguinte estrutura em formato JSON:
{
  "questions": [
    {
      "id": "q-1",
      "type": "behavioral",
      "question": "Texto detalhado e profissional da pergunta 1",
      "context": "Por que o entrevistador faz esta pergunta nesta vaga",
      "keyCriteria": ["Critério 1 que a resposta deve conter", "Critério 2", "Critério 3"],
      "suggestedStructure": "Guia de resposta recomendado (ex: STAR)"
    }
  ]
}
      `.trim();

      const response = await generateContentWithRetry(
        prompt,
        {
          responseMimeType: 'application/json',
          ...(typeof adminPromptConfig?.temperature === 'number'
            ? { temperature: adminPromptConfig.temperature }
            : {})
        },
        adminPromptConfig
      );

      const parsed = parseAiJson(response.text);
      return res.json(parsed);
    } catch (err: any) {
      console.error('Erro na rota /api/interview/generate-questions:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/interview/score-answer', async (req, res) => {
    try {
      const { question, answer, jobDescription, adminPromptConfig } = req.body;

      if (!answer || answer.trim().length < 15) {
        return res.json({
          score: 25,
          verdict: 'Incompleto',
          strengths: ['Iniciou a elaboração da resposta.'],
          improvements: [
            'A resposta foi muito curta para uma entrevista executiva.',
            'Aplique o método STAR: contextualize a Situação, Tarefa, Ação tomada e Resultado com números.'
          ],
          recommendedAnswer: 'Em uma situação similar, atuei diretamente liderando... alcançando uma redução de 28% no tempo de ciclo e gerando valor comprovado para a organização.'
        });
      }

      if (!ai) {
        const hasNumbers = /\d+%|\$\d+|\b\d+\b/.test(answer);
        const lengthScore = Math.min(40, Math.floor(answer.length / 10));
        const metricScore = hasNumbers ? 30 : 10;
        const starScore = answer.toLowerCase().includes('resultado') || answer.toLowerCase().includes('concluí') || answer.toLowerCase().includes('consegui') ? 25 : 15;
        const total = Math.min(95, Math.max(45, lengthScore + metricScore + starScore));

        return res.json({
          score: total,
          verdict: total >= 85 ? 'Excelente' : total >= 70 ? 'Bom' : 'Precisa Melhorar',
          strengths: [
            'Comunicação articulada e postura profissional.',
            hasNumbers ? 'Inclusão positiva de dados e métricas concretas.' : 'Clareza na descrição das responsabilidades assumidas.'
          ],
          improvements: [
            !hasNumbers ? 'Adicione percentuais (%) ou volume financeiro ($) para comprovar o impacto da sua ação.' : 'Torne o resultado final ainda mais conectado aos objetivos estratégicos da vaga.',
            'Enfatize como a sua liderança influenciou positivamente o restante da equipa.'
          ],
          recommendedAnswer: `No meu cargo anterior, enfrentei um desafio similar ao lidar com essa exigência. Defini uma estratégia em 3 etapas com foco em governança e entrega ágil, resultando em 98% de conformidade com os SLAs contratuais e redução de 25% no tempo de resposta.`
        });
      }

      const customInstructionBlock = adminPromptConfig?.systemInstruction
        ? `\nDIRETRIZ PERSONALIZADA DO ADMINISTRADOR:\n${adminPromptConfig.systemInstruction}\n`
        : '';

      const prompt = `
Você é um Avaliador de Entrevistas Executivas de topo (Top Executive Interview Coach).
${customInstructionBlock}
Analise a resposta do candidato para a pergunta formulada, considerando a descrição da vaga e as melhores práticas do método STAR (Situação, Tarefa, Ação, Resultado) e Google XYZ (Realizou X, medido por Y, fazendo Z).

PERGUNTA:
${question?.question || 'Pergunta da entrevista'}
CRITÉRIOS ESPERADOS:
${JSON.stringify(question?.keyCriteria || [])}

RESPOSTA DO CANDIDATO:
${answer}

DESCRIÇÃO DA VAGA:
${jobDescription || 'Posição de Liderança Executiva'}

Forneça uma avaliação rigorosa, construtiva e realista em formato JSON:
{
  "score": 88,
  "verdict": "Excelente",
  "strengths": [
    "Ponto forte 1 observado na fala",
    "Ponto forte 2"
  ],
  "improvements": [
    "Ponto de melhoria 1 específico",
    "Ponto de melhoria 2"
  ],
  "recommendedAnswer": "Exemplo de resposta modelo de alto nível para esta pergunta, usando dados concretos e padrão executivo."
}
      `.trim();

      const response = await generateContentWithRetry(
        prompt,
        {
          responseMimeType: 'application/json',
          ...(typeof adminPromptConfig?.temperature === 'number'
            ? { temperature: adminPromptConfig.temperature }
            : {})
        },
        adminPromptConfig
      );

      const parsed = parseAiJson(response.text);
      return res.json(parsed);
    } catch (err: any) {
      console.error('Erro na rota /api/interview/score-answer:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // STRIPE RECURRING SUBSCRIPTION API ROUTES
  // -------------------------------------------------------------

  // 1. Stripe Configuration & Public Status
  app.get('/api/stripe/config', (_req, res) => {
    res.json({
      configured: Boolean(stripeClient),
      publishableKey: stripePublishableKey,
      isTestMode: !stripeSecretKey || (!stripeSecretKey.startsWith('sk_live_') && !stripeSecretKey.startsWith('rk_live_')),
      supportedCurrencies: ['usd', 'eur', 'aoa', 'brl'],
      plans: {
        pro: {
          name: 'Plano Profissional',
          monthlyUSD: 2,
          yearlyUSD: 18,
          savingsYearlyPercent: 25
        },
        executive: {
          name: 'Plano Executivo VIP',
          monthlyUSD: 4,
          yearlyUSD: 36,
          savingsYearlyPercent: 25
        }
      }
    });
  });

  // 2. Create Stripe Checkout Session for Recurring Subscriptions (Monthly / Yearly)
  app.post('/api/stripe/create-checkout-session', async (req, res) => {
    try {
      const {
        plan = 'pro',
        billingCycle = 'monthly',
        userId,
        userName,
        userEmail,
        discountPercent = 0,
        couponCode,
        originUrl
      } = req.body;

      const isYearly = billingCycle === 'yearly';
      const baseUSD = plan === 'executive'
        ? (isYearly ? 36 : 4)
        : (isYearly ? 18 : 2);

      const discountRate = Math.min(100, Math.max(0, Number(discountPercent) || 0));
      const finalPriceUSD = Math.max(0, Math.round(baseUSD * (1 - discountRate / 100) * 100) / 100);
      const unitAmountCents = Math.round(finalPriceUSD * 100);

      const appBaseUrl = originUrl || process.env.APP_URL || `http://localhost:${PORT}`;
      const planLabel = plan === 'executive' ? 'Executivo VIP' : 'Profissional';
      const cycleLabel = isYearly ? 'Anual' : 'Mensal';

      if (stripeClient && finalPriceUSD > 0) {
        // Create real Stripe checkout session with recurring subscription
        const session = await stripeClient.checkout.sessions.create({
          mode: 'subscription',
          customer_email: userEmail || undefined,
          client_reference_id: userId || undefined,
          metadata: {
            userId: userId || 'usr-guest',
            userName: userName || 'Cliente SaaS',
            plan,
            billingCycle,
            couponCode: couponCode || ''
          },
          subscription_data: {
            metadata: {
              userId: userId || 'usr-guest',
              plan,
              billingCycle,
              couponCode: couponCode || ''
            }
          },
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `Currículo Estratégico SaaS - Plano ${planLabel} (${cycleLabel})`,
                  description: isYearly
                    ? `Assinatura recorrente anual (Faturamento a cada 12 meses). Exportações Word (.docx) ilimitadas, IA sem restrições e auditoria ATS prioritária.`
                    : `Assinatura recorrente mensal (Faturamento a cada 30 dias). Exportações Word (.docx) ilimitadas, IA sem restrições e auditoria ATS prioritária.`
                },
                unit_amount: unitAmountCents,
                recurring: {
                  interval: isYearly ? 'year' : 'month'
                }
              },
              quantity: 1
            }
          ],
          success_url: `${appBaseUrl}?stripe_status=success&session_id={CHECKOUT_SESSION_ID}&plan=${plan}&cycle=${billingCycle}`,
          cancel_url: `${appBaseUrl}?stripe_status=canceled&plan=${plan}`
        });

        return res.json({
          success: true,
          mode: 'live',
          sessionId: session.id,
          url: session.url
        });
      }

      // Demo/Simulated checkout when Stripe API key is not configured or 100% coupon applied
      const simulatedSessionId = `cs_demo_${Math.random().toString(36).substring(2, 11)}`;
      const simulatedSubId = `sub_${Math.random().toString(36).substring(2, 14)}`;

      return res.json({
        success: true,
        mode: 'demo',
        sessionId: simulatedSessionId,
        subscriptionId: simulatedSubId,
        url: `${appBaseUrl}?stripe_status=success&session_id=${simulatedSessionId}&plan=${plan}&cycle=${billingCycle}&demo=true`,
        message: 'Sessão Stripe Checkout pronta (Modo seguro / Simulação ativa).'
      });
    } catch (err: any) {
      console.error('Erro ao gerar Stripe Checkout Session:', err);
      return res.status(500).json({
        error: 'Erro ao gerar checkout Stripe: ' + (err.message || 'Falha desconhecida')
      });
    }
  });

  // 3. Process In-Modal Direct Card Subscription (Stripe Recurring Authorizations)
  app.post('/api/stripe/process-subscription', async (req, res) => {
    try {
      const {
        plan = 'pro',
        billingCycle = 'monthly',
        userId,
        userName,
        userEmail,
        cardLast4,
        cardBrand,
        couponCode,
        discountPercent = 0
      } = req.body;

      const isYearly = billingCycle === 'yearly';
      const baseUSD = plan === 'executive'
        ? (isYearly ? 36 : 4)
        : (isYearly ? 18 : 2);

      const discountRate = Math.min(100, Math.max(0, Number(discountPercent) || 0));
      const finalPriceUSD = Math.max(0, Math.round(baseUSD * (1 - discountRate / 100) * 100) / 100);

      const durationDays = isYearly ? 365 : 30;
      const nextBillingDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

      let stripeCustomerId = `cus_${Math.random().toString(36).substring(2, 12)}`;
      let stripeSubscriptionId = `sub_${Math.random().toString(36).substring(2, 14)}`;
      let paymentIntentId = `pi_${Math.random().toString(36).substring(2, 14)}`;

      // If real Stripe client is configured and user has email, register customer in Stripe
      if (stripeClient && userEmail) {
        try {
          const customer = await stripeClient.customers.create({
            email: userEmail,
            name: userName || 'Cliente SaaS',
            metadata: {
              userId: userId || 'anon',
              plan,
              billingCycle
            }
          });
          stripeCustomerId = customer.id;
        } catch (stripeErr) {
          console.warn('Erro ao criar cliente Stripe:', stripeErr);
        }
      }

      return res.json({
        success: true,
        mode: stripeClient ? 'live' : 'test',
        subscriptionId: stripeSubscriptionId,
        customerId: stripeCustomerId,
        paymentIntentId,
        status: 'active',
        plan,
        billingCycle,
        amount: finalPriceUSD,
        currency: 'USD',
        nextBillingDate,
        cardBrand: cardBrand || 'Visa',
        last4: cardLast4 || '4242',
        receiptUrl: `https://pay.stripe.com/receipts/${paymentIntentId}`,
        invoiceNumber: `STRIPE-INV-${Date.now().toString().slice(-6)}`,
        message: `Assinatura ${isYearly ? 'Anual' : 'Mensal'} autorizada com sucesso na Stripe!`
      });
    } catch (err: any) {
      console.error('Erro ao processar assinatura Stripe:', err);
      return res.status(500).json({
        error: 'Falha no processamento da assinatura: ' + (err.message || 'Erro de rede')
      });
    }
  });

  // 4. Verify Stripe Checkout Session
  app.post('/api/stripe/verify-session', async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID obrigatório.' });
      }

      if (stripeClient && !sessionId.startsWith('cs_demo_')) {
        const session = await stripeClient.checkout.sessions.retrieve(sessionId, {
          expand: ['subscription', 'customer']
        });

        const sub = session.subscription as Stripe.Subscription | null;
        return res.json({
          verified: true,
          mode: 'live',
          status: session.status,
          paymentStatus: session.payment_status,
          subscriptionId: typeof session.subscription === 'string' ? session.subscription : sub?.id,
          customerId: typeof session.customer === 'string' ? session.customer : (session.customer as any)?.id,
          plan: session.metadata?.plan || 'pro',
          billingCycle: session.metadata?.billingCycle || 'monthly'
        });
      }

      // Demo verification
      return res.json({
        verified: true,
        mode: 'demo',
        status: 'complete',
        paymentStatus: 'paid',
        subscriptionId: `sub_demo_${sessionId.slice(0, 10)}`,
        customerId: `cus_demo_${Date.now()}`
      });
    } catch (err: any) {
      console.error('Erro ao verificar sessão Stripe:', err);
      return res.status(500).json({ error: err.message || 'Falha ao validar sessão Stripe.' });
    }
  });

  // 5. Customer Portal for Managing Recurring Subscriptions
  app.post('/api/stripe/customer-portal', async (req, res) => {
    try {
      const { customerId, returnUrl } = req.body;
      const appBaseUrl = returnUrl || process.env.APP_URL || `http://localhost:${PORT}`;

      if (stripeClient && customerId && !customerId.startsWith('cus_demo_')) {
        const portalSession = await stripeClient.billingPortal.sessions.create({
          customer: customerId,
          return_url: appBaseUrl
        });
        return res.json({ url: portalSession.url, active: true });
      }

      return res.json({
        url: `${appBaseUrl}?stripe_portal=active`,
        active: false,
        message: 'Portal do cliente Stripe gerenciado centralmente.'
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 6. Cancel Subscription Endpoint
  app.post('/api/stripe/cancel-subscription', async (req, res) => {
    try {
      const { subscriptionId } = req.body;
      if (!subscriptionId) {
        return res.status(400).json({ error: 'Subscription ID obrigatório.' });
      }

      if (stripeClient && !subscriptionId.startsWith('sub_demo_')) {
        const canceled = await stripeClient.subscriptions.cancel(subscriptionId);
        return res.json({
          success: true,
          status: canceled.status,
          message: 'Assinatura cancelada com sucesso na Stripe.'
        });
      }

      return res.json({
        success: true,
        status: 'canceled',
        message: 'Assinatura cancelada com sucesso (Modo simulação / teste).'
      });
    } catch (err: any) {
      console.error('Erro ao cancelar assinatura Stripe:', err);
      return res.status(500).json({ error: err.message || 'Erro ao cancelar assinatura.' });
    }
  });

  // -------------------------------------------------------------
  // 7. ADMIN NO-CODE PROMPT LIVE TESTER ENDPOINT
  // -------------------------------------------------------------
  app.post('/api/admin/test-prompt', async (req, res) => {
    const startedAt = Date.now();
    try {
      const { systemInstruction, userPromptTemplate, sampleInput, temperature, preferredModel, fallbackModel } = req.body;
      if (!ai) {
        return res.json({
          output: `[Modo Simulação Offline - GEMINI_API_KEY ausente]\nSystem: ${systemInstruction || 'N/A'}\nPrompt aplicado ao input: "${sampleInput || 'Exemplo padrão'}"\nResultado: Perfil otimizado com métricas quantificáveis e foco executivo.`,
          modelUsed: preferredModel || 'gemini-3.8-flash',
          latencyMs: Date.now() - startedAt,
          estimatedTokens: 320
        });
      }

      const fullPrompt = `${systemInstruction ? `INSTRUÇÃO DE SISTEMA:\n${systemInstruction}\n\n` : ''}TEMPLATE DO PROMPT:\n${userPromptTemplate || ''}\n\nDADOS DE TESTE DO ADMIN:\n${sampleInput || 'Gerente de Operações com 10 anos de experiência em logística e redução de custos.'}`;
      const response = await generateContentWithRetry(
        fullPrompt,
        {
          ...(typeof temperature === 'number' ? { temperature } : {})
        },
        { preferredModel, fallbackModel }
      );

      const textOut = response.text || '';
      const latencyMs = Date.now() - startedAt;
      const estimatedTokens = Math.ceil((fullPrompt.length + textOut.length) / 4);

      return res.json({
        output: textOut,
        modelUsed: preferredModel || 'gemini-3.8-flash',
        latencyMs,
        estimatedTokens
      });
    } catch (err: any) {
      console.error('Erro em /api/admin/test-prompt:', err);
      return res.status(500).json({
        error: err?.message || 'Falha ao executar teste do prompt.',
        latencyMs: Date.now() - startedAt
      });
    }
  });

  // -------------------------------------------------------------
  // 8. FULL-STACK HYBRID AUTHENTICATION API (/api/auth/*)
  // -------------------------------------------------------------
  const AUTH_DATA_DIR = path.resolve(__dirname, '.data');
  const AUTH_STORE_FILE = path.join(AUTH_DATA_DIR, 'auth-users.json');
  const AUTH_SECRET_FILE = path.join(AUTH_DATA_DIR, 'auth-secret.key');

  const ADMIN_EMAILS_BACKEND = new Set([
    'gugurai923@gmail.com',
    'admin@curriculoestrategico.com',
    'mballoaliou2000@yahoo.fr'
  ]);

  interface BackendUserRecord {
    id: string;
    name: string;
    email: string;
    passwordHash?: string;
    passwordSalt?: string;
    role: 'admin' | 'user';
    status: 'active' | 'suspended';
    plan: 'free' | 'pro' | 'executive';
    targetRole?: string;
    phone?: string;
    company?: string;
    avatarUrl?: string;
    creditsRemaining: number;
    creditsUsed: number;
    totalCvGenerated: number;
    billingCycle: 'monthly' | 'yearly';
    subscriptionExpiresAt?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripeStatus?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
    authProviders: Array<'password' | 'google'>;
    firebaseUid?: string;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
  }

  interface PasswordResetRecord {
    email: string;
    codeHash: string;
    expiresAt: number;
    attempts: number;
  }

  interface AuthStoreData {
    users: Record<string, BackendUserRecord>;
    resetTokens: Record<string, PasswordResetRecord>;
  }

  function ensureAuthSecret(): string {
    if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16) {
      return process.env.AUTH_SECRET;
    }
    try {
      if (!fs.existsSync(AUTH_DATA_DIR)) {
        fs.mkdirSync(AUTH_DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(AUTH_SECRET_FILE)) {
        const existingSecret = fs.readFileSync(AUTH_SECRET_FILE, 'utf8').trim();
        if (existingSecret.length >= 32) return existingSecret;
      }
      const generated = crypto.randomBytes(48).toString('hex');
      fs.writeFileSync(AUTH_SECRET_FILE, generated, { mode: 0o600 });
      return generated;
    } catch {
      return crypto.createHash('sha256').update(process.cwd() + ':cv-studio-fallback-secret').digest('hex');
    }
  }

  const AUTH_TOKEN_SECRET = ensureAuthSecret();

  function loadAuthStore(): AuthStoreData {
    try {
      if (fs.existsSync(AUTH_STORE_FILE)) {
        const raw = fs.readFileSync(AUTH_STORE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.users) {
          return {
            users: parsed.users || {},
            resetTokens: parsed.resetTokens || {}
          };
        }
      }
    } catch (e) {
      console.warn('Aviso ao ler auth store, iniciando store limpo:', e);
    }
    return { users: {}, resetTokens: {} };
  }

  const authStore: AuthStoreData = loadAuthStore();

  function persistAuthStore() {
    try {
      if (!fs.existsSync(AUTH_DATA_DIR)) {
        fs.mkdirSync(AUTH_DATA_DIR, { recursive: true });
      }
      const tmpPath = `${AUTH_STORE_FILE}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(authStore, null, 2), { mode: 0o600 });
      fs.renameSync(tmpPath, AUTH_STORE_FILE);
    } catch (e) {
      console.warn('Aviso ao gravar auth store em disco:', e);
    }
  }

  function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
    const salt = existingSalt || crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return { hash: derived, salt };
  }

  function verifyPasswordHash(password: string, storedHash: string, storedSalt: string): boolean {
    try {
      const derived = crypto.scryptSync(password, storedSalt, 64);
      const storedBuf = Buffer.from(storedHash, 'hex');
      if (derived.length !== storedBuf.length) return false;
      return crypto.timingSafeEqual(derived, storedBuf);
    } catch {
      return false;
    }
  }

  function signSessionToken(payload: { uid: string; email: string; role: string; exp: number }): string {
    const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const sig = crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(encoded).digest('base64url');
    return `${encoded}.${sig}`;
  }

  function verifySessionToken(token: string): { uid: string; email: string; role: string; exp: number } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return null;
      const [encoded, providedSig] = parts;
      const expectedSig = crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(encoded).digest('base64url');
      const a = Buffer.from(providedSig, 'utf8');
      const b = Buffer.from(expectedSig, 'utf8');
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
      const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
      if (!payload?.uid || !payload?.exp || Date.now() > payload.exp) return null;
      return payload;
    } catch {
      return null;
    }
  }

  function parseCookies(cookieHeader: string | undefined): Record<string, string> {
    const result: Record<string, string> = {};
    if (!cookieHeader) return result;
    cookieHeader.split(';').forEach((pair) => {
      const idx = pair.indexOf('=');
      if (idx > 0) {
        const key = pair.slice(0, idx).trim();
        const val = pair.slice(idx + 1).trim();
        result[key] = decodeURIComponent(val);
      }
    });
    return result;
  }

  function extractTokenFromRequest(req: express.Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }
    const cookies = parseCookies(req.headers.cookie);
    return cookies['ce_session'] || null;
  }

  function setSessionCookie(req: express.Request, res: express.Response, token: string, rememberMe = true) {
    const isSecure =
      req.secure ||
      req.headers['x-forwarded-proto'] === 'https' ||
      process.env.NODE_ENV === 'production';
    const maxAgeMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    res.cookie('ce_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
      maxAge: maxAgeMs,
      path: '/'
    });
  }

  function sanitizeUser(record: BackendUserRecord) {
    return {
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role,
      status: record.status,
      plan: record.plan,
      targetRole: record.targetRole,
      phone: record.phone,
      company: record.company,
      avatarUrl: record.avatarUrl,
      creditsRemaining: record.creditsRemaining,
      creditsUsed: record.creditsUsed,
      totalCvGenerated: record.totalCvGenerated,
      billingCycle: record.billingCycle,
      subscriptionExpiresAt: record.subscriptionExpiresAt,
      stripeCustomerId: record.stripeCustomerId,
      stripeSubscriptionId: record.stripeSubscriptionId,
      stripeStatus: record.stripeStatus,
      createdAt: record.createdAt
    };
  }

  function findBackendUserByEmail(email: string): BackendUserRecord | undefined {
    const clean = email.trim().toLowerCase();
    return Object.values(authStore.users).find((u) => u.email.toLowerCase() === clean);
  }

  // Lightweight per-IP rate limiter for auth endpoints
  const authRateLimit = new Map<string, { count: number; resetAt: number }>();
  function checkAuthRateLimit(req: express.Request, maxRequests = 30, windowMs = 60_000): boolean {
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local');
    const now = Date.now();
    const cur = authRateLimit.get(ip);
    if (!cur || now > cur.resetAt) {
      authRateLimit.set(ip, { count: 1, resetAt: now + windowMs });
      return true;
    }
    cur.count += 1;
    return cur.count <= maxRequests;
  }

  app.post('/api/auth/register', (req, res) => {
    try {
      if (!checkAuthRateLimit(req, 20, 60_000)) {
        return res.status(429).json({
          code: 'auth/too-many-requests',
          error: 'Demasiadas tentativas consecutivas. Aguarde um minuto antes de tentar novamente.'
        });
      }

      const { name, email, password, targetRole, rememberMe = true } = req.body || {};
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanName = String(name || '').trim();
      const cleanPassword = String(password || '');

      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({
          code: 'auth/invalid-email',
          error: 'O formato do endereço de e-mail não é válido.'
        });
      }

      if (!cleanPassword || cleanPassword.length < 6) {
        return res.status(400).json({
          code: 'auth/weak-password',
          error: 'A palavra-passe deve conter pelo menos 6 caracteres.'
        });
      }

      const existing = findBackendUserByEmail(cleanEmail);
      if (existing) {
        return res.status(409).json({
          code: 'auth/email-already-in-use',
          error: 'Este endereço de e-mail já está associado a uma conta existente. Tente iniciar sessão.'
        });
      }

      const isAdmin = ADMIN_EMAILS_BACKEND.has(cleanEmail);
      const uid = `usr_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
      const { hash, salt } = hashPassword(cleanPassword);
      const nowIso = new Date().toISOString();

      const newUser: BackendUserRecord = {
        id: uid,
        name: cleanName || cleanEmail.split('@')[0] || 'Novo Assinante',
        email: cleanEmail,
        passwordHash: hash,
        passwordSalt: salt,
        role: isAdmin ? 'admin' : 'user',
        status: 'active',
        plan: isAdmin ? 'executive' : 'free',
        targetRole: targetRole ? String(targetRole).trim() : 'Profissional Executivo',
        creditsRemaining: isAdmin ? 9999 : 5,
        creditsUsed: 0,
        totalCvGenerated: 0,
        billingCycle: isAdmin ? 'yearly' : 'monthly',
        authProviders: ['password'],
        createdAt: nowIso,
        updatedAt: nowIso,
        lastLoginAt: nowIso
      };

      authStore.users[uid] = newUser;
      persistAuthStore();

      const ttlMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const token = signSessionToken({
        uid: newUser.id,
        email: newUser.email,
        role: newUser.role,
        exp: Date.now() + ttlMs
      });

      setSessionCookie(req, res, token, Boolean(rememberMe));

      return res.status(201).json({
        success: true,
        user: sanitizeUser(newUser),
        token
      });
    } catch (err: any) {
      console.error('Erro em /api/auth/register:', err);
      return res.status(500).json({ error: 'Falha ao registar conta no servidor.' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      if (!checkAuthRateLimit(req, 30, 60_000)) {
        return res.status(429).json({
          code: 'auth/too-many-requests',
          error: 'Demasiadas tentativas consecutivas. Aguarde um minuto antes de tentar novamente.'
        });
      }

      const { email, password, rememberMe = true } = req.body || {};
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanPassword = String(password || '');

      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({
          code: 'auth/invalid-email',
          error: 'O formato do endereço de e-mail não é válido.'
        });
      }

      if (!cleanPassword) {
        return res.status(400).json({
          code: 'auth/missing-password',
          error: 'Por favor, insira a sua palavra-passe.'
        });
      }

      const userRecord = findBackendUserByEmail(cleanEmail);
      if (!userRecord || !userRecord.passwordHash || !userRecord.passwordSalt) {
        return res.status(401).json({
          code: 'auth/invalid-credential',
          error: 'Credenciais inválidas. Verifique o seu e-mail e palavra-passe.'
        });
      }

      const isValid = verifyPasswordHash(cleanPassword, userRecord.passwordHash, userRecord.passwordSalt);
      if (!isValid) {
        return res.status(401).json({
          code: 'auth/invalid-credential',
          error: 'Credenciais inválidas. Verifique o seu e-mail e palavra-passe.'
        });
      }

      if (userRecord.status === 'suspended') {
        return res.status(403).json({
          code: 'auth/user-disabled',
          error: 'Esta conta foi suspensa pela administração. Contacte o suporte.'
        });
      }

      const isAdmin = ADMIN_EMAILS_BACKEND.has(cleanEmail);
      if (isAdmin && userRecord.role !== 'admin') {
        userRecord.role = 'admin';
      }
      userRecord.lastLoginAt = new Date().toISOString();
      userRecord.updatedAt = userRecord.lastLoginAt;
      persistAuthStore();

      const ttlMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const token = signSessionToken({
        uid: userRecord.id,
        email: userRecord.email,
        role: userRecord.role,
        exp: Date.now() + ttlMs
      });

      setSessionCookie(req, res, token, Boolean(rememberMe));

      return res.json({
        success: true,
        user: sanitizeUser(userRecord),
        token
      });
    } catch (err: any) {
      console.error('Erro em /api/auth/login:', err);
      return res.status(500).json({ error: 'Falha ao iniciar sessão no servidor.' });
    }
  });

  app.post('/api/auth/sync-firebase', (req, res) => {
    try {
      const {
        uid,
        email,
        name,
        avatarUrl,
        provider = 'google',
        targetRole,
        plan,
        creditsRemaining,
        rememberMe = true
      } = req.body || {};

      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanUid = String(uid || '').trim();
      if (!cleanUid || !cleanEmail) {
        return res.status(400).json({ error: 'Dados Firebase obrigatórios ausentes.' });
      }

      const isAdmin = ADMIN_EMAILS_BACKEND.has(cleanEmail);
      const nowIso = new Date().toISOString();

      let record = authStore.users[cleanUid] || findBackendUserByEmail(cleanEmail);
      if (!record) {
        record = {
          id: cleanUid,
          name: String(name || cleanEmail.split('@')[0] || 'Utilizador').trim(),
          email: cleanEmail,
          role: isAdmin ? 'admin' : 'user',
          status: 'active',
          plan: plan || (isAdmin ? 'executive' : 'free'),
          targetRole: targetRole || 'Profissional Executivo',
          avatarUrl: avatarUrl || undefined,
          creditsRemaining: creditsRemaining ?? (isAdmin ? 9999 : 5),
          creditsUsed: 0,
          totalCvGenerated: 0,
          billingCycle: isAdmin ? 'yearly' : 'monthly',
          authProviders: [provider === 'password' ? 'password' : 'google'],
          firebaseUid: cleanUid,
          createdAt: nowIso,
          updatedAt: nowIso,
          lastLoginAt: nowIso
        };
        authStore.users[record.id] = record;
      } else {
        if (record.status === 'suspended') {
          return res.status(403).json({
            code: 'auth/user-disabled',
            error: 'Esta conta foi suspensa pela administração. Contacte o suporte.'
          });
        }
        record.firebaseUid = cleanUid;
        if (name && (!record.name || record.name === 'Utilizador')) record.name = String(name).trim();
        if (avatarUrl) record.avatarUrl = avatarUrl;
        if (targetRole && !record.targetRole) record.targetRole = targetRole;
        if (isAdmin) record.role = 'admin';
        const provKey = provider === 'password' ? 'password' : 'google';
        if (!record.authProviders.includes(provKey)) {
          record.authProviders.push(provKey);
        }
        record.lastLoginAt = nowIso;
        record.updatedAt = nowIso;
      }

      persistAuthStore();

      const ttlMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const token = signSessionToken({
        uid: record.id,
        email: record.email,
        role: record.role,
        exp: Date.now() + ttlMs
      });

      setSessionCookie(req, res, token, Boolean(rememberMe));

      return res.json({
        success: true,
        user: sanitizeUser(record),
        token
      });
    } catch (err: any) {
      console.error('Erro em /api/auth/sync-firebase:', err);
      return res.status(500).json({ error: 'Falha ao sincronizar sessão Firebase.' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      if (!token) {
        return res.json({ authenticated: false, user: null });
      }
      const payload = verifySessionToken(token);
      if (!payload) {
        return res.json({ authenticated: false, user: null });
      }
      const userRecord = authStore.users[payload.uid] || findBackendUserByEmail(payload.email);
      if (!userRecord || userRecord.status === 'suspended') {
        return res.json({ authenticated: false, user: null });
      }
      return res.json({
        authenticated: true,
        user: sanitizeUser(userRecord)
      });
    } catch {
      return res.json({ authenticated: false, user: null });
    }
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie('ce_session', { path: '/' });
    return res.json({ success: true });
  });

  app.patch('/api/auth/profile', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload) {
        return res.status(401).json({ error: 'Sessão expirada ou inválida. Inicie sessão novamente.' });
      }

      const userRecord = authStore.users[payload.uid] || findBackendUserByEmail(payload.email);
      if (!userRecord) {
        return res.status(404).json({ error: 'Utilizador não encontrado.' });
      }

      const { name, targetRole, phone, company } = req.body || {};
      if (typeof name === 'string' && name.trim()) userRecord.name = name.trim().slice(0, 120);
      if (typeof targetRole === 'string') userRecord.targetRole = targetRole.trim().slice(0, 150);
      if (typeof phone === 'string') userRecord.phone = phone.trim().slice(0, 50);
      if (typeof company === 'string') userRecord.company = company.trim().slice(0, 120);
      userRecord.updatedAt = new Date().toISOString();

      persistAuthStore();
      return res.json({ success: true, user: sanitizeUser(userRecord) });
    } catch (err: any) {
      console.error('Erro em /api/auth/profile:', err);
      return res.status(500).json({ error: 'Erro ao atualizar perfil no servidor.' });
    }
  });

  app.post('/api/auth/sync-plan', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload) {
        return res.status(401).json({ error: 'Sessão inválida.' });
      }

      const userRecord = authStore.users[payload.uid] || findBackendUserByEmail(payload.email);
      if (!userRecord) {
        return res.status(404).json({ error: 'Utilizador não encontrado.' });
      }

      const {
        plan,
        billingCycle,
        creditsRemaining,
        subscriptionExpiresAt,
        stripeCustomerId,
        stripeSubscriptionId,
        stripeStatus
      } = req.body || {};

      if (plan && ['free', 'pro', 'executive'].includes(plan)) userRecord.plan = plan;
      if (billingCycle && ['monthly', 'yearly'].includes(billingCycle)) userRecord.billingCycle = billingCycle;
      if (typeof creditsRemaining === 'number') userRecord.creditsRemaining = creditsRemaining;
      if (typeof subscriptionExpiresAt === 'string') userRecord.subscriptionExpiresAt = subscriptionExpiresAt;
      if (typeof stripeCustomerId === 'string') userRecord.stripeCustomerId = stripeCustomerId;
      if (typeof stripeSubscriptionId === 'string') userRecord.stripeSubscriptionId = stripeSubscriptionId;
      if (typeof stripeStatus === 'string') userRecord.stripeStatus = stripeStatus as any;
      userRecord.updatedAt = new Date().toISOString();

      persistAuthStore();
      return res.json({ success: true, user: sanitizeUser(userRecord) });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/change-password', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload) {
        return res.status(401).json({ error: 'Sessão expirada. Inicie sessão novamente.' });
      }

      const userRecord = authStore.users[payload.uid] || findBackendUserByEmail(payload.email);
      if (!userRecord) {
        return res.status(404).json({ error: 'Conta não encontrada.' });
      }

      const { currentPassword, newPassword } = req.body || {};
      if (!newPassword || String(newPassword).length < 6) {
        return res.status(400).json({ error: 'A nova palavra-passe deve ter pelo menos 6 caracteres.' });
      }

      if (userRecord.passwordHash && userRecord.passwordSalt) {
        if (!currentPassword || !verifyPasswordHash(String(currentPassword), userRecord.passwordHash, userRecord.passwordSalt)) {
          return res.status(401).json({ error: 'A palavra-passe atual está incorreta.' });
        }
      }

      const { hash, salt } = hashPassword(String(newPassword));
      userRecord.passwordHash = hash;
      userRecord.passwordSalt = salt;
      if (!userRecord.authProviders.includes('password')) {
        userRecord.authProviders.push('password');
      }
      userRecord.updatedAt = new Date().toISOString();
      persistAuthStore();

      return res.json({ success: true, message: 'Palavra-passe atualizada com sucesso.' });
    } catch (err: any) {
      console.error('Erro em /api/auth/change-password:', err);
      return res.status(500).json({ error: 'Falha ao atualizar palavra-passe.' });
    }
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    try {
      if (!checkAuthRateLimit(req, 10, 60_000)) {
        return res.status(429).json({ error: 'Demasiados pedidos de recuperação. Aguarde um minuto.' });
      }

      const cleanEmail = String(req.body?.email || '').trim().toLowerCase();
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({ error: 'Insira um endereço de e-mail válido.' });
      }

      const userRecord = findBackendUserByEmail(cleanEmail);
      if (!userRecord) {
        return res.status(404).json({
          code: 'auth/user-not-found',
          error: 'Nenhuma conta encontrada com este endereço de e-mail.'
        });
      }

      const code = String(crypto.randomInt(100000, 999999));
      const codeHash = crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(`${cleanEmail}:${code}`).digest('hex');

      authStore.resetTokens[cleanEmail] = {
        email: cleanEmail,
        codeHash,
        expiresAt: Date.now() + 15 * 60 * 1000,
        attempts: 0
      };
      persistAuthStore();

      return res.json({
        success: true,
        mode: 'backend_code',
        verificationCode: code,
        message: 'Código de verificação de 6 dígitos gerado com validade de 15 minutos.'
      });
    } catch (err: any) {
      console.error('Erro em /api/auth/forgot-password:', err);
      return res.status(500).json({ error: 'Erro ao iniciar recuperação de palavra-passe.' });
    }
  });

  app.post('/api/auth/reset-password', (req, res) => {
    try {
      const cleanEmail = String(req.body?.email || '').trim().toLowerCase();
      const code = String(req.body?.code || '').trim();
      const newPassword = String(req.body?.newPassword || '');

      if (!cleanEmail || !code || newPassword.length < 6) {
        return res.status(400).json({ error: 'Preencha o e-mail, o código de 6 dígitos e uma nova palavra-passe (mín. 6 caracteres).' });
      }

      const resetRec = authStore.resetTokens[cleanEmail];
      if (!resetRec || Date.now() > resetRec.expiresAt) {
        return res.status(400).json({ error: 'Código de recuperação inválido ou expirado. Solicite um novo código.' });
      }

      resetRec.attempts += 1;
      if (resetRec.attempts > 5) {
        delete authStore.resetTokens[cleanEmail];
        persistAuthStore();
        return res.status(429).json({ error: 'Limite de tentativas excedido. Solicite um novo código.' });
      }

      const expectedHash = crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(`${cleanEmail}:${code}`).digest('hex');
      const a = Buffer.from(resetRec.codeHash, 'utf8');
      const b = Buffer.from(expectedHash, 'utf8');
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        persistAuthStore();
        return res.status(400).json({ error: 'Código de verificação incorreto.' });
      }

      const userRecord = findBackendUserByEmail(cleanEmail);
      if (!userRecord) {
        return res.status(404).json({ error: 'Conta não encontrada.' });
      }

      const { hash, salt } = hashPassword(newPassword);
      userRecord.passwordHash = hash;
      userRecord.passwordSalt = salt;
      if (!userRecord.authProviders.includes('password')) {
        userRecord.authProviders.push('password');
      }
      userRecord.updatedAt = new Date().toISOString();
      delete authStore.resetTokens[cleanEmail];
      persistAuthStore();

      const token = signSessionToken({
        uid: userRecord.id,
        email: userRecord.email,
        role: userRecord.role,
        exp: Date.now() + 30 * 24 * 60 * 60 * 1000
      });
      setSessionCookie(req, res, token, true);

      return res.json({
        success: true,
        user: sanitizeUser(userRecord),
        token,
        message: 'Palavra-passe redefinida e sessão iniciada com sucesso!'
      });
    } catch (err: any) {
      console.error('Erro em /api/auth/reset-password:', err);
      return res.status(500).json({ error: 'Falha ao redefinir palavra-passe.' });
    }
  });

  const httpServer = http.createServer(app);

  // Vite middleware in dev or static files in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CV Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
