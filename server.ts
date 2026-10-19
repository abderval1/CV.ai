import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini API client if key is available
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  }

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(apiKey),
      timestamp: new Date().toISOString()
    });
  });

  // AI Tailor CV endpoint
  app.post('/api/tailor-cv', async (req, res) => {
    try {
      const { cvData, jobDescription, targetStandard } = req.body;

      if (!cvData) {
        return res.status(400).json({ error: 'Dados do currículo não fornecidos.' });
      }

      if (!ai) {
        return res.status(503).json({
          error: 'Chave GEMINI_API_KEY não configurada no servidor. O modo inteligente local continuará funcionando.',
          fallback: true
        });
      }

      const prompt = `
Você é um consultor executivo sênior de Recursos Humanos especializado em contratações para a Organização das Nações Unidas (ONU - WFP, FAO, PNUD), União Europeia (Camões, I.P., Expertise France) e Organizações Internacionais de Desenvolvimento e Tecnologia.

Sua missão é reescrever e otimizar estrategicamente os componentes deste currículo para maximizar a taxa de aprovação no sistema de triagem ATS e impressionar o painel de recrutadores da vaga fornecida.

PADRÃO SOLICITADO: ${targetStandard || 'ONU / União Europeia (Padrão António Paulo)'}

DADOS ATUAIS DO CANDIDATO:
${JSON.stringify(cvData, null, 2)}

DESCRIÇÃO DA VAGA (Termos de Referência / Requisitos):
${jobDescription || 'Vaga executiva na área de MEAL (Monitoria, Avaliação, Prestação de Contas e Aprendizagem) e Sistemas de Informação para Projetos de Desenvolvimento.'}

INSTRUÇÕES ESTRITAS:
1. Resumo Executivo (Summary): Reescreva em tom institucional sênior de 4-6 linhas, destacando anos de experiência, liderança em sistemas de dados, padrões RBM/OECD-DAC e impacto comprovado com parceiros de alto nível.
2. Competências-chave (Core Competencies): Retorne de 5 a 6 categorias de competências essenciais, cada uma com um título forte e descrição com palavras-chave exatas da vaga.
3. Experiências Profissionais: Para cada cargo, aprimore cada ponto (bullet point) aplicando a fórmula do Google/ONU (Ação de Alto Impacto + Contexto/Ferramenta + Métrica/Resultado quantificável). Mantenha as empresas, cargos e datas fiéis aos fatos, mas eleve a formulação técnica.
4. Análise de Palavras-chave: Identifique as 8 palavras-chave mais críticas da vaga presentes e ausentes.

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
      "donor": "Financiador se houver",
      "highlights": ["bullet 1 otimizado", "bullet 2 otimizado"]
    }
  ],
  "atsInsights": {
    "scoreEstimate": 92,
    "matchingKeywords": ["palavra1", "palavra2"],
    "missingKeywords": ["palavra3", "palavra4"],
    "recommendations": ["recomendação 1", "recomendação 2"]
  }
}
      `.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.25,
        }
      });

      const responseText = response.text?.trim() || '{}';
      const parsedData = JSON.parse(responseText);
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
      const { rawCandidateInfo, jobDescription, candidateLinkedIn, targetStandard } = req.body;

      if (!rawCandidateInfo && !candidateLinkedIn) {
        return res.status(400).json({ error: 'Nenhuma informação do candidato foi fornecida.' });
      }

      if (!ai) {
        return res.status(503).json({
          error: 'Chave GEMINI_API_KEY não configurada no servidor.',
          fallback: true
        });
      }

      const prompt = `
Você é o mais conceituado consultor executivo de Recursos Humanos e Recrutamento Internacional para Nações Unidas (ONU), União Europeia, ONGs Internacionais e Multinacionais de Tecnologia.

O candidato enviou textos brutos, notas de carreira, projetos, documentos ou histórico do LinkedIn.
Em outro campo, foi fornecida a descrição da vaga pretendida (Termos de Referência / Requisitos).

SUA MISSÃO:
Analisar minuciosamente os dados do candidato e GERAR UM CURRÍCULO ESTRUTURADO COMPLETO, estrategicamente adaptado e otimizado para a vaga fornecida.
Padrão Institucional Alvo: ${targetStandard || 'ONU / União Europeia (Padrão António Paulo)'}.

DADOS BRUTOS DO CANDIDATO (Textos, Documentos, Histórico, LinkedIn):
${rawCandidateInfo || ''}
${candidateLinkedIn ? `Perfil / Link do LinkedIn: ${candidateLinkedIn}` : ''}

DESCRIÇÃO DA VAGA / TERMOS DE REFERÊNCIA (TdR):
${jobDescription || 'Vaga executiva na área de MEAL, Gestão de Sistemas de Informação ou Engenharia de Dados.'}

DIRETRIZES DE FORMULAÇÃO DE ALTO IMPACTO:
1. Extraia o Nome Completo, Título Executivo (adaptado à vaga), Localização, Telefone, E-mail e LinkedIn. Se faltar algum dado de contacto, deduza ou mantenha o que existir.
2. Resumo Executivo (Summary): Escreva um resumo sênior de 4-6 linhas destacando anos de experiência, liderança técnica, padrões internacionais e impacto comprovado alinhado aos objetivos da vaga.
3. Competências Principais (Core Competencies): Extraia de 5 a 6 categorias de competências essenciais, cada uma com título forte e descrição com palavras-chave exatas da vaga.
4. Experiência Profissional: Organize em ordem cronológica reversa. Para cada cargo, estruture a Organização, Cargo, Período, Financiador/Projeto (se aplicável) e crie bullet points de alto impacto usando a fórmula do Google/ONU: Ação Forte + Contexto/Ferramentas + Métrica/Resultado quantificável (redução de erros, prazos, número de utilizadores, orçamentos, etc.). Inclua links de plataformas em produção se citados.
5. Formação Académica (Education): Liste graus, instituições e anos.
6. Formação Especializada & Idiomas: Inclua metodologias, softwares e fluência nos idiomas relevantes.
7. Referências: Estruture referências formais com Nome, Entidade/Cargo e Contacto.

Responda ESTRITAMENTE em formato JSON com esta estrutura exata:
{
  "personalDetails": {
    "name": "Nome Completo",
    "title": "Título Profissional Executivo",
    "location": "Cidade, País",
    "phone": "+244 ...",
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
      "donor": "Financiador se houver",
      "highlights": ["Ponto de impacto 1", "Ponto de impacto 2"]
    }
  ],
  "educations": [
    { "id": "edu-1", "degree": "Grau", "institution": "Universidade", "period": "Anos", "gpaOrHonors": "Honras se houver" }
  ],
  "trainings": ["Formação 1", "Formação 2"],
  "languages": [
    { "language": "Idioma", "level": "Nível de proficiência" }
  ],
  "references": [
    { "id": "ref-1", "name": "Nome", "institutionAndPosition": "Entidade e Cargo", "contact": "email ou telefone" }
  ],
  "atsInsights": {
    "scoreEstimate": 94,
    "matchedKeywords": ["palavra1", "palavra2"],
    "missingKeywords": ["palavra3"],
    "recommendations": ["recomendação 1", "recomendação 2"]
  }
}
      `.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.25
        }
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.error('Erro na rota /api/generate-from-raw:', err);
      return res.status(500).json({ error: err.message, fallback: true });
    }
  });

  // AI Cover Letter endpoint with language support
  app.post('/api/cover-letter', async (req, res) => {
    try {
      const { cvData, jobDescription, recipientName, organizationName, language } = req.body;

      if (!ai) {
        return res.status(503).json({
          error: 'Chave GEMINI_API_KEY não configurada no servidor.',
          fallback: true
        });
      }

      const prompt = `
Você é um consultor executivo sênior de Recursos Humanos especializado em candidaturas diplomáticas e de alto nível para Organizações Internacionais (ONU, União Europeia, Expertise France, Camões I.P., ONGs Globais).
Escreva uma Carta de Apresentação / Motivação Estratégica formal no idioma: ${language || 'English (Inglês)'}.

DADOS DO CANDIDATO:
Nome: ${cvData?.name || 'Agostinho do Rosário'}
Título: ${cvData?.title || 'Senior MEAL & Information Systems Specialist'}
Contactos: ${cvData?.email || ''} | ${cvData?.phone || ''} | ${cvData?.location || ''} | ${cvData?.linkedin || ''}
Organização Alvo: ${organizationName || 'Selection Committee / Human Resources Directorate'}
Destinatário: ${recipientName || 'Dear Members of the Selection Committee'}
Portal em Produção Relevante: https://sgi-fresancamoes.com/ (Plataforma MEAL desenvolvida para Camões, I.P. / União Europeia)

TERMOS DE REFERÊNCIA / DESCRIÇÃO DA VAGA:
${jobDescription || 'Senior MEAL & Information Systems Coordinator'}

Resumo Profissional:
${cvData?.summary || ''}

Experiências Principais (WFP Angola, Camões I.P. / FRESAN, INE Angola):
${JSON.stringify(cvData?.experiences || [], null, 2)}

DIRETRIZES DA CARTA:
1. Cabeçalho formal clássico internacional com data e endereço.
2. Abertura afirmativa declarando a candidatura à posição e motivação estratégica pelo impacto.
3. Demonstração de autoridade técnica direta: arquitetura de sistemas MEAL, recolha móvel (Kobo, ODK, Survey Solutions, MoDA), automação de validações e regras de alerta pré-análise, auditorias de qualidade de dados (DQA), e dashboards executivos em Power BI.
4. Citação do sucesso comprovado da entrega da plataforma colaborativa do FRESAN / Camões, I.P. (https://sgi-fresancamoes.com/) financiada pela União Europeia e intervenção em consórcios com agências da ONU (WFP, FAO, PNUD).
5. Conclusão cortês com prontidão para entrevista técnica.

Responda ESTRITAMENTE em JSON:
{
  "subject": "Application for the position of...",
  "letterBody": "Full letter text formatted in clear paragraphs",
  "keySellingPoints": ["point 1", "point 2", "point 3"]
}
      `.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.25
        }
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.error('Erro na rota /api/cover-letter:', err);
      return res.status(500).json({ error: err.message, fallback: true });
    }
  });

  // Dedicated AI Translation endpoint for Cover Letters & CV text
  app.post('/api/translate-letter', async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Texto não fornecido.' });
      }

      if (!ai) {
        return res.status(503).json({
          error: 'Chave GEMINI_API_KEY não configurada no servidor.',
          fallback: true
        });
      }

      const prompt = `
You are a senior diplomatic translator specialized in international civil service correspondence (United Nations, European Union, Diplomatic Missions).
Translate the following formal Cover Letter / Statement of Interest into: ${targetLanguage || 'English'}.

CRITICAL GUIDELINES:
- Preserve official institutional nomenclature, acronyms, and standards (MEAL, SGI, WFP, FAO, UNDP, EU, OECD/DAC, Logframe, PIRS, DQA, https://sgi-fresancamoes.com/).
- Adapt formal salutations and closings to the executive conventions of the target language (e.g., in English: "Dear Members of the Selection Committee," ... "Sincerely,"; in French: "Madame, Monsieur les Membres du Comité de Sélection," ... "Veuillez agréer, Madame, Monsieur..."; in Spanish: "Estimados Miembros del Comité de Selección," ... "Atentamente,").
- Keep exact paragraph spacing and line breaks.

Text to translate:
${text}

Respond STRICTLY in JSON:
{
  "translatedText": "Translated letter text with clean line breaks"
}
      `.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.error('Erro na rota /api/translate-letter:', err);
      return res.status(500).json({ error: err.message, fallback: true });
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
