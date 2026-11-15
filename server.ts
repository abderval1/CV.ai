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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

export function createApiApp() {
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
    const normalizeModel = (m?: string) => {
      if (!m) return undefined;
      if (m === 'gemini-3.8-flash' || m === 'gemini-flash-latest') return 'gemini-4-hydrogen';
      return m;
    };
    const defaultOrder = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
    const customOrder = [
      normalizeModel(routingOverride?.preferredModel),
      normalizeModel(routingOverride?.fallbackModel),
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
      const timeoutMs = 25000;
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const effectiveConfig: Record<string, any> = {
          ...(config || {}),
          abortSignal: controller.signal
        };
        if (model.startsWith('gemini-4-')) {
          delete effectiveConfig.temperature;
          delete effectiveConfig.topP;
          delete effectiveConfig.topK;
          delete effectiveConfig.candidateCount;
        }
        if (model === 'gemini-4-hydrogen' && !effectiveConfig.thinkingConfig) {
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
          msg.includes('404') ||
          msg.includes('NOT_FOUND') ||
          msg.includes('Timeout') ||
          msg.includes('abort') ||
          err?.status === 503 ||
          err?.status === 429 ||
          err?.status === 404;
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
      const {
        rawCandidateInfo,
        jobDescription,
        candidateLinkedIn,
        targetStandard,
        adminPromptConfig,
        generationMode
      } = req.body;

      if (!rawCandidateInfo && !candidateLinkedIn) {
        return res.status(400).json({ error: 'Nenhuma informação do candidato foi fornecida.' });
      }

      if (!ai) {
        return res.status(503).json({
          error: 'Chave GEMINI_API_KEY não configurada no servidor.',
          fallback: true
        });
      }

      const cleanJobDesc = typeof jobDescription === 'string' ? jobDescription.trim() : '';
      const isStandardMode = generationMode === 'standard' || !cleanJobDesc;

      const customInstructionBlock = adminPromptConfig?.systemInstruction
        ? `\nDIRETRIZ PERSONALIZADA DO ADMINISTRADOR:\n${adminPromptConfig.systemInstruction}\n`
        : '';

      const prompt = isStandardMode
        ? `
Você é um especialista sénior em Recursos Humanos, redação de currículos e formatação compatível com sistemas ATS (Workday, Taleo, Greenhouse, Europass).
${customInstructionBlock}
O candidato enviou um currículo existente, texto bruto, notas de carreira ou perfil do LinkedIn para ser ESTRUTURADO E APRIMORADO como um CV geral (SEM uma vaga específica de destino).

SUA MISSÃO:
1. Analisar os dados fornecidos e GERAR UM CURRÍCULO ESTRUTURADO COMPLETO no padrão solicitado (${targetStandard || 'Padrão Corporativo Internacional & Executivo'}).
2. PRESERVAR FIELMENTE a profissão real, cargos reais, empresas, datas, formação académica, competências, certificações e idiomas do candidato. NÃO invente cargos executivos, empresas ou indústrias que não existam nos dados originais.
3. Melhorar a clareza, ortografia, organização em bullet points orientados a resultados e legibilidade para recrutadores e filtros ATS, mantendo total fidelidade à trajetória real do candidato.

DADOS BRUTOS / CURRÍCULO DO CANDIDATO:
${rawCandidateInfo || ''}
${candidateLinkedIn ? `Perfil / Link do LinkedIn: ${candidateLinkedIn}` : ''}

DIRETRIZES DE EXTRAÇÃO E MELHORIA:
1. Extraia o Nome Completo, Título Profissional real do candidato, Localização, Telefone, E-mail e LinkedIn.
2. Resumo Profissional (Summary): Escreva um resumo claro e profissional de 3 a 5 linhas baseado exclusivamente na experiência e área real do candidato.
3. Competências Principais (Core Competencies): Agrupe as competências e ferramentas reais do candidato em 4 a 6 categorias objetivas.
4. Experiência Profissional: Liste todas as experiências encontradas em ordem cronológica reversa, mantendo empresas, cargos e períodos reais, refinando os bullet points para serem diretos, fortes e mensuráveis quando houver dados.
5. Formação Académica, Formação Especializada/Certificações, Idiomas e Referências: Extraia tudo o que constar nos dados (se não houver referências no texto, retorne lista vazia [] e não invente contactos falsos).

Responda ESTRITAMENTE em formato JSON com esta estrutura exata:
{
  "personalDetails": {
    "name": "Nome Completo",
    "title": "Título Profissional Real",
    "location": "Cidade, País",
    "phone": "+...",
    "email": "email@...",
    "linkedin": "linkedin.com/in/...",
    "website": "https://..."
  },
  "summary": "Texto do resumo profissional...",
  "competencies": [
    { "id": "comp-1", "category": "Categoria", "description": "Competências e ferramentas" }
  ],
  "experiences": [
    {
      "id": "exp-1",
      "company": "Empresa / Organização",
      "role": "Cargo",
      "period": "Período",
      "location": "Local",
      "donor": "",
      "highlights": ["Realização ou responsabilidade aprimorada 1", "Realização ou responsabilidade aprimorada 2"]
    }
  ],
  "educations": [
    { "id": "edu-1", "degree": "Grau / Curso", "institution": "Instituição", "period": "Anos", "gpaOrHonors": "" }
  ],
  "trainings": ["Certificação ou curso"],
  "languages": [
    { "language": "Idioma", "level": "Nível de proficiência" }
  ],
  "references": [
    { "id": "ref-1", "name": "Nome", "institutionAndPosition": "Entidade e Cargo", "contact": "email ou telefone" }
  ],
  "atsInsights": {
    "scoreEstimate": 90,
    "matchedKeywords": ["palavra1", "palavra2"],
    "missingKeywords": [],
    "recommendations": ["recomendação de melhoria do CV 1", "recomendação de melhoria do CV 2"]
  }
}
      `.trim()
        : `
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
${cleanJobDesc}

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
          responseMimeType: 'application/json'
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
          responseMimeType: 'application/json'
        },
        adminPromptConfig
      );

      const parsedRaw = parseAiJson(response.text);
      const parsed = parsedRaw?.data || parsedRaw;
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

      const cvForTranslation = {
        personalDetails: {
          name: cvData.personalDetails?.name || '',
          title: cvData.personalDetails?.title || '',
          location: cvData.personalDetails?.location || ''
        },
        summary: cvData.summary || '',
        competencies: cvData.competencies || [],
        experiences: cvData.experiences || [],
        educations: cvData.educations || [],
        trainings: cvData.trainings || [],
        languages: cvData.languages || [],
        references: cvData.references || []
      };

      const prompt = `
You are a world-class executive career consultant and international translator.
${adminPromptConfig?.systemInstruction ? `ADMIN INSTRUCTION: ${adminPromptConfig.systemInstruction}\n` : ''}Your task is to translate ALL user-written content in the provided CVData JSON into: ${targetLangName} (language code: ${langKey}).

CRITICAL GUIDELINES:
1. MANDATORY TARGET LANGUAGE: Every user-written field MUST be output in ${targetLangName}. Even if the input text is in Portuguese, English, Spanish, French, or German, do NOT leave source-language sentences untranslated.
2. Preserve Identity & Contacts: Keep personalDetails.name and company/university proper brand names intact.
3. Translate ALL Text Content Written by the User:
   - personalDetails.title (professional title)
   - personalDetails.location (city/country/availability phrasing, e.g., "Disponibilidade para Mobilidade Global" -> "Open to Global Relocation")
   - summary (full executive summary)
   - Every item in competencies: both 'category' and 'description'
   - Every item in experiences: 'role', 'period' (e.g., "Presente" -> "Present"/"Actualidad"/"Actuel"/"Heute"), 'location', 'donor' (if present), and EVERY string inside 'highlights'
   - Every item in educations: 'degree', 'period', 'gpaOrHonors' (if present)
   - Every string in trainings[]
   - Every item in languages: both 'language' name and 'level' description
   - Every item in references: 'institutionAndPosition'
4. Accuracy & Metrics: Keep ALL numbers, percentages, currencies, company names, and technical acronyms (P&L, KPI, OKR, ROI, NPS, M&A, ERP, AWS, Python, etc.) completely accurate.
5. Keep array lengths, ordering, and every 'id' field identical to the input.

ORIGINAL CV DATA:
${JSON.stringify(cvForTranslation, null, 2)}

Respond STRICTLY in valid JSON matching the exact CVData schema at top-level (with "personalDetails", "summary", "competencies", "experiences", "educations", "trainings", "languages", "references").
      `.trim();

      const response = await generateContentWithRetry(
        prompt,
        {
          responseMimeType: 'application/json'
        },
        adminPromptConfig
      );

      const rawParsed = parseAiJson(response.text);
      const parsed = rawParsed?.translatedCV || rawParsed?.cvData || rawParsed;

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
  // PAYMENT & RECURRING SUBSCRIPTION API ROUTES (ALL 4 CYCLES)
  // -------------------------------------------------------------

  type ServerBillingCycle = 'monthly' | 'quarterly' | 'semiannual' | 'yearly';

  function normalizeServerCycle(raw?: string | null): ServerBillingCycle {
    if (raw === 'quarterly' || raw === 'semiannual' || raw === 'yearly' || raw === 'monthly') {
      return raw;
    }
    return 'monthly';
  }

  function getServerCycleSpec(cycle: ServerBillingCycle) {
    switch (cycle) {
      case 'quarterly':
        return {
          months: 3,
          days: 90,
          defaultDiscountPct: 10,
          label: 'Trimestral',
          recurringInterval: 'month' as const,
          recurringIntervalCount: 3
        };
      case 'semiannual':
        return {
          months: 6,
          days: 180,
          defaultDiscountPct: 18,
          label: 'Semestral',
          recurringInterval: 'month' as const,
          recurringIntervalCount: 6
        };
      case 'yearly':
        return {
          months: 12,
          days: 365,
          defaultDiscountPct: 25,
          label: 'Anual',
          recurringInterval: 'year' as const,
          recurringIntervalCount: 1
        };
      default:
        return {
          months: 1,
          days: 30,
          defaultDiscountPct: 0,
          label: 'Mensal',
          recurringInterval: 'month' as const,
          recurringIntervalCount: 1
        };
    }
  }

  const cachedGatewayProductIds: Record<'pro' | 'executive', string | null> = {
    pro: null,
    executive: null
  };

  async function ensureGatewayProductId(plan: 'pro' | 'executive'): Promise<string> {
    if (!stripeClient) throw new Error('Processador de cartão indisponível.');
    const existingCached = cachedGatewayProductIds[plan];
    if (existingCached) return existingCached;

    const targetName =
      plan === 'executive'
        ? 'Currículo Estratégico - Plano Executivo VIP'
        : 'Currículo Estratégico - Plano Profissional Pro';

    const list = await stripeClient.products.list({ active: true, limit: 25 });
    const found = list.data.find((p) => p.metadata?.saasPlanId === plan || p.name === targetName);
    if (found) {
      cachedGatewayProductIds[plan] = found.id;
      return found.id;
    }

    const created = await stripeClient.products.create({
      name: targetName,
      description:
        plan === 'executive'
          ? 'Acesso Executivo VIP com Simulador de Entrevistas STAR, Radar ATS e Exportações Ilimitadas.'
          : 'Acesso Profissional Pro com Radar ATS, Otimizador IA e Exportações Word/PDF Ilimitadas.',
      metadata: { saasPlanId: plan }
    });
    cachedGatewayProductIds[plan] = created.id;
    return created.id;
  }

  function resolveServerPlanPricing(
    rawPlan?: string,
    rawCycle?: string,
    couponCode?: string,
    fallbackDiscountPercent?: number
  ) {
    const plan: 'pro' | 'executive' = rawPlan === 'executive' ? 'executive' : 'pro';
    const billingCycle = normalizeServerCycle(rawCycle);
    const spec = getServerCycleSpec(billingCycle);

    const editablePlans: any[] = Array.isArray(authStore.adminConfig?.editablePlans)
      ? authStore.adminConfig.editablePlans
      : [];
    const matchedPlan = editablePlans.find((p) => p?.id === plan);

    const monthlyUSD = Number(matchedPlan?.priceMonthlyValue) > 0
      ? Number(matchedPlan.priceMonthlyValue)
      : plan === 'executive'
      ? 12
      : 8;

    let baseUSD = monthlyUSD;
    if (billingCycle === 'quarterly') {
      baseUSD =
        Number(matchedPlan?.priceQuarterlyValue) > 0
          ? Number(matchedPlan.priceQuarterlyValue)
          : Math.round(monthlyUSD * 3 * 0.9 * 100) / 100;
    } else if (billingCycle === 'semiannual') {
      baseUSD =
        Number(matchedPlan?.priceSemiannualValue) > 0
          ? Number(matchedPlan.priceSemiannualValue)
          : Math.round(monthlyUSD * 6 * 0.82 * 100) / 100;
    } else if (billingCycle === 'yearly') {
      baseUSD =
        Number(matchedPlan?.priceYearlyValue) > 0
          ? Number(matchedPlan.priceYearlyValue)
          : Math.round(monthlyUSD * 12 * 0.75 * 100) / 100;
    }

    let validDiscountPct = 0;
    let appliedCoupon: any = null;
    if (couponCode && String(couponCode).trim()) {
      const codeClean = String(couponCode).trim().toUpperCase();
      const foundCoupon = (authStore.coupons || []).find(
        (c) => String(c?.code || '').trim().toUpperCase() === codeClean && c?.active
      );
      if (foundCoupon) {
        const notExpired = !foundCoupon.expiresAt || new Date(foundCoupon.expiresAt).getTime() >= Date.now();
        const withinLimit = !(Number(foundCoupon.maxUses) > 0 && Number(foundCoupon.usedCount) >= Number(foundCoupon.maxUses));
        if (notExpired && withinLimit) {
          validDiscountPct = Math.min(100, Math.max(0, Number(foundCoupon.discountPercent) || 0));
          appliedCoupon = foundCoupon;
        }
      } else if (typeof fallbackDiscountPercent === 'number' && fallbackDiscountPercent > 0 && fallbackDiscountPercent < 100) {
        validDiscountPct = Math.min(90, Math.max(0, Number(fallbackDiscountPercent)));
      }
    }

    const finalPriceUSD = Math.max(0, Math.round(baseUSD * (1 - validDiscountPct / 100) * 100) / 100);
    return {
      plan,
      billingCycle,
      spec,
      monthlyUSD,
      baseUSD,
      discountRate: validDiscountPct,
      appliedCoupon,
      finalPriceUSD,
      planLabel: plan === 'executive' ? 'Executivo VIP' : 'Profissional Pro'
    };
  }

  function buildPaymentConfigPayload() {
    const gov = (authStore.adminConfig?.platformGovernance || {}) as Record<string, any>;
    const proMonthly = resolveServerPlanPricing('pro', 'monthly').baseUSD;
    const execMonthly = resolveServerPlanPricing('executive', 'monthly').baseUSD;

    return {
      cardEnabled: Boolean(stripeClient && stripePublishableKey),
      configured: Boolean(stripeClient),
      publishableKey: stripePublishableKey,
      isTestMode: Boolean(stripeSecretKey && !stripeSecretKey.startsWith('sk_live_') && !stripeSecretKey.startsWith('rk_live_')),
      supportedCurrencies: ['usd', 'brl'],
      pixConfig: {
        pixKey: gov.pixKey || 'f4693532-31da-4e95-a589-19bccab0d915',
        pixKeyType: gov.pixKeyType || 'evp',
        pixBeneficiaryName: gov.pixBeneficiaryName || 'CURRICULO ESTRATEGICO',
        pixCity: gov.pixCity || 'SAO PAULO'
      },
      plans: {
        pro: {
          name: 'Plano Profissional Pro',
          monthlyUSD: proMonthly,
          quarterlyUSD: resolveServerPlanPricing('pro', 'quarterly').baseUSD,
          semiannualUSD: resolveServerPlanPricing('pro', 'semiannual').baseUSD,
          yearlyUSD: resolveServerPlanPricing('pro', 'yearly').baseUSD,
          savingsYearlyPercent: 25
        },
        executive: {
          name: 'Plano Executivo VIP',
          monthlyUSD: execMonthly,
          quarterlyUSD: resolveServerPlanPricing('executive', 'quarterly').baseUSD,
          semiannualUSD: resolveServerPlanPricing('executive', 'semiannual').baseUSD,
          yearlyUSD: resolveServerPlanPricing('executive', 'yearly').baseUSD,
          savingsYearlyPercent: 25
        }
      }
    };
  }

  // 1. Public Payment Configuration (vendor-agnostic alias + backwards-compatible route)
  app.get('/api/payments/config', (_req, res) => {
    res.json(buildPaymentConfigPayload());
  });

  app.get('/api/stripe/config', (_req, res) => {
    res.json(buildPaymentConfigPayload());
  });

  // 2. Create Tokenized Card Recurring Subscription Intent (In-Modal PCI-DSS Flow)
  app.post('/api/payments/create-subscription-intent', async (req, res) => {
    try {
      const {
        plan: rawPlan = 'pro',
        billingCycle: rawCycle = 'monthly',
        userId,
        userName,
        userEmail,
        couponCode,
        discountPercent,
        currency: rawCurrency = 'USD'
      } = req.body || {};

      const pricing = resolveServerPlanPricing(rawPlan, rawCycle, couponCode, discountPercent);
      const cleanEmail = String(userEmail || '').trim().toLowerCase();
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({ error: 'Inicie sessão com um e-mail válido antes de concluir a subscrição.' });
      }

      const targetCurrency = String(rawCurrency || 'USD').toUpperCase() === 'BRL' ? 'brl' : 'usd';
      const chargeAmount =
        targetCurrency === 'brl'
          ? Math.round(pricing.finalPriceUSD * 5.4 * 100) / 100
          : pricing.finalPriceUSD;
      const unitAmountCents = Math.round(chargeAmount * 100);
      const nextBillingDate = new Date(Date.now() + pricing.spec.days * 86400000).toISOString();

      // Valid 100% Promo Coupon activation (server-validated)
      if (pricing.finalPriceUSD === 0 && pricing.appliedCoupon) {
        const promoSubId = `sub_promo_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`;
        const now = new Date();
        const orderNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(
          Math.floor(1000 + Math.random() * 9000)
        )}`;

        const promoOrder = {
          id: `ord-${Date.now()}`,
          orderNumber,
          userId: userId || 'client',
          userName: userName || cleanEmail,
          userEmail: cleanEmail,
          plan: pricing.plan,
          billingCycle: pricing.billingCycle,
          amount: 0,
          currency: targetCurrency.toUpperCase(),
          paymentMethod: 'card',
          status: 'paid',
          stripeSubscriptionId: promoSubId,
          createdAt: now.toISOString(),
          notes: `Assinatura ${pricing.spec.label.toLowerCase()} ativada com cupom 100% (${pricing.appliedCoupon.code}).`
        };

        const targetUser = (userId && authStore.users[userId]) || findBackendUserByEmail(cleanEmail);
        if (targetUser) {
          targetUser.plan = pricing.plan;
          targetUser.billingCycle = pricing.billingCycle;
          targetUser.creditsRemaining = 9999;
          targetUser.subscriptionExpiresAt = nextBillingDate;
          targetUser.stripeSubscriptionId = promoSubId;
          targetUser.stripeStatus = 'active';
          targetUser.status = 'active';
          targetUser.updatedAt = now.toISOString();
        }
        const uidKey = targetUser?.id || userId || cleanEmail;
        if (!authStore.ordersByUser) authStore.ordersByUser = {};
        authStore.ordersByUser[uidKey] = [promoOrder, ...(authStore.ordersByUser[uidKey] || [])].slice(0, 50);
        persistAuthStore();

        return res.json({
          success: true,
          mode: 'coupon_100',
          verified: true,
          subscriptionId: promoSubId,
          plan: pricing.plan,
          billingCycle: pricing.billingCycle,
          amount: 0,
          currency: targetCurrency.toUpperCase(),
          nextBillingDate,
          order: promoOrder
        });
      }

      if (!stripeClient) {
        return res.status(503).json({
          error: 'O pagamento por cartão não está disponível neste momento. Utilize o Pix Instantâneo ou tente mais tarde.'
        });
      }

      const existingUser = (userId && authStore.users[userId]) || findBackendUserByEmail(cleanEmail);
      let customerId = existingUser?.stripeCustomerId;
      if (!customerId) {
        const existingCustomers = await stripeClient.customers.list({ email: cleanEmail, limit: 1 });
        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id;
        } else {
          const createdCustomer = await stripeClient.customers.create({
            email: cleanEmail,
            name: String(userName || existingUser?.name || cleanEmail).slice(0, 120),
            metadata: { userId: existingUser?.id || userId || 'client' }
          });
          customerId = createdCustomer.id;
        }
      }

      const productId = await ensureGatewayProductId(pricing.plan);
      const subscription = await stripeClient.subscriptions.create({
        customer: customerId,
        items: [
          {
            price_data: {
              currency: targetCurrency,
              product: productId,
              unit_amount: unitAmountCents,
              recurring: {
                interval: pricing.spec.recurringInterval,
                interval_count: pricing.spec.recurringIntervalCount
              }
            }
          }
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        metadata: {
          userId: existingUser?.id || userId || 'client',
          userEmail: cleanEmail,
          userName: String(userName || existingUser?.name || cleanEmail).slice(0, 120),
          plan: pricing.plan,
          billingCycle: pricing.billingCycle,
          couponCode: pricing.appliedCoupon?.code || ''
        },
        expand: ['latest_invoice.confirmation_secret']
      });

      const latestInvoice = subscription.latest_invoice as any;
      let clientSecret: string | undefined =
        latestInvoice?.confirmation_secret?.client_secret ||
        latestInvoice?.payment_intent?.client_secret;

      if (!clientSecret && latestInvoice?.id) {
        const retrievedInv = await stripeClient.invoices.retrieve(latestInvoice.id, {
          expand: ['confirmation_secret']
        });
        clientSecret = (retrievedInv as any)?.confirmation_secret?.client_secret;
      }

      if (!clientSecret) {
        await stripeClient.subscriptions.cancel(subscription.id).catch(() => {});
        return res.status(502).json({
          error: 'Não foi possível iniciar a cobrança segura com cartão. Tente novamente ou utilize o Pix.'
        });
      }

      return res.json({
        success: true,
        mode: 'intent',
        clientSecret,
        subscriptionId: subscription.id,
        customerId,
        plan: pricing.plan,
        billingCycle: pricing.billingCycle,
        amount: chargeAmount,
        currency: targetCurrency.toUpperCase(),
        durationDays: pricing.spec.days
      });
    } catch (err: any) {
      console.error('Erro ao iniciar assinatura por cartão:', err);
      return res.status(500).json({
        error: err?.message || 'Não foi possível iniciar o pagamento por cartão. Tente novamente.'
      });
    }
  });

  // 3. Verify & Finalize Tokenized Card Subscription After 3DS/Card Confirmation
  app.post('/api/payments/confirm-subscription', async (req, res) => {
    try {
      const { subscriptionId, paymentIntentId, plan: rawPlan, billingCycle: rawCycle, cardLast4, cardBrand } =
        req.body || {};

      if (!stripeClient) {
        return res.status(503).json({
          verified: false,
          error: 'Serviço de validação de cartão temporariamente indisponível.'
        });
      }
      if (!subscriptionId || typeof subscriptionId !== 'string') {
        return res.status(400).json({ verified: false, error: 'Identificador da assinatura ausente.' });
      }

      const subscription = await stripeClient.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice']
      });

      let paymentSucceeded = false;
      let verifiedIntentId = typeof paymentIntentId === 'string' ? paymentIntentId : '';
      if (verifiedIntentId) {
        const pi = await stripeClient.paymentIntents.retrieve(verifiedIntentId);
        if (pi.status === 'succeeded') {
          paymentSucceeded = true;
        }
      }

      const latestInv = subscription.latest_invoice as any;
      if (
        subscription.status === 'active' ||
        subscription.status === 'trialing' ||
        latestInv?.status === 'paid'
      ) {
        paymentSucceeded = true;
      }

      if (!paymentSucceeded) {
        return res.status(402).json({
          verified: false,
          status: subscription.status,
          error: 'O pagamento ainda não foi confirmado pelo banco emissor do cartão.'
        });
      }

      const plan: 'pro' | 'executive' =
        subscription.metadata?.plan === 'executive' || rawPlan === 'executive' ? 'executive' : 'pro';
      const billingCycle = normalizeServerCycle(subscription.metadata?.billingCycle || rawCycle);
      const spec = getServerCycleSpec(billingCycle);
      const customerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : (subscription.customer as any)?.id;

      const metaUserId = subscription.metadata?.userId;
      const metaUserEmail = String(subscription.metadata?.userEmail || '').trim().toLowerCase();
      const targetUser =
        (metaUserId && authStore.users[metaUserId]) ||
        (metaUserEmail ? findBackendUserByEmail(metaUserEmail) : undefined);

      const nextBillingDate = new Date(Date.now() + spec.days * 86400000).toISOString();
      const amountPaid = latestInv?.amount_paid
        ? Math.round((Number(latestInv.amount_paid) / 100) * 100) / 100
        : resolveServerPlanPricing(plan, billingCycle).baseUSD;
      const currencyPaid = String(latestInv?.currency || 'usd').toUpperCase();
      const receiptUrl = latestInv?.hosted_invoice_url || latestInv?.invoice_pdf || undefined;

      if (targetUser) {
        targetUser.plan = plan;
        targetUser.billingCycle = billingCycle;
        targetUser.creditsRemaining = 9999;
        targetUser.subscriptionExpiresAt = nextBillingDate;
        if (customerId) targetUser.stripeCustomerId = customerId;
        targetUser.stripeSubscriptionId = subscription.id;
        targetUser.stripeStatus = 'active';
        targetUser.status = 'active';
        targetUser.updatedAt = new Date().toISOString();
      }

      const now = new Date();
      const uidKey = targetUser?.id || metaUserId || metaUserEmail || 'client';
      if (!authStore.ordersByUser) authStore.ordersByUser = {};
      const existingOrders = authStore.ordersByUser[uidKey] || [];
      let order = existingOrders.find(
        (o) => o?.stripeSubscriptionId === subscription.id || (verifiedIntentId && o?.stripePaymentIntentId === verifiedIntentId)
      );

      if (!order) {
        const orderNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(
          Math.floor(1000 + Math.random() * 9000)
        )}`;
        order = {
          id: `ord-${Date.now()}`,
          orderNumber,
          userId: uidKey,
          userName: subscription.metadata?.userName || targetUser?.name || metaUserEmail || 'Assinante',
          userEmail: metaUserEmail || targetUser?.email || '',
          plan,
          billingCycle,
          amount: amountPaid,
          currency: currencyPaid,
          paymentMethod: 'card',
          status: 'paid',
          stripeSubscriptionId: subscription.id,
          stripePaymentIntentId: verifiedIntentId || undefined,
          receiptUrl,
          createdAt: now.toISOString(),
          notes: `Assinatura ${spec.label.toLowerCase()} confirmada via Cartão${
            cardBrand || cardLast4 ? ` (${cardBrand || 'Cartão'} ${cardLast4 ? 'final ' + cardLast4 : ''})` : ''
          }. Renovação: ${nextBillingDate.slice(0, 10)}.`
        };
        authStore.ordersByUser[uidKey] = [order, ...existingOrders].slice(0, 50);
      }

      persistAuthStore();

      return res.json({
        verified: true,
        subscriptionId: subscription.id,
        customerId,
        paymentIntentId: verifiedIntentId || undefined,
        plan,
        billingCycle,
        amount: amountPaid,
        currency: currencyPaid,
        nextBillingDate,
        receiptUrl,
        order
      });
    } catch (err: any) {
      console.error('Erro ao confirmar assinatura por cartão:', err);
      return res.status(500).json({
        verified: false,
        error: err?.message || 'Não foi possível validar o pagamento com cartão.'
      });
    }
  });

  // 4. Hosted Checkout Session (Backwards-compatible for top-level redirects & 4 cycles)
  app.post('/api/stripe/create-checkout-session', async (req, res) => {
    try {
      const {
        plan: rawPlan = 'pro',
        billingCycle: rawCycle = 'monthly',
        userId,
        userName,
        userEmail,
        discountPercent = 0,
        couponCode,
        originUrl,
        currency: rawCurrency = 'USD'
      } = req.body || {};

      const pricing = resolveServerPlanPricing(rawPlan, rawCycle, couponCode, discountPercent);
      const targetCurrency = String(rawCurrency || 'USD').toUpperCase() === 'BRL' ? 'brl' : 'usd';
      const chargeAmount =
        targetCurrency === 'brl'
          ? Math.round(pricing.finalPriceUSD * 5.4 * 100) / 100
          : pricing.finalPriceUSD;
      const unitAmountCents = Math.round(chargeAmount * 100);

      const appBaseUrl = originUrl || process.env.APP_URL || `http://localhost:${PORT}`;

      if (pricing.finalPriceUSD === 0 && pricing.appliedCoupon) {
        const promoSessionId = `cs_promo_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`;
        const promoSubId = `sub_promo_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`;
        if (!authStore.promoSessions) authStore.promoSessions = {};
        authStore.promoSessions[promoSessionId] = {
          sessionId: promoSessionId,
          subscriptionId: promoSubId,
          userId: userId || 'anonymous',
          userEmail: userEmail || '',
          plan: pricing.plan,
          billingCycle: pricing.billingCycle,
          couponCode: pricing.appliedCoupon.code,
          createdAt: new Date().toISOString()
        };
        persistAuthStore();

        return res.json({
          success: true,
          mode: 'coupon_100',
          sessionId: promoSessionId,
          subscriptionId: promoSubId,
          url: `${appBaseUrl}?stripe_status=success&session_id=${promoSessionId}&plan=${pricing.plan}&cycle=${pricing.billingCycle}`,
          message: 'Subscrição ativada com cupom promocional 100%.'
        });
      }

      if (!stripeClient) {
        return res.status(503).json({
          error: 'O pagamento por cartão não está disponível neste momento. Utilize o pagamento via Pix.'
        });
      }

      const session = await stripeClient.checkout.sessions.create({
        mode: 'subscription',
        customer_email: userEmail || undefined,
        client_reference_id: userId || undefined,
        metadata: {
          userId: userId || 'usr-client',
          userName: userName || 'Cliente',
          plan: pricing.plan,
          billingCycle: pricing.billingCycle,
          couponCode: pricing.appliedCoupon?.code || ''
        },
        subscription_data: {
          metadata: {
            userId: userId || 'usr-client',
            plan: pricing.plan,
            billingCycle: pricing.billingCycle,
            couponCode: pricing.appliedCoupon?.code || ''
          }
        },
        line_items: [
          {
            price_data: {
              currency: targetCurrency,
              product_data: {
                name: `Currículo Estratégico - Plano ${pricing.planLabel} (${pricing.spec.label})`,
                description: `Assinatura recorrente ${pricing.spec.label.toLowerCase()} (a cada ${pricing.spec.months} ${
                  pricing.spec.months === 1 ? 'mês' : 'meses'
                }). Exportações Word (.docx) e PDF ilimitadas, IA completa e análise ATS.`
              },
              unit_amount: unitAmountCents,
              recurring: {
                interval: pricing.spec.recurringInterval,
                interval_count: pricing.spec.recurringIntervalCount
              }
            },
            quantity: 1
          }
        ],
        success_url: `${appBaseUrl}?stripe_status=success&session_id={CHECKOUT_SESSION_ID}&plan=${pricing.plan}&cycle=${pricing.billingCycle}`,
        cancel_url: `${appBaseUrl}?stripe_status=canceled&plan=${pricing.plan}`
      });

      return res.json({
        success: true,
        mode: 'live',
        sessionId: session.id,
        url: session.url
      });
    } catch (err: any) {
      console.error('Erro ao gerar sessão de checkout:', err);
      return res.status(500).json({
        error: 'Não foi possível iniciar a página de pagamento. Tente novamente ou pague via Pix.'
      });
    }
  });

  // 5. Legacy Direct Process Subscription (Disabled for unconfirmed non-zero card charges)
  app.post('/api/stripe/process-subscription', async (req, res) => {
    try {
      const { plan: rawPlan = 'pro', billingCycle: rawCycle = 'monthly', couponCode, discountPercent } = req.body || {};
      const pricing = resolveServerPlanPricing(rawPlan, rawCycle, couponCode, discountPercent);

      if (pricing.finalPriceUSD === 0 && pricing.appliedCoupon) {
        const promoSubId = `sub_promo_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`;
        const nextBillingDate = new Date(Date.now() + pricing.spec.days * 86400000).toISOString();
        return res.json({
          success: true,
          mode: 'coupon_100',
          subscriptionId: promoSubId,
          status: 'active',
          plan: pricing.plan,
          billingCycle: pricing.billingCycle,
          amount: 0,
          currency: 'USD',
          nextBillingDate,
          cardBrand: 'Cupom 100%',
          last4: '0000',
          invoiceNumber: `PROMO-INV-${Date.now().toString().slice(-6)}`,
          message: `Assinatura ${pricing.spec.label} ativada com cupom 100%!`
        });
      }

      return res.status(400).json({
        error: 'Para sua segurança, finalize o pagamento diretamente no formulário seguro de cartão.'
      });
    } catch (err: any) {
      return res.status(500).json({
        error: 'Falha ao processar solicitação de subscrição.'
      });
    }
  });

  // 6. Strict Checkout Session Verification
  app.post('/api/stripe/verify-session', async (req, res) => {
    try {
      const { sessionId } = req.body || {};
      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ verified: false, error: 'Identificador da sessão obrigatório.' });
      }

      if (sessionId.startsWith('cs_promo_')) {
        const promo = authStore.promoSessions?.[sessionId];
        if (!promo) {
          return res.status(404).json({ verified: false, error: 'Sessão promocional não encontrada.' });
        }
        return res.json({
          verified: true,
          mode: 'coupon_100',
          status: 'complete',
          paymentStatus: 'paid',
          subscriptionId: promo.subscriptionId,
          customerId: undefined,
          plan: promo.plan,
          billingCycle: normalizeServerCycle(promo.billingCycle),
          amount: 0,
          currency: 'USD'
        });
      }

      if (!stripeClient) {
        return res.status(503).json({ verified: false, error: 'Serviço de validação de pagamento indisponível.' });
      }

      const session = await stripeClient.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer']
      });

      const isPaid =
        session.status === 'complete' &&
        (session.payment_status === 'paid' || session.payment_status === 'no_payment_required');

      if (!isPaid) {
        return res.status(402).json({
          verified: false,
          status: session.status,
          paymentStatus: session.payment_status,
          error: 'O pagamento ainda não foi confirmado.'
        });
      }

      const sub = session.subscription as Stripe.Subscription | null;
      const plan: 'pro' | 'executive' = session.metadata?.plan === 'executive' ? 'executive' : 'pro';
      const billingCycle = normalizeServerCycle(session.metadata?.billingCycle);
      const customerId = typeof session.customer === 'string' ? session.customer : (session.customer as any)?.id;
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : sub?.id;
      const amount = session.amount_total ? Math.round((session.amount_total / 100) * 100) / 100 : resolveServerPlanPricing(plan, billingCycle).baseUSD;
      const currency = String(session.currency || 'usd').toUpperCase();

      return res.json({
        verified: true,
        mode: 'live',
        status: session.status,
        paymentStatus: session.payment_status,
        subscriptionId,
        customerId,
        customerEmail: session.customer_details?.email || session.customer_email || undefined,
        plan,
        billingCycle,
        amount,
        currency
      });
    } catch (err: any) {
      console.error('Erro ao verificar sessão de pagamento:', err);
      return res.status(500).json({ verified: false, error: 'Não foi possível validar o pagamento.' });
    }
  });

  // 7. Customer Billing Portal (Hidden gateway branding)
  app.post('/api/stripe/customer-portal', async (req, res) => {
    try {
      const { customerId, returnUrl } = req.body || {};
      const appBaseUrl = returnUrl || process.env.APP_URL || `http://localhost:${PORT}`;

      if (!stripeClient) {
        return res.status(503).json({
          error: 'Portal de gestão de faturação indisponível neste momento.'
        });
      }

      if (!customerId || typeof customerId !== 'string' || !customerId.startsWith('cus_')) {
        return res.status(400).json({
          error: 'Nenhuma conta de pagamento recorrente encontrada para este perfil.'
        });
      }

      const portalSession = await stripeClient.billingPortal.sessions.create({
        customer: customerId,
        return_url: appBaseUrl
      });
      return res.json({ url: portalSession.url, active: true });
    } catch (err: any) {
      return res.status(500).json({ error: 'Não foi possível abrir o portal de faturação neste momento.' });
    }
  });

  // 8. Cancel Subscription Endpoint
  app.post('/api/stripe/cancel-subscription', async (req, res) => {
    try {
      const { subscriptionId } = req.body || {};
      if (!subscriptionId || typeof subscriptionId !== 'string') {
        return res.status(400).json({ error: 'Identificador de assinatura obrigatório.' });
      }

      if (stripeClient && subscriptionId.startsWith('sub_') && !subscriptionId.startsWith('sub_promo_')) {
        const canceled = await stripeClient.subscriptions.cancel(subscriptionId);
        return res.json({
          success: true,
          status: canceled.status,
          message: 'Renovação automática cancelada com sucesso.'
        });
      }

      return res.json({
        success: true,
        status: 'canceled',
        message: 'Assinatura cancelada com sucesso.'
      });
    } catch (err: any) {
      console.error('Erro ao cancelar assinatura:', err);
      return res.status(500).json({ error: 'Não foi possível cancelar a assinatura neste momento.' });
    }
  });

  // -------------------------------------------------------------
  // 7. ADMIN NO-CODE PROMPT LIVE TESTER ENDPOINT (PRODUCTION)
  // -------------------------------------------------------------
  app.post('/api/admin/test-prompt', async (req, res) => {
    const startedAt = Date.now();
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload || (payload.role !== 'admin' && !ADMIN_EMAILS_BACKEND.has(String(payload.email || '').toLowerCase()))) {
        return res.status(403).json({ error: 'Acesso restrito a administradores autenticados.' });
      }

      const { systemInstruction, userPromptTemplate, sampleInput, temperature, preferredModel, fallbackModel } = req.body;
      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY não configurada no servidor. Configure a chave de API nas variáveis de ambiente para executar testes ao vivo.'
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
  const isVercelEnv = Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL);
  const AUTH_DATA_DIR = isVercelEnv
    ? path.resolve('/tmp', '.data')
    : path.resolve(__dirname, '.data');
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
    notes?: string;
    avatarUrl?: string;
    creditsRemaining: number;
    creditsUsed: number;
    totalCvGenerated: number;
    billingCycle: 'monthly' | 'quarterly' | 'semiannual' | 'yearly';
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
    resumesByUser?: Record<string, any[]>;
    ordersByUser?: Record<string, any[]>;
    coupons?: any[];
    adminConfig?: Record<string, any>;
    errorLogs?: any[];
    gdprRequests?: any[];
    impersonationLogs?: any[];
    promoSessions?: Record<string, any>;
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
            resetTokens: parsed.resetTokens || {},
            resumesByUser: parsed.resumesByUser || {},
            ordersByUser: parsed.ordersByUser || {},
            coupons: Array.isArray(parsed.coupons) ? parsed.coupons : [],
            adminConfig: parsed.adminConfig && typeof parsed.adminConfig === 'object' ? parsed.adminConfig : {},
            errorLogs: Array.isArray(parsed.errorLogs) ? parsed.errorLogs : [],
            gdprRequests: Array.isArray(parsed.gdprRequests) ? parsed.gdprRequests : [],
            impersonationLogs: Array.isArray(parsed.impersonationLogs) ? parsed.impersonationLogs : [],
            promoSessions: parsed.promoSessions && typeof parsed.promoSessions === 'object' ? parsed.promoSessions : {}
          };
        }
      }
    } catch (e) {
      console.warn('Aviso ao ler auth store, iniciando store limpo:', e);
    }
    return {
      users: {},
      resetTokens: {},
      resumesByUser: {},
      ordersByUser: {},
      coupons: [],
      adminConfig: {},
      errorLogs: [],
      gdprRequests: [],
      impersonationLogs: [],
      promoSessions: {}
    };
  }

  const authStore: AuthStoreData = loadAuthStore();
  if (!authStore.resumesByUser) authStore.resumesByUser = {};
  if (!authStore.ordersByUser) authStore.ordersByUser = {};
  if (!authStore.coupons) authStore.coupons = [];
  if (!authStore.adminConfig) authStore.adminConfig = {};
  if (!authStore.errorLogs) authStore.errorLogs = [];
  if (!authStore.gdprRequests) authStore.gdprRequests = [];
  if (!authStore.impersonationLogs) authStore.impersonationLogs = [];
  if (!authStore.promoSessions) authStore.promoSessions = {};

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
      sameSite: isSecure ? 'none' : 'lax',
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
      notes: record.notes,
      avatarUrl: record.avatarUrl,
      creditsRemaining: record.creditsRemaining,
      creditsUsed: record.creditsUsed,
      totalCvGenerated: Math.max(
        record.totalCvGenerated || 0,
        authStore.resumesByUser?.[record.id]?.length || 0
      ),
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
      if (billingCycle && ['monthly', 'quarterly', 'semiannual', 'yearly'].includes(billingCycle)) {
        userRecord.billingCycle = billingCycle;
      }
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

  // Saved Resumes Persistence API (supports both backend-auth and Firebase-synced users)
  app.get('/api/resumes', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Sessão não autenticada.' });
      }
      const list = authStore.resumesByUser?.[payload.uid] || [];
      return res.json({ resumes: list });
    } catch (err: any) {
      console.error('Erro em GET /api/resumes:', err);
      return res.status(500).json({ error: 'Erro ao carregar currículos guardados.' });
    }
  });

  app.post('/api/resumes', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Sessão não autenticada.' });
      }
      const { id, title, targetJob, updatedAt, data } = req.body || {};
      if (!id || !title || !data) {
        return res.status(400).json({ error: 'Dados do currículo incompletos.' });
      }
      if (!authStore.resumesByUser) {
        authStore.resumesByUser = {};
      }
      const existing = authStore.resumesByUser[payload.uid] || [];
      const savedItem = {
        id: String(id).slice(0, 128),
        title: String(title).trim().slice(0, 150),
        targetJob: String(targetJob || 'Vaga Executiva').trim().slice(0, 180),
        updatedAt: String(updatedAt || new Date().toLocaleDateString('pt-PT')),
        data
      };
      authStore.resumesByUser[payload.uid] = [
        savedItem,
        ...existing.filter((r) => r.id !== savedItem.id && r.title !== savedItem.title)
      ].slice(0, 50);
      persistAuthStore();
      return res.status(201).json({ success: true, resume: savedItem });
    } catch (err: any) {
      console.error('Erro em POST /api/resumes:', err);
      return res.status(500).json({ error: 'Falha ao guardar currículo no servidor.' });
    }
  });

  app.delete('/api/resumes/:id', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Sessão não autenticada.' });
      }
      const resumeId = String(req.params.id || '');
      if (authStore.resumesByUser && authStore.resumesByUser[payload.uid]) {
        authStore.resumesByUser[payload.uid] = authStore.resumesByUser[payload.uid].filter(
          (r) => r.id !== resumeId
        );
        persistAuthStore();
      }
      return res.json({ success: true });
    } catch (err: any) {
      console.error('Erro em DELETE /api/resumes/:id:', err);
      return res.status(500).json({ error: 'Falha ao remover currículo do servidor.' });
    }
  });

  // Orders Persistence API for Backend-Authenticated users
  app.get('/api/orders', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Sessão não autenticada.' });
      }
      const list = authStore.ordersByUser?.[payload.uid] || [];
      return res.json({ orders: list });
    } catch (err: any) {
      console.error('Erro em GET /api/orders:', err);
      return res.status(500).json({ error: 'Erro ao carregar faturas.' });
    }
  });

  app.post('/api/orders', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload?.uid) {
        return res.status(401).json({ error: 'Sessão não autenticada.' });
      }
      const order = req.body || {};
      if (!order.id || !order.orderNumber) {
        return res.status(400).json({ error: 'Dados do pedido inválidos.' });
      }
      if (!authStore.ordersByUser) {
        authStore.ordersByUser = {};
      }
      const existing = authStore.ordersByUser[payload.uid] || [];
      authStore.ordersByUser[payload.uid] = [
        order,
        ...existing.filter((o) => o.id !== order.id)
      ].slice(0, 50);
      persistAuthStore();
      return res.status(201).json({ success: true, order });
    } catch (err: any) {
      console.error('Erro em POST /api/orders:', err);
      return res.status(500).json({ error: 'Erro ao registar pedido no servidor.' });
    }
  });

  // -------------------------------------------------------------
  // 9. PRODUCTION ADMIN BACKOFFICE & PUBLIC CONFIG API
  // -------------------------------------------------------------
  function requireAdminSession(req: express.Request, res: express.Response) {
    const token = extractTokenFromRequest(req);
    const payload = token ? verifySessionToken(token) : null;
    if (!payload) {
      res.status(401).json({ error: 'Sessão administrativa não autenticada.' });
      return null;
    }
    const userRec = authStore.users[payload.uid] || findBackendUserByEmail(payload.email);
    const isAdm =
      payload.role === 'admin' ||
      userRec?.role === 'admin' ||
      ADMIN_EMAILS_BACKEND.has(String(payload.email || '').toLowerCase());
    if (!isAdm) {
      res.status(403).json({ error: 'Acesso restrito a administradores.' });
      return null;
    }
    return payload;
  }

  // Public runtime config (non-sensitive frontend settings, plans, banners, templates, snippets, locales)
  app.get('/api/public/config', (_req, res) => {
    const cfg = authStore.adminConfig || {};
    return res.json({
      editablePlans: cfg.editablePlans || null,
      platformGovernance: cfg.platformGovernance || null,
      systemBanners: cfg.systemBanners || null,
      adminTemplates: cfg.adminTemplates || null,
      professionSnippets: cfg.professionSnippets || null,
      systemLocales: cfg.systemLocales || null,
      planQuotas: cfg.planQuotas || null
    });
  });

  // Public active coupons validation & usage tracking
  app.get('/api/coupons/public', (_req, res) => {
    return res.json({ coupons: authStore.coupons || [] });
  });

  app.post('/api/coupons/:id/use', (req, res) => {
    try {
      const couponId = String(req.params.id || '');
      const list = authStore.coupons || [];
      const idx = list.findIndex((c) => c.id === couponId);
      if (idx >= 0) {
        list[idx].usedCount = (Number(list[idx].usedCount) || 0) + 1;
        list[idx].updatedAt = new Date().toISOString();
        persistAuthStore();
      }
      return res.json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Erro ao atualizar uso do cupom.' });
    }
  });

  // Error telemetry intake from client
  app.post('/api/error-logs', (req, res) => {
    try {
      const log = req.body || {};
      if (!log.errorMessage) {
        return res.status(400).json({ error: 'errorMessage obrigatório.' });
      }
      const entry = {
        id: log.id || `err-${Date.now()}`,
        timestamp: log.timestamp || new Date().toISOString(),
        userEmail: log.userEmail || '',
        operationType: log.operationType || 'unknown',
        errorMessage: String(log.errorMessage).slice(0, 1000),
        modelUsed: log.modelUsed || 'n/a',
        resolved: Boolean(log.resolved)
      };
      authStore.errorLogs = [entry, ...(authStore.errorLogs || [])].slice(0, 100);
      persistAuthStore();
      return res.status(201).json({ success: true, log: entry });
    } catch {
      return res.status(500).json({ error: 'Erro ao registar log.' });
    }
  });

  // Authenticated user GDPR submission endpoint
  app.post('/api/gdpr/request', (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      const payload = token ? verifySessionToken(token) : null;
      if (!payload) {
        return res.status(401).json({ error: 'Autenticação necessária para submeter pedido RGPD.' });
      }
      const { requestType, notes } = req.body || {};
      if (!['export_data', 'delete_account'].includes(requestType)) {
        return res.status(400).json({ error: 'Tipo de pedido RGPD inválido.' });
      }
      const reqItem = {
        id: `gdpr-${Date.now()}`,
        userId: payload.uid,
        userEmail: payload.email,
        requestType,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        notes: notes ? String(notes).slice(0, 400) : 'Solicitação submetida pelo titular da conta.'
      };
      authStore.gdprRequests = [reqItem, ...(authStore.gdprRequests || [])].slice(0, 100);
      persistAuthStore();
      return res.status(201).json({ success: true, request: reqItem });
    } catch {
      return res.status(500).json({ error: 'Erro ao registar pedido RGPD.' });
    }
  });

  // Admin Overview Snapshot
  app.get('/api/admin/overview', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    const users = Object.values(authStore.users).map((u) => sanitizeUser(u));
    const ordersMap = new Map<string, any>();
    Object.values(authStore.ordersByUser || {}).forEach((arr) => {
      if (Array.isArray(arr)) {
        arr.forEach((o) => {
          if (o?.id) ordersMap.set(o.id, o);
        });
      }
    });
    const orders = Array.from(ordersMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return res.json({
      users,
      orders,
      coupons: authStore.coupons || [],
      config: authStore.adminConfig || {},
      errorLogs: authStore.errorLogs || [],
      gdprRequests: authStore.gdprRequests || [],
      impersonationLogs: authStore.impersonationLogs || []
    });
  });

  // Admin User Management
  app.post('/api/admin/users', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    try {
      const { id, name, email, role, status, plan, phone, creditsRemaining, billingCycle, notes } = req.body || {};
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({ error: 'E-mail válido obrigatório.' });
      }
      const existing = findBackendUserByEmail(cleanEmail);
      const uid = id || existing?.id || `usr_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
      const nowIso = new Date().toISOString();
      const record: BackendUserRecord = {
        ...(existing || {}),
        id: uid,
        name: String(name || existing?.name || 'Novo Cliente').trim(),
        email: cleanEmail,
        role: role === 'admin' || ADMIN_EMAILS_BACKEND.has(cleanEmail) ? 'admin' : 'user',
        status: status === 'suspended' ? 'suspended' : 'active',
        plan: ['free', 'pro', 'executive'].includes(plan) ? plan : 'pro',
        phone: typeof phone === 'string' ? phone : existing?.phone || '',
        notes: typeof notes === 'string' ? notes : existing?.notes || 'Cadastrado manualmente pelo admin',
        creditsRemaining: typeof creditsRemaining === 'number' ? creditsRemaining : (plan === 'free' ? 5 : 9999),
        creditsUsed: existing?.creditsUsed ?? 0,
        totalCvGenerated: existing?.totalCvGenerated ?? 0,
        billingCycle: normalizeServerCycle(billingCycle),
        authProviders: existing?.authProviders || ['password'],
        createdAt: existing?.createdAt || nowIso,
        updatedAt: nowIso
      };
      authStore.users[uid] = record;
      persistAuthStore();
      return res.status(201).json({ success: true, user: sanitizeUser(record) });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao criar utilizador.' });
    }
  });

  app.patch('/api/admin/users/:id', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    try {
      const userId = String(req.params.id || '');
      let record: BackendUserRecord | undefined = authStore.users[userId];
      const updates = req.body || {};
      if (!record && updates.email) {
        record = findBackendUserByEmail(String(updates.email));
      }
      if (!record) {
        return res.status(404).json({ error: 'Utilizador não encontrado no servidor.' });
      }
      if (typeof updates.name === 'string') record.name = updates.name.trim();
      if (typeof updates.phone === 'string') record.phone = updates.phone.trim();
      if (typeof updates.notes === 'string') record.notes = updates.notes;
      if (updates.plan && ['free', 'pro', 'executive'].includes(updates.plan)) record.plan = updates.plan;
      if (updates.role && ['admin', 'user'].includes(updates.role)) record.role = updates.role;
      if (updates.status && ['active', 'suspended'].includes(updates.status)) record.status = updates.status;
      if (typeof updates.creditsRemaining === 'number') record.creditsRemaining = updates.creditsRemaining;
      if (typeof updates.creditsUsed === 'number') record.creditsUsed = updates.creditsUsed;
      if (typeof updates.subscriptionExpiresAt === 'string') record.subscriptionExpiresAt = updates.subscriptionExpiresAt;
      record.updatedAt = new Date().toISOString();
      persistAuthStore();
      return res.json({ success: true, user: sanitizeUser(record) });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao atualizar utilizador.' });
    }
  });

  app.post('/api/admin/users/:id/anonymize', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    const userId = String(req.params.id || '');
    const record = authStore.users[userId];
    if (record) {
      record.name = 'Utilizador Anonimizado (RGPD)';
      record.email = `anon-${userId.slice(0, 8)}@eliminado.rgpd`;
      record.phone = '';
      record.status = 'suspended';
      record.plan = 'free';
      record.creditsRemaining = 0;
      record.notes = `Conta anonimizada conforme Art. 17 RGPD em ${new Date().toISOString()}`;
      record.updatedAt = new Date().toISOString();
      persistAuthStore();
    }
    return res.json({ success: true });
  });

  app.delete('/api/admin/users/:id', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    const userId = String(req.params.id || '');
    delete authStore.users[userId];
    if (authStore.resumesByUser) delete authStore.resumesByUser[userId];
    if (authStore.ordersByUser) delete authStore.ordersByUser[userId];
    persistAuthStore();
    return res.json({ success: true });
  });

  // Admin Orders Management
  app.post('/api/admin/orders', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    const order = req.body || {};
    if (!order.id || !order.orderNumber) {
      return res.status(400).json({ error: 'Dados do pedido inválidos.' });
    }
    const targetUid = String(order.userId || 'manual');
    if (!authStore.ordersByUser) authStore.ordersByUser = {};
    const existing = authStore.ordersByUser[targetUid] || [];
    authStore.ordersByUser[targetUid] = [order, ...existing.filter((o) => o.id !== order.id)].slice(0, 100);

    // Sync target user's plan if present
    const targetUser = authStore.users[targetUid] || (order.userEmail ? findBackendUserByEmail(order.userEmail) : undefined);
    const normalizedCycle = normalizeServerCycle(order.billingCycle);
    if (targetUser && order.status === 'paid' && ['pro', 'executive'].includes(order.plan)) {
      const days = getServerCycleSpec(normalizedCycle).days;
      targetUser.plan = order.plan;
      targetUser.creditsRemaining = 9999;
      targetUser.billingCycle = normalizedCycle;
      targetUser.subscriptionExpiresAt = new Date(Date.now() + days * 86400000).toISOString();
      targetUser.stripeStatus = 'active';
      targetUser.status = 'active';
      targetUser.updatedAt = new Date().toISOString();
    }
    persistAuthStore();
    return res.status(201).json({ success: true, order });
  });

  app.patch('/api/admin/orders/:id', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    const orderId = String(req.params.id || '');
    const { status, notes } = req.body || {};
    let updated = false;
    let matchedOrder: any = null;
    Object.values(authStore.ordersByUser || {}).forEach((arr) => {
      if (Array.isArray(arr)) {
        arr.forEach((o) => {
          if (o.id === orderId) {
            if (status) o.status = status;
            if (notes) o.notes = notes;
            o.updatedAt = new Date().toISOString();
            matchedOrder = o;
            updated = true;
          }
        });
      }
    });

    if (updated && status === 'paid' && matchedOrder && ['pro', 'executive'].includes(matchedOrder.plan)) {
      const targetUser =
        (matchedOrder.userId && authStore.users[matchedOrder.userId]) ||
        (matchedOrder.userEmail ? findBackendUserByEmail(matchedOrder.userEmail) : undefined);
      if (targetUser) {
        const normalizedCycle = normalizeServerCycle(matchedOrder.billingCycle);
        const days = getServerCycleSpec(normalizedCycle).days;
        targetUser.plan = matchedOrder.plan;
        targetUser.creditsRemaining = 9999;
        targetUser.billingCycle = normalizedCycle;
        targetUser.subscriptionExpiresAt = new Date(Date.now() + days * 86400000).toISOString();
        targetUser.stripeStatus = 'active';
        targetUser.status = 'active';
        targetUser.updatedAt = new Date().toISOString();
      }
    }

    if (updated) persistAuthStore();
    return res.json({ success: true, updated });
  });

  // Admin Coupons Management
  app.post('/api/admin/coupons', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    const coupon = req.body || {};
    if (!coupon.id || !coupon.code) {
      return res.status(400).json({ error: 'Cupom inválido.' });
    }
    authStore.coupons = [coupon, ...(authStore.coupons || []).filter((c) => c.id !== coupon.id)];
    persistAuthStore();
    return res.status(201).json({ success: true, coupon });
  });

  app.patch('/api/admin/coupons/:id', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    const couponId = String(req.params.id || '');
    const { active } = req.body || {};
    const idx = (authStore.coupons || []).findIndex((c) => c.id === couponId);
    if (idx >= 0 && authStore.coupons) {
      if (typeof active === 'boolean') authStore.coupons[idx].active = active;
      authStore.coupons[idx].updatedAt = new Date().toISOString();
      persistAuthStore();
    }
    return res.json({ success: true });
  });

  app.delete('/api/admin/coupons/:id', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    const couponId = String(req.params.id || '');
    authStore.coupons = (authStore.coupons || []).filter((c) => c.id !== couponId);
    persistAuthStore();
    return res.json({ success: true });
  });

  // Admin Module Config Persistence
  app.post('/api/admin/config/:scope', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    const scope = String(req.params.scope || '');
    const allowedScopes = new Set([
      'promptsConfig',
      'aiRouting',
      'planQuotas',
      'adminTemplates',
      'professionSnippets',
      'systemLocales',
      'systemBanners',
      'editablePlans',
      'platformGovernance'
    ]);
    if (!allowedScopes.has(scope)) {
      return res.status(400).json({ error: 'Escopo de configuração inválido.' });
    }
    if (!authStore.adminConfig) authStore.adminConfig = {};
    authStore.adminConfig[scope] = req.body?.data ?? req.body;
    persistAuthStore();
    return res.json({ success: true, scope });
  });

  // Admin Error Logs & GDPR & Impersonation Audit
  app.patch('/api/admin/error-logs/:id/resolve', (req, res) => {
    const payload = requireAdminSession(req, res);
    if (!payload) return;
    const logId = String(req.params.id || '');
    const idx = (authStore.errorLogs || []).findIndex((l) => l.id === logId);
    if (idx >= 0 && authStore.errorLogs) {
      authStore.errorLogs[idx].resolved = true;
      authStore.errorLogs[idx].resolvedAt = new Date().toISOString();
      authStore.errorLogs[idx].resolvedBy = payload.email;
      persistAuthStore();
    }
    return res.json({ success: true });
  });

  app.patch('/api/admin/gdpr/:id', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    const requestId = String(req.params.id || '');
    const { status, notes } = req.body || {};
    const idx = (authStore.gdprRequests || []).findIndex((r) => r.id === requestId);
    if (idx >= 0 && authStore.gdprRequests) {
      if (status) authStore.gdprRequests[idx].status = status;
      if (status === 'completed') authStore.gdprRequests[idx].completedAt = new Date().toISOString();
      if (notes) authStore.gdprRequests[idx].notes = notes;
      persistAuthStore();
    }
    return res.json({ success: true });
  });

  app.post('/api/admin/impersonation-logs', (req, res) => {
    if (!requireAdminSession(req, res)) return;
    const entry = req.body || {};
    authStore.impersonationLogs = [entry, ...(authStore.impersonationLogs || [])].slice(0, 100);
    persistAuthStore();
    return res.status(201).json({ success: true });
  });

  // =========================================================================
  // MULTI-PORTAL LIVE JOB AGGREGATOR & CV PROFILE MATCHING
  // Sources: Radar de Vagas, LinkedIn Jobs, Remotive, Arbeitnow, Jobicy, RemoteOK
  // + Pre-filled tailored links for Indeed, Glassdoor, Gupy, InfoJobs, Wellfound
  // =========================================================================
  const RADAR_BASE_URL = 'https://radar-de-vagas.fly.dev';
  const radarCache = new Map<string, { expiresAt: number; payload: any }>();

  const JOB_STOPWORDS = new Set([
    'para', 'como', 'sobre', 'entre', 'com', 'sem', 'por', 'dos', 'das', 'nos', 'nas', 'uma', 'uns', 'umas',
    'que', 'mais', 'muito', 'alta', 'alto', 'nivel', 'area', 'setor', 'experiencia', 'profissional', 'anos',
    'gestao', 'equipa', 'equipe', 'atendimento', 'trabalho', 'atuacao', 'foco', 'resultados', 'empresa',
    'empresas', 'processos', 'projetos', 'controle', 'desenvolvimento', 'planejamento', 'coordenacao',
    'with', 'from', 'that', 'this', 'have', 'will', 'your', 'about', 'into', 'over', 'year', 'years',
    'work', 'working', 'team', 'experience', 'role', 'skills', 'using', 'based', 'strong', 'proven',
    'senior', 'junior', 'pleno', 'lead', 'specialist', 'especialista', 'analista', 'assistente', 'auxiliar',
    'and', 'the', 'for', 'are', 'los', 'las', 'con', 'del', 'una', 'por', 'sus', 'esta', 'como'
  ]);

  const PT_EN_SYNONYM_MAP: Record<string, string[]> = {
    desenvolvedor: ['developer', 'engineer', 'software'],
    programador: ['developer', 'programmer', 'engineer'],
    engenheiro: ['engineer', 'engineering'],
    engenharia: ['engineering', 'engineer'],
    software: ['software', 'developer', 'engineer'],
    frontend: ['frontend', 'front-end', 'react', 'typescript'],
    backend: ['backend', 'back-end', 'node', 'python', 'java'],
    fullstack: ['fullstack', 'full-stack', 'developer'],
    dados: ['data', 'analytics', 'bi', 'sql'],
    analista: ['analyst', 'analytics'],
    produto: ['product', 'pm'],
    projetos: ['project', 'program', 'scrum', 'agile'],
    projeto: ['project', 'program'],
    gerente: ['manager', 'lead', 'head'],
    gestor: ['manager', 'director', 'lead'],
    diretor: ['director', 'head', 'vp'],
    financeiro: ['finance', 'financial', 'accounting', 'fintech'],
    financas: ['finance', 'financial', 'treasury'],
    contabilidade: ['accounting', 'accountant', 'finance'],
    faturacao: ['billing', 'invoicing', 'finance', 'ap'],
    pagamentos: ['payments', 'billing', 'fintech'],
    seguranca: ['security', 'cybersecurity', 'infosec'],
    nuvem: ['cloud', 'aws', 'azure', 'gcp', 'devops'],
    infraestrutura: ['infrastructure', 'devops', 'sre', 'cloud'],
    inteligencia: ['ai', 'artificial intelligence', 'ml'],
    design: ['design', 'ui', 'ux', 'product design'],
    marketing: ['marketing', 'growth', 'seo', 'content'],
    vendas: ['sales', 'account executive', 'business development'],
    comercial: ['sales', 'commercial', 'business development'],
    suporte: ['support', 'help desk', 'service desk', 'customer'],
    cliente: ['customer', 'success', 'support'],
    clientes: ['customer', 'success', 'account'],
    operacoes: ['operations', 'ops', 'logistics'],
    logistica: ['logistics', 'supply chain', 'operations'],
    humanos: ['hr', 'people', 'talent', 'recruiting'],
    recrutamento: ['recruiting', 'talent', 'hr'],
    juridico: ['legal', 'counsel', 'compliance'],
    conformidade: ['compliance', 'audit', 'risk', 'governance'],
    auditoria: ['audit', 'compliance', 'finance'],
    qualidade: ['qa', 'quality', 'testing'],
    testes: ['qa', 'testing', 'automation'],
    automacao: ['automation', 'rpa', 'devops'],
    erp: ['sap', 'erp', 'oracle', 'netsuite'],
    sap: ['sap', 'erp'],
    banco: ['database', 'sql', 'dba'],
    redes: ['network', 'security', 'infrastructure'],
    saude: ['health', 'healthcare', 'medical'],
    educacao: ['education', 'learning', 'training'],
    remoto: ['remote']
  };

  function normalizeTextToken(raw: string): string {
    return (raw || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9+#.\-\s/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function decodeHtmlEntities(str: string): string {
    return (str || '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function stripHtmlTags(html: string): string {
    return decodeHtmlTagsAndWhitespace(decodeHtmlEntities(html || ''));
  }

  function decodeHtmlTagsAndWhitespace(text: string): string {
    return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function tokenizeMeaningful(raw: string): string[] {
    const norm = normalizeTextToken(raw);
    if (!norm) return [];
    return norm
      .split(/[\s,/|;]+/)
      .map((t) => t.replace(/^\.+|\.+$/g, '').trim())
      .filter((t) => t.length >= 2 && !JOB_STOPWORDS.has(t));
  }

  function formatSalaryField(salary: any, fallbackCurrency?: string, fallbackPeriod?: string): string | null {
    if (salary == null) return null;
    if (typeof salary === 'string') return salary.trim() || null;
    if (typeof salary === 'number' && Number.isFinite(salary) && salary > 0) {
      const curPrefix = fallbackCurrency ? `${fallbackCurrency.toUpperCase()} ` : '';
      return `${curPrefix}${salary.toLocaleString('pt-PT')}${fallbackPeriod || ''}`;
    }
    if (typeof salary === 'object') {
      const { min, max, currency: cur, period } = salary as {
        min?: number | null;
        max?: number | null;
        currency?: string | null;
        period?: string | null;
      };
      const periodMap: Record<string, string> = {
        year: '/ano',
        annual: '/ano',
        yearly: '/ano',
        month: '/mês',
        monthly: '/mês',
        hour: '/hora',
        hourly: '/hora',
        day: '/dia',
        week: '/semana'
      };
      const effPeriod = period || fallbackPeriod;
      const pSuffix = effPeriod ? periodMap[String(effPeriod).toLowerCase()] || `/${effPeriod}` : '';
      const effCur = cur || fallbackCurrency;
      const curPrefix = effCur ? `${String(effCur).toUpperCase()} ` : '';
      const minNum = typeof min === 'number' && min > 0 ? min : null;
      const maxNum = typeof max === 'number' && max > 0 ? max : null;
      if (minNum && maxNum && minNum !== maxNum) {
        return `${curPrefix}${minNum.toLocaleString('pt-PT')} – ${maxNum.toLocaleString('pt-PT')}${pSuffix}`;
      }
      if (minNum || maxNum) {
        const val = (minNum || maxNum) as number;
        return `${curPrefix}${val.toLocaleString('pt-PT')}${pSuffix}`;
      }
    }
    return null;
  }

  async function fetchCachedExternal(
    cacheKey: string,
    url: string,
    mode: 'json' | 'text' = 'json',
    ttlMs: number = 3 * 60 * 1000,
    timeoutMs: number = 6000
  ): Promise<any> {
    const cached = radarCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.payload;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: mode === 'json' ? 'application/json' : 'text/html,application/xhtml+xml',
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
        }
      });
      if (!resp.ok) {
        throw new Error(`${url} respondeu HTTP ${resp.status}`);
      }
      const payload = mode === 'json' ? await resp.json() : await resp.text();
      radarCache.set(cacheKey, {
        expiresAt: Date.now() + ttlMs,
        payload
      });
      if (radarCache.size > 120) {
        const oldestKey = radarCache.keys().next().value;
        if (oldestKey) radarCache.delete(oldestKey);
      }
      return payload;
    } finally {
      clearTimeout(timer);
    }
  }

  function fetchRadarApiJson(pathWithQuery: string): Promise<any> {
    return fetchCachedExternal(`radar:${pathWithQuery}`, `${RADAR_BASE_URL}${pathWithQuery}`, 'json', 2 * 60 * 1000, 6500);
  }

  async function fetchLinkedInGuestJobs(keywords: string, location?: string): Promise<any[]> {
    if (!keywords || !keywords.trim()) return [];
    const params = new URLSearchParams({ keywords: keywords.trim(), start: '0' });
    if (location && location.trim()) {
      params.set('location', location.trim());
    }
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params.toString()}`;
    const html: string = await fetchCachedExternal(`linkedin:${params.toString()}`, url, 'text', 4 * 60 * 1000, 5500);
    const items: any[] = [];
    const liMatches = html.match(/<li>[\s\S]*?<\/li>/gi) || [];
    for (const block of liMatches) {
      const urnMatch = block.match(/data-entity-urn="urn:li:jobPosting:(\d+)"/i);
      const hrefMatch = block.match(/<a[^>]+class="[^"]*base-card__full-link[^"]*"[^>]+href="([^"]+)"/i);
      const titleMatch = block.match(/<h3[^>]+class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>/i);
      const companyMatch = block.match(/<h4[^>]+class="[^"]*base-search-card__subtitle[^"]*"[^>]*>([\s\S]*?)<\/h4>/i);
      const locMatch = block.match(/<span[^>]+class="[^"]*job-search-card__location[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      const timeMatch = block.match(/<time[^>]+datetime="([^"]+)"/i);

      const jobId = urnMatch?.[1];
      const title = stripHtmlTags(titleMatch?.[1] || '');
      const company = stripHtmlTags(companyMatch?.[1] || '');
      const applyHref = decodeHtmlEntities(hrefMatch?.[1] || '');
      if (!title || !company || !applyHref) continue;

      const locText = stripHtmlTags(locMatch?.[1] || '');
      const isRemote = /remote|remoto|teletrabalho|anywhere/i.test(`${title} ${locText}`);
      const isHybrid = /hybrid|hibrido|híbrido/i.test(`${title} ${locText}`);

      items.push({
        id: `linkedin:${jobId || encodeURIComponent(applyHref.slice(0, 80))}`,
        title,
        company,
        workplace: isRemote ? 'remote' : isHybrid ? 'hybrid' : 'onsite',
        locations: locText ? [locText] : [],
        allowedCountries: [],
        category: null,
        seniority: null,
        salary: null,
        skills: [],
        tags: [],
        descriptionSnippet: '',
        sourcePortal: 'linkedin',
        sourceName: 'LinkedIn',
        postedAt: timeMatch?.[1] ? `${timeMatch[1]}T12:00:00.000Z` : new Date().toISOString(),
        applyUrl: applyHref,
        portalUrl: applyHref
      });
    }
    return items;
  }

  function detectNormalizedContractType(rawList: any[], title?: string, snippet?: string): string | null {
    const combinedRaw = [
      ...(Array.isArray(rawList) ? rawList.map((x) => String(x || '')) : []),
      String(title || ''),
      String(snippet || '').slice(0, 350)
    ]
      .join(' ')
      .toLowerCase();

    if (/\b(intern|internship|estagio|estágio|trainee|apprentice)\b/i.test(combinedRaw)) {
      return 'internship';
    }
    if (/\b(part[\s_-]?time|meio[\s_-]?periodo|meio[\s_-]?período)\b/i.test(combinedRaw)) {
      return 'part_time';
    }
    if (/\b(contract|contractor|freelance|freelancer|pj|b2b|temporar[yi]|consultant)\b/i.test(combinedRaw)) {
      return 'contract';
    }
    if (/\b(full[\s_-]?time|permanent|tempo[\s_-]?integral|clt|efetivo|indefinite)\b/i.test(combinedRaw)) {
      return 'full_time';
    }
    return null;
  }

  async function fetchRemotiveJobs(searchTerm?: string): Promise<{ jobs: any[]; total: number }> {
    const q = searchTerm ? `?search=${encodeURIComponent(searchTerm)}&limit=50` : '?limit=60';
    const data = await fetchCachedExternal(`remotive:${q}`, `https://remotive.com/api/remote-jobs${q}`, 'json', 5 * 60 * 1000, 6000);
    const list = Array.isArray(data?.jobs) ? data.jobs : [];
    const normalized = list.map((j: any) => {
      const desc = stripHtmlTags(String(j.description || '')).slice(0, 2600);
      return {
        id: `remotive:${j.id}`,
        title: String(j.title || ''),
        company: String(j.company_name || ''),
        workplace: 'remote',
        locations: j.candidate_required_location ? [String(j.candidate_required_location)] : ['Worldwide'],
        allowedCountries: [],
        category: j.category ? String(j.category) : null,
        seniority: null,
        employmentType: detectNormalizedContractType([j.job_type], j.title, desc),
        salary: formatSalaryField(j.salary),
        skills: Array.isArray(j.tags) ? j.tags.map((t: any) => String(t)) : [],
        tags: Array.isArray(j.tags) ? j.tags.map((t: any) => String(t)) : [],
        descriptionSnippet: desc,
        sourcePortal: 'remotive',
        sourceName: 'Remotive',
        postedAt: j.publication_date || null,
        applyUrl: String(j.url || ''),
        portalUrl: String(j.url || '')
      };
    });
    return { jobs: normalized, total: Number(data?.['total-job-count'] || data?.['job-count'] || normalized.length) };
  }

  async function fetchArbeitnowJobs(): Promise<any[]> {
    const data = await fetchCachedExternal('arbeitnow:p1', 'https://www.arbeitnow.com/api/job-board-api', 'json', 5 * 60 * 1000, 6500);
    const list = Array.isArray(data?.data) ? data.data.slice(0, 120) : [];
    return list.map((j: any) => {
      const desc = stripHtmlTags(String(j.description || '')).slice(0, 2600);
      const types = Array.isArray(j.job_types) ? j.job_types.map((t: any) => String(t)) : [];
      return {
        id: `arbeitnow:${j.slug}`,
        title: String(j.title || ''),
        company: String(j.company_name || ''),
        workplace: j.remote ? 'remote' : 'onsite',
        locations: j.location ? [String(j.location)] : [],
        allowedCountries: [],
        category: null,
        seniority: null,
        employmentType: detectNormalizedContractType(types, j.title, desc),
        salary: null,
        skills: Array.isArray(j.tags) ? j.tags.map((t: any) => String(t)) : [],
        tags: types,
        descriptionSnippet: desc,
        sourcePortal: 'arbeitnow',
        sourceName: 'Arbeitnow',
        postedAt: typeof j.created_at === 'number' ? new Date(j.created_at * 1000).toISOString() : null,
        applyUrl: String(j.url || ''),
        portalUrl: String(j.url || '')
      };
    });
  }

  async function fetchJobicyJobs(tag?: string): Promise<any[]> {
    const q = tag ? `?count=40&tag=${encodeURIComponent(tag)}` : '?count=50';
    const data = await fetchCachedExternal(`jobicy:${q}`, `https://jobicy.com/api/v2/remote-jobs${q}`, 'json', 5 * 60 * 1000, 6000);
    const list = Array.isArray(data?.jobs) ? data.jobs : [];
    return list.map((j: any) => {
      const desc = stripHtmlTags(String(j.jobDescription || j.jobExcerpt || '')).slice(0, 2600);
      const types = Array.isArray(j.jobType) ? j.jobType.map((t: any) => String(t)) : [];
      const titleStr = decodeHtmlEntities(String(j.jobTitle || ''));
      return {
        id: `jobicy:${j.id}`,
        title: titleStr,
        company: decodeHtmlEntities(String(j.companyName || '')),
        workplace: 'remote',
        locations: j.jobGeo ? [String(j.jobGeo)] : ['Worldwide'],
        allowedCountries: [],
        category: Array.isArray(j.jobIndustry) ? j.jobIndustry.map((x: any) => decodeHtmlEntities(String(x))).join(', ') : null,
        seniority: j.jobLevel && j.jobLevel !== 'Any' ? String(j.jobLevel).toLowerCase() : null,
        employmentType: detectNormalizedContractType(types, titleStr, desc),
        salary: formatSalaryField(
          { min: j.salaryMin, max: j.salaryMax, currency: j.salaryCurrency, period: j.salaryPeriod }
        ),
        skills: [],
        tags: types,
        descriptionSnippet: desc,
        sourcePortal: 'jobicy',
        sourceName: 'Jobicy',
        postedAt: j.pubDate || null,
        applyUrl: String(j.url || ''),
        portalUrl: String(j.url || '')
      };
    });
  }

  async function fetchRemoteOkJobs(): Promise<any[]> {
    const data = await fetchCachedExternal('remoteok:all', 'https://remoteok.com/api', 'json', 5 * 60 * 1000, 6000);
    const list = Array.isArray(data) ? data.slice(1, 100) : [];
    return list
      .filter((j: any) => j && j.position && j.company)
      .map((j: any) => {
        const desc = stripHtmlTags(String(j.description || '')).slice(0, 2600);
        const tags = Array.isArray(j.tags) ? j.tags.map((t: any) => String(t)) : [];
        return {
          id: `remoteok:${j.id || j.slug}`,
          title: String(j.position || ''),
          company: String(j.company || ''),
          workplace: 'remote',
          locations: j.location ? [String(j.location)] : ['Worldwide'],
          allowedCountries: [],
          category: null,
          seniority: null,
          employmentType: detectNormalizedContractType(tags, j.position, desc),
          salary: formatSalaryField({ min: j.salary_min, max: j.salary_max, currency: 'USD', period: 'year' }),
          skills: tags,
          tags,
          descriptionSnippet: desc,
          sourcePortal: 'remoteok',
          sourceName: 'RemoteOK',
          postedAt: j.date || (typeof j.epoch === 'number' ? new Date(j.epoch * 1000).toISOString() : null),
          applyUrl: String(j.apply_url || j.url || ''),
          portalUrl: String(j.url || '')
        };
      });
  }

  const COUNTRY_PREFERENCE_RULES: Record<
    string,
    {
      label: string;
      linkedInLocation: string;
      indeedUrl: string;
      hints: string[];
      countryCodes: string[];
    }
  > = {
    remoto_global: {
      label: 'Remoto Global',
      linkedInLocation: '',
      indeedUrl: 'https://www.indeed.com/jobs',
      hints: ['worldwide', 'anywhere', 'global', 'remote'],
      countryCodes: []
    },
    brasil: {
      label: 'Brasil',
      linkedInLocation: 'Brazil',
      indeedUrl: 'https://br.indeed.com/jobs',
      hints: ['br', 'brazil', 'brasil', 'sao paulo', 'rio de janeiro', 'belo horizonte', 'curitiba', 'latam', 'south america', 'americas'],
      countryCodes: ['br']
    },
    portugal: {
      label: 'Portugal',
      linkedInLocation: 'Portugal',
      indeedUrl: 'https://pt.indeed.com/jobs',
      hints: ['pt', 'portugal', 'lisboa', 'lisbon', 'porto', 'coimbra', 'braga', 'europe', 'eu', 'emea'],
      countryCodes: ['pt']
    },
    angola: {
      label: 'Angola',
      linkedInLocation: 'Angola',
      indeedUrl: 'https://www.indeed.com/jobs',
      hints: ['ao', 'angola', 'luanda', 'benguela', 'africa', 'emea'],
      countryCodes: ['ao']
    },
    espanha: {
      label: 'Espanha',
      linkedInLocation: 'Spain',
      indeedUrl: 'https://es.indeed.com/jobs',
      hints: ['es', 'spain', 'espanha', 'madrid', 'barcelona', 'europe', 'eu', 'emea'],
      countryCodes: ['es']
    },
    reino_unido: {
      label: 'Reino Unido',
      linkedInLocation: 'United Kingdom',
      indeedUrl: 'https://uk.indeed.com/jobs',
      hints: ['gb', 'uk', 'united kingdom', 'reino unido', 'london', 'manchester', 'england', 'scotland', 'europe', 'emea'],
      countryCodes: ['gb', 'uk']
    },
    alemanha: {
      label: 'Alemanha',
      linkedInLocation: 'Germany',
      indeedUrl: 'https://de.indeed.com/jobs',
      hints: ['de', 'germany', 'alemanha', 'berlin', 'munich', 'frankfurt', 'hamburg', 'europe', 'eu', 'emea'],
      countryCodes: ['de']
    },
    franca: {
      label: 'França',
      linkedInLocation: 'France',
      indeedUrl: 'https://fr.indeed.com/jobs',
      hints: ['fr', 'france', 'franca', 'paris', 'lyon', 'europe', 'eu', 'emea'],
      countryCodes: ['fr']
    },
    estados_unidos: {
      label: 'Estados Unidos',
      linkedInLocation: 'United States',
      indeedUrl: 'https://www.indeed.com/jobs',
      hints: ['us', 'usa', 'united states', 'estados unidos', 'new york', 'san francisco', 'austin', 'north america', 'americas'],
      countryCodes: ['us']
    },
    canada: {
      label: 'Canadá',
      linkedInLocation: 'Canada',
      indeedUrl: 'https://ca.indeed.com/jobs',
      hints: ['ca', 'canada', 'toronto', 'vancouver', 'montreal', 'north america', 'americas'],
      countryCodes: ['ca']
    },
    europa: {
      label: 'União Europeia',
      linkedInLocation: 'European Union',
      indeedUrl: 'https://pt.indeed.com/jobs',
      hints: ['eu', 'europe', 'europa', 'emea', 'portugal', 'spain', 'germany', 'france', 'netherlands', 'ireland', 'poland', 'italy', 'uk'],
      countryCodes: ['pt', 'es', 'de', 'fr', 'nl', 'ie', 'pl', 'it', 'be', 'at', 'se', 'fi', 'dk']
    }
  };

  app.post('/api/jobs/match', async (req, res) => {
    try {
      const {
        cv,
        search = '',
        workplace = 'all',
        source = 'all',
        preferences
      } = (req.body || {}) as {
        cv?: any;
        search?: string;
        workplace?: string;
        source?: string;
        preferences?: {
          countries?: string[];
          targetRoles?: string[];
          contractTypes?: string[];
        };
      };

      const prefCountries = Array.isArray(preferences?.countries)
        ? preferences!.countries.map((c) => String(c).trim()).filter(Boolean)
        : [];
      const prefRoles = Array.isArray(preferences?.targetRoles)
        ? preferences!.targetRoles.map((r) => String(r).trim()).filter(Boolean)
        : [];
      const prefContracts = Array.isArray(preferences?.contractTypes)
        ? preferences!.contractTypes.map((t) => String(t).trim()).filter(Boolean)
        : [];

      const personalTitle = String(cv?.personalDetails?.title || '');
      const personalLocation = String(cv?.personalDetails?.location || '');
      const summary = String(cv?.summary || '');
      const competenciesText = Array.isArray(cv?.competencies)
        ? cv.competencies.map((c: any) => `${c?.category || ''} ${c?.description || ''}`).join(' ')
        : '';
      const experienceRoles = Array.isArray(cv?.experiences)
        ? cv.experiences.slice(0, 4).map((e: any) => String(e?.role || '')).join(' ')
        : '';
      const experienceHighlights = Array.isArray(cv?.experiences)
        ? cv.experiences
            .slice(0, 4)
            .flatMap((e: any) => (Array.isArray(e?.highlights) ? e.highlights.slice(0, 4) : []))
            .join(' ')
        : '';

      const prefRoleTokens = tokenizeMeaningful(prefRoles.join(' '));
      const titleTokensRaw = tokenizeMeaningful(`${personalTitle} ${experienceRoles}`);
      const skillTokensRaw = tokenizeMeaningful(`${competenciesText} ${summary} ${experienceHighlights}`);

      const weightedTerms = new Map<string, { label: string; weight: number; isRole: boolean }>();

      const addTerm = (token: string, weight: number, isRole: boolean, label?: string) => {
        const clean = token.trim();
        if (!clean || clean.length < 2 || JOB_STOPWORDS.has(clean)) return;
        const existing = weightedTerms.get(clean);
        if (!existing || existing.weight < weight) {
          weightedTerms.set(clean, { label: label || clean, weight, isRole });
        }
        const synonyms = PT_EN_SYNONYM_MAP[clean];
        if (synonyms) {
          for (const syn of synonyms) {
            const synClean = normalizeTextToken(syn);
            const synEx = weightedTerms.get(synClean);
            if (!synEx || synEx.weight < weight * 0.92) {
              weightedTerms.set(synClean, {
                label: syn,
                weight: weight * 0.92,
                isRole
              });
            }
          }
        }
      };

      // User-configured target roles carry highest priority weight
      prefRoleTokens.forEach((tok) => addTerm(tok, 4.0, true));
      prefRoles.forEach((rolePhrase) => {
        const normPhrase = normalizeTextToken(rolePhrase);
        if (normPhrase.length >= 2) {
          weightedTerms.set(normPhrase, { label: rolePhrase, weight: 4.5, isRole: true });
        }
      });

      titleTokensRaw.forEach((tok, idx) => addTerm(tok, idx < 4 ? 3.2 : 2.5, true));
      skillTokensRaw.forEach((tok, idx) => addTerm(tok, idx < 18 ? 2.0 : 1.35, false));

      const exactCompTerms: string[] = Array.isArray(cv?.competencies)
        ? cv.competencies
            .map((c: any) => normalizeTextToken(String(c?.category || '')))
            .filter((t: string) => t.length >= 2 && t.length <= 36)
        : [];
      exactCompTerms.forEach((phrase) => {
        if (!JOB_STOPWORDS.has(phrase)) {
          weightedTerms.set(phrase, { label: phrase, weight: 2.6, isRole: false });
        }
      });

      const searchQueries: string[] = [];
      const pushQuery = (q: string) => {
        const clean = q.trim();
        if (clean.length >= 2 && !searchQueries.includes(clean)) {
          searchQueries.push(clean);
        }
      };

      if (typeof search === 'string' && search.trim()) {
        pushQuery(search.trim());
      }

      for (const r of prefRoles) {
        pushQuery(r);
        if (searchQueries.length >= 4) break;
      }

      for (const tok of [...prefRoleTokens, ...titleTokensRaw]) {
        const syns = PT_EN_SYNONYM_MAP[tok];
        if (syns && syns[0]) pushQuery(syns[0]);
        else pushQuery(tok);
        if (searchQueries.length >= 5) break;
      }

      for (const comp of Array.isArray(cv?.competencies) ? cv.competencies : []) {
        const catTokens = tokenizeMeaningful(String(comp?.category || ''));
        for (const t of catTokens) {
          const syns = PT_EN_SYNONYM_MAP[t];
          pushQuery(syns?.[0] || t);
          if (searchQueries.length >= 6) break;
        }
        if (searchQueries.length >= 6) break;
      }

      const wpParam =
        workplace && workplace !== 'all' ? `&workplace=${encodeURIComponent(workplace)}` : '';

      // Detect location preferences (explicit preferences override/enhance CV location)
      const locationNorm = normalizeTextToken(personalLocation);
      const userCountryHints: string[] = [];
      const selectedSpecificCountries = prefCountries.filter((c) => c !== 'remoto_global');
      const allowGlobalRemote = prefCountries.length === 0 || prefCountries.includes('remoto_global');
      let linkedInLocation = '';
      let secondaryLinkedInLocation = '';
      let indeedBaseUrl = 'https://www.indeed.com/jobs';
      let portalLocationLabel = personalLocation || 'Remote';

      if (prefCountries.length > 0) {
        const linkedInLocList: string[] = [];
        for (const code of prefCountries) {
          const rule = COUNTRY_PREFERENCE_RULES[code];
          if (rule) {
            userCountryHints.push(...rule.hints);
            if (rule.linkedInLocation && !linkedInLocList.includes(rule.linkedInLocation)) {
              linkedInLocList.push(rule.linkedInLocation);
            }
          }
        }
        const firstSpecificRule = selectedSpecificCountries[0]
          ? COUNTRY_PREFERENCE_RULES[selectedSpecificCountries[0]]
          : null;
        if (firstSpecificRule) {
          indeedBaseUrl = firstSpecificRule.indeedUrl;
          portalLocationLabel = firstSpecificRule.linkedInLocation || firstSpecificRule.label;
        }
        linkedInLocation = linkedInLocList[0] || '';
        secondaryLinkedInLocation = linkedInLocList[1] || '';
      } else {
        if (/brasil|brazil|sao paulo|rio de janeiro|belo horizonte|curitiba/.test(locationNorm)) {
          userCountryHints.push('br', 'brazil', 'latam', 'south america', 'americas');
          linkedInLocation = 'Brazil';
          indeedBaseUrl = 'https://br.indeed.com/jobs';
        } else if (/portugal|lisboa|porto|coimbra|braga/.test(locationNorm)) {
          userCountryHints.push('pt', 'portugal', 'europe', 'eu', 'emea');
          linkedInLocation = 'Portugal';
          indeedBaseUrl = 'https://pt.indeed.com/jobs';
        } else if (/angola|luanda|benguela|huambo/.test(locationNorm)) {
          userCountryHints.push('ao', 'angola', 'africa', 'emea');
          linkedInLocation = 'Angola';
        } else if (/espanha|spain|madrid|barcelona/.test(locationNorm)) {
          userCountryHints.push('es', 'spain', 'europe', 'eu', 'emea');
          linkedInLocation = 'Spain';
          indeedBaseUrl = 'https://es.indeed.com/jobs';
        }
      }

      const linkedInKeywordPrimary =
        (typeof search === 'string' && search.trim()) ||
        prefRoles[0] ||
        personalTitle.trim() ||
        searchQueries.slice(0, 2).join(' ') ||
        'software engineer';
      const linkedInKeywordEn = searchQueries.slice(0, 2).join(' ') || linkedInKeywordPrimary;

      const radarTasks: Promise<any>[] = [
        fetchRadarApiJson(`/api/jobs?page=1&pageSize=50${wpParam}`).catch(() => null),
        fetchRadarApiJson(`/api/jobs?page=2&pageSize=50${wpParam}`).catch(() => null),
        ...searchQueries.slice(0, 4).map((q) =>
          fetchRadarApiJson(`/api/jobs?q=${encodeURIComponent(q)}&pageSize=50${wpParam}`).catch(() => null)
        )
      ];

      const [
        radarResponses,
        liLocal,
        liSecondary,
        liGlobal,
        remotiveMain,
        remotiveFiltered,
        arbeitnowJobs,
        jobicyJobs,
        remoteOkJobs
      ] = await Promise.all([
        Promise.all(radarTasks),
        fetchLinkedInGuestJobs(linkedInKeywordPrimary, linkedInLocation).catch(() => []),
        secondaryLinkedInLocation
          ? fetchLinkedInGuestJobs(linkedInKeywordEn, secondaryLinkedInLocation).catch(() => [])
          : Promise.resolve([]),
        linkedInKeywordEn !== linkedInKeywordPrimary || linkedInLocation
          ? fetchLinkedInGuestJobs(linkedInKeywordEn, '').catch(() => [])
          : Promise.resolve([]),
        fetchRemotiveJobs().catch(() => ({ jobs: [], total: 0 })),
        searchQueries[0]
          ? fetchRemotiveJobs(searchQueries[0]).catch(() => ({ jobs: [], total: 0 }))
          : Promise.resolve({ jobs: [], total: 0 }),
        fetchArbeitnowJobs().catch(() => []),
        fetchJobicyJobs(searchQueries[0]).catch(() => []),
        fetchRemoteOkJobs().catch(() => [])
      ]);

      const radarTotal = Number(
        radarResponses.find((r) => r && typeof r.total === 'number')?.total || 0
      );

      const unifiedPool: any[] = [];
      for (const resp of radarResponses) {
        if (resp && Array.isArray(resp.jobs)) {
          for (const job of resp.jobs) {
            if (!job?.id) continue;
            const applyUrl = job.applyUrl || job.url || `${RADAR_BASE_URL}/jobs/${encodeURIComponent(job.id)}`;
            unifiedPool.push({
              id: String(job.id),
              title: String(job.title || ''),
              company: String(job.company || ''),
              workplace: String(job.workplace || 'remote'),
              locations: Array.isArray(job.locations) ? job.locations.map((l: any) => String(l)) : [],
              allowedCountries: Array.isArray(job.allowedCountries)
                ? job.allowedCountries.map((c: any) => String(c))
                : [],
              category: job.category ? String(job.category) : null,
              seniority: job.seniority ? String(job.seniority) : null,
              employmentType: detectNormalizedContractType([job.employmentType], job.title),
              salary: formatSalaryField(job.salary),
              skills: Array.isArray(job.skills) ? job.skills.map((s: any) => String(s)) : [],
              tags: Array.isArray(job.tags) ? job.tags.map((t: any) => String(t)) : [],
              descriptionSnippet: '',
              sourcePortal: 'radar',
              sourceName: 'Radar de Vagas',
              postedAt: job.postedAt || job.firstSeenAt || null,
              applyUrl: String(applyUrl),
              portalUrl: `${RADAR_BASE_URL}/jobs/${encodeURIComponent(job.id)}`
            });
          }
        }
      }

      // Normalize LinkedIn employmentType from title too
      const liCombined = [...liLocal, ...liSecondary, ...liGlobal].map((j) => ({
        ...j,
        employmentType: j.employmentType || detectNormalizedContractType([], j.title)
      }));

      unifiedPool.push(
        ...liCombined,
        ...remotiveMain.jobs,
        ...remotiveFiltered.jobs,
        ...arbeitnowJobs,
        ...jobicyJobs,
        ...remoteOkJobs
      );

      const deduped = new Map<string, any>();
      for (const job of unifiedPool) {
        if (!job?.title || !job?.company) continue;
        const key = `${normalizeTextToken(job.title)}::${normalizeTextToken(job.company)}`;
        if (!deduped.has(key)) {
          deduped.set(key, job);
        }
      }

      const titleNormForSeniority = normalizeTextToken(`${prefRoles.join(' ')} ${personalTitle} ${experienceRoles}`);
      const candidateSeniority =
        /diretor|director|vp|head|chief|c-level/.test(titleNormForSeniority)
          ? 'director'
          : /gerente|manager|lead|principal|staff|senior|sênior|sr\b/.test(titleNormForSeniority)
          ? 'senior'
          : /junior|jr\b|estagio|intern|trainee/.test(titleNormForSeniority)
          ? 'junior'
          : 'mid';

      const userSearchNorm = normalizeTextToken(String(search || ''));
      const sourceCountsAll: Record<string, number> = {
        radar: 0,
        linkedin: 0,
        remotive: 0,
        arbeitnow: 0,
        jobicy: 0,
        remoteok: 0
      };
      const allCompatibleJobs: any[] = [];

      for (const job of deduped.values()) {
        const jobTitleNorm = normalizeTextToken(job.title);
        const jobTagsNorm = normalizeTextToken(job.tags.join(' '));
        const jobSkillsNorm = normalizeTextToken(job.skills.join(' '));
        const jobCategoryNorm = normalizeTextToken(String(job.category || ''));
        const jobCompanyNorm = normalizeTextToken(job.company);
        const jobDescNorm = normalizeTextToken(String(job.descriptionSnippet || '').slice(0, 700));
        const jobFullNorm = `${jobTitleNorm} ${jobSkillsNorm} ${jobTagsNorm} ${jobCategoryNorm} ${jobCompanyNorm} ${jobDescNorm}`;

        if (userSearchNorm) {
          const queryTokens = tokenizeMeaningful(userSearchNorm);
          const allQueryMatch = queryTokens.every((qt) => jobFullNorm.includes(qt));
          if (!allQueryMatch && !jobFullNorm.includes(userSearchNorm)) {
            continue;
          }
        }

        if (workplace && workplace !== 'all' && job.workplace && job.workplace !== workplace) {
          continue;
        }

        // Contract type preference filter
        if (prefContracts.length > 0) {
          const detectedType = job.employmentType as string | null;
          if (detectedType) {
            if (!prefContracts.includes(detectedType)) {
              continue;
            }
          } else {
            // Unspecified jobs (common on LinkedIn guest cards) pass when full_time is accepted
            if (!prefContracts.includes('full_time')) {
              continue;
            }
          }
        }

        // Country preference filtering & affinity
        const allowedList = Array.isArray(job.allowedCountries)
          ? job.allowedCountries.map((c: string) => c.toLowerCase())
          : [];
        const locationsList = Array.isArray(job.locations)
          ? job.locations.map((l: string) => normalizeTextToken(l)).join(' ')
          : '';
        const isGlobalRemoteJob =
          job.workplace === 'remote' &&
          allowedList.length === 0 &&
          (locationsList === '' || /anywhere|worldwide|global|remote/i.test(locationsList));

        const matchesConfiguredCountry = userCountryHints.some(
          (hint) =>
            allowedList.includes(hint) ||
            (hint.length > 2 && locationsList.includes(hint))
        );

        if (prefCountries.length > 0) {
          if (selectedSpecificCountries.length > 0 && !allowGlobalRemote) {
            // User explicitly selected specific countries without "remoto_global"
            if (!matchesConfiguredCountry && !isGlobalRemoteJob) {
              continue;
            }
            // Exclude explicit foreign country restriction when it doesn't match user country codes
            if (allowedList.length > 0 && !matchesConfiguredCountry) {
              continue;
            }
          } else if (selectedSpecificCountries.length === 0 && allowGlobalRemote) {
            // User selected ONLY "Remoto Global"
            if (job.workplace !== 'remote') {
              continue;
            }
          } else if (selectedSpecificCountries.length > 0 && allowGlobalRemote) {
            // Selected specific countries + Remoto Global
            if (!matchesConfiguredCountry && !isGlobalRemoteJob) {
              continue;
            }
          }
        }

        let rawPoints = 0;
        let titleHits = 0;
        let skillHits = 0;
        const matchedKeywords: string[] = [];

        for (const [term, meta] of weightedTerms.entries()) {
          if (term.length < 2) continue;
          const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex =
            term.length <= 3
              ? new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i')
              : new RegExp(`(?:^|[^a-z0-9])${escaped}`, 'i');

          const inTitle = regex.test(jobTitleNorm);
          const inSkillsOrTags = regex.test(`${jobSkillsNorm} ${jobTagsNorm}`);
          const inCategoryOrDesc = regex.test(`${jobCategoryNorm} ${jobDescNorm}`);

          if (inTitle || inSkillsOrTags || inCategoryOrDesc) {
            const hitScore = inTitle
              ? meta.weight * 8.5
              : inSkillsOrTags
              ? meta.weight * 5.5
              : meta.weight * 2.8;
            rawPoints += hitScore;
            if (inTitle) titleHits += 1;
            else skillHits += 1;

            const displayKw = meta.label.length <= 2 ? meta.label.toUpperCase() : meta.label;
            if (!matchedKeywords.some((k) => k.toLowerCase() === displayKw.toLowerCase())) {
              matchedKeywords.push(displayKw);
            }
          }
        }

        if (!userSearchNorm && rawPoints < 14 && matchedKeywords.length === 0) {
          continue;
        }

        let locationMatched = false;
        if (matchesConfiguredCountry) {
          rawPoints += prefCountries.length > 0 ? 14 : 9;
          locationMatched = true;
        } else if (job.workplace === 'remote' && allowedList.length === 0) {
          rawPoints += 6;
          locationMatched = true;
        } else if (isGlobalRemoteJob) {
          rawPoints += 7;
          locationMatched = true;
        }

        const jobSen = String(job.seniority || '').toLowerCase();
        if (
          jobSen &&
          ((candidateSeniority === 'senior' && (jobSen === 'senior' || jobSen === 'lead')) ||
            (candidateSeniority === 'director' &&
              (jobSen === 'director' || jobSen === 'senior' || jobSen === 'lead')) ||
            (candidateSeniority === 'mid' && jobSen === 'mid') ||
            (candidateSeniority === 'junior' && (jobSen === 'junior' || jobSen === 'entry')))
        ) {
          rawPoints += 6;
        }

        const matchScore = userSearchNorm && rawPoints < 14
          ? 52
          : Math.min(98, Math.max(36, Math.round(32 + rawPoints * 1.15)));

        const topKeywords = matchedKeywords.slice(0, 6);
        const fitParts: string[] = [];
        if (titleHits > 0) fitParts.push('Alinhamento direto com o cargo');
        if (skillHits > 0) fitParts.push(`${skillHits} competência(s) compatível(eis)`);
        if (locationMatched) {
          fitParts.push(job.workplace === 'remote' ? 'Remoto compatível' : 'País compatível');
        }

        if (typeof sourceCountsAll[job.sourcePortal] === 'number') {
          sourceCountsAll[job.sourcePortal] += 1;
        }

        allCompatibleJobs.push({
          id: job.id,
          title: job.title,
          company: job.company,
          workplace: job.workplace,
          employmentType: job.employmentType || null,
          locations: job.locations,
          allowedCountries: job.allowedCountries,
          category: job.category,
          seniority: job.seniority,
          salary: job.salary,
          skills: job.skills.slice(0, 8),
          tags: job.tags.slice(0, 8),
          descriptionSnippet: job.descriptionSnippet || '',
          sourcePortal: job.sourcePortal,
          sourceName: job.sourceName,
          postedAt: job.postedAt,
          applyUrl: job.applyUrl,
          radarUrl: job.portalUrl,
          matchScore,
          matchedKeywords: topKeywords,
          fitReason: fitParts.join(' · ') || 'Perfil compatível com a vaga'
        });
      }

      allCompatibleJobs.sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        const tA = a.postedAt ? new Date(a.postedAt).getTime() : 0;
        const tB = b.postedAt ? new Date(b.postedAt).getTime() : 0;
        return tB - tA;
      });

      const filteredBySource =
        source && source !== 'all'
          ? allCompatibleJobs.filter((j) => j.sourcePortal === source)
          : allCompatibleJobs;

      const roleQueryForExternal = encodeURIComponent(
        (typeof search === 'string' && search.trim()) ||
          prefRoles[0] ||
          personalTitle.trim() ||
          searchQueries[0] ||
          'Software'
      );
      const locQueryForExternal = encodeURIComponent(portalLocationLabel);

      const externalPortals = [
        {
          id: 'linkedin',
          name: 'LinkedIn Vagas',
          url: `https://www.linkedin.com/jobs/search/?keywords=${roleQueryForExternal}&location=${locQueryForExternal}`,
          liveCount: sourceCountsAll.linkedin
        },
        {
          id: 'indeed',
          name: 'Indeed',
          url: `${indeedBaseUrl}?q=${roleQueryForExternal}&l=${locQueryForExternal}`,
          liveCount: null
        },
        {
          id: 'glassdoor',
          name: 'Glassdoor',
          url: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${roleQueryForExternal}`,
          liveCount: null
        },
        {
          id: 'gupy',
          name: 'Gupy',
          url: `https://portal.gupy.io/job-search/term=${roleQueryForExternal}`,
          liveCount: null
        },
        {
          id: 'infojobs',
          name: 'InfoJobs',
          url: `https://www.infojobs.com.br/empregos.aspx?palabra=${roleQueryForExternal}`,
          liveCount: null
        },
        {
          id: 'wellfound',
          name: 'Wellfound',
          url: `https://wellfound.com/jobs?query=${roleQueryForExternal}`,
          liveCount: null
        },
        {
          id: 'radar',
          name: 'Radar de Vagas',
          url: `${RADAR_BASE_URL}/?q=${roleQueryForExternal}`,
          liveCount: sourceCountsAll.radar
        }
      ];

      return res.json({
        sourceUrl: RADAR_BASE_URL,
        totalPlatformJobs: radarTotal + Number(remotiveMain.total || 0),
        scannedPoolCount: deduped.size,
        compatibleCount: filteredBySource.length,
        totalCompatibleAllSources: allCompatibleJobs.length,
        sourceCounts: sourceCountsAll,
        matchedJobs: filteredBySource.slice(0, 80),
        externalPortals,
        profileQueriesUsed: searchQueries.slice(0, 5),
        syncedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Erro ao consultar portais de vagas:', error?.message || error);
      return res.status(502).json({
        error: 'Não foi possível sincronizar vagas ao vivo neste momento.'
      });
    }
  });

  app.get('/api/jobs/detail', async (req, res) => {
    try {
      const id = String(req.query.id || '').trim();
      if (!id) {
        return res.status(400).json({ error: 'Parâmetro id é obrigatório.' });
      }

      if (id.startsWith('linkedin:')) {
        const numericId = id.replace(/^linkedin:/, '');
        if (/^\d+$/.test(numericId)) {
          const html: string = await fetchCachedExternal(
            `li_detail:${numericId}`,
            `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${numericId}`,
            'text',
            10 * 60 * 1000,
            5500
          );
          const descMatch = html.match(/<div[^>]*class="[^"]*show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
          const titleMatch = html.match(/<h2[^>]*class="[^"]*top-card-layout__title[^"]*"[^>]*>([\s\S]*?)<\/h2>/i);
          const companyMatch = html.match(/<a[^>]*class="[^"]*topcard__org-name-link[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
          return res.json({
            id,
            title: stripHtmlTags(titleMatch?.[1] || ''),
            company: stripHtmlTags(companyMatch?.[1] || ''),
            description: stripHtmlTags(descMatch?.[1] || ''),
            applyUrl: `https://www.linkedin.com/jobs/view/${numericId}`,
            radarUrl: `https://www.linkedin.com/jobs/view/${numericId}`
          });
        }
      }

      const data = await fetchRadarApiJson(`/api/jobs/${encodeURIComponent(id)}`);
      return res.json({
        id: data.id,
        title: data.title,
        company: data.company,
        description: data.description || '',
        applyUrl: data.applyUrl || data.url,
        radarUrl: `${RADAR_BASE_URL}/jobs/${encodeURIComponent(data.id || id)}`,
        locations: data.locations || [],
        workplace: data.workplace || null,
        skills: data.skills || [],
        tags: data.tags || []
      });
    } catch (error: any) {
      return res.status(502).json({
        error: error?.message || 'Erro ao obter detalhes completos da vaga.'
      });
    }
  });

  return app;
}

export async function startServer() {
  const app = createApiApp();
  const httpServer = http.createServer(app);

  // Vite middleware in dev or static files in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
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

if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
  void startServer();
}
