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

  // AI Cover Letter endpoint
  app.post('/api/cover-letter', async (req, res) => {
    try {
      const { cvData, jobDescription, recipientName, organizationName } = req.body;

      if (!ai) {
        return res.status(503).json({
          error: 'Chave GEMINI_API_KEY não configurada no servidor.',
          fallback: true
        });
      }

      const prompt = `
Você é um especialista em cartas de motivação e candidaturas para Organizações Internacionais (ONU, União Europeia, ONGs Internacionais).
Escreva uma Carta de Apresentação / Motivação de alto nível (em Português ou no idioma solicitado) para:
Candidato: ${cvData?.name || 'Agostinho do Rosário'}
Título: ${cvData?.title || 'Especialista em MEAL e Sistemas de Informação'}
Contacto: ${cvData?.email || ''} | ${cvData?.phone || ''} | ${cvData?.location || ''}
Organização Alvo: ${organizationName || 'Painel de Seleção / Direção de Recursos Humanos'}
Destinatário: ${recipientName || 'Estimados Membros do Comité de Seleção'}

Vaga / Termos de Referência:
${jobDescription || 'Especialista Sênior em MEAL e Sistemas de Dados'}

Resumo de Qualificações do Candidato:
${cvData?.summary || ''}
Experiências Principais:
${JSON.stringify(cvData?.experiences || [], null, 2)}

A carta deve ter:
1. Cabeçalho formal clássico.
2. Parágrafo 1: Abertura firme declarando a candidatura e motivação pelo impacto do projeto.
3. Parágrafo 2: Demonstração de competência técnica direta (sistemas MEAL, Kobo, Power BI, DQA, Logframes).
4. Parágrafo 3: Prova de coordenação e liderança de dados em consórcios internacionais (WFP, UE, Camões, INE).
5. Parágrafo 4: Encerramento cortês e disponibilidade para entrevista técnica.

Responda em JSON:
{
  "subject": "Candidatura ao posto de...",
  "letterBody": "Texto completo formatado em parágrafos limpos",
  "keySellingPoints": ["ponto 1", "ponto 2", "ponto 3"]
}
      `.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.error('Erro na rota /api/cover-letter:', err);
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
