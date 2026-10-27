import React, { useState, useEffect, useRef } from 'react';
import { CVData, InterviewQuestion, InterviewAnswerEvaluation } from '../types/cv';
import { SAMPLE_JOB_OFFERS } from '../data/initialCV';
import {
  Sparkles,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Award,
  Target,
  Mic,
  MicOff,
  ThumbsUp,
  FileText,
  RotateCcw,
  Check,
  Send,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

interface InterviewSimulatorProps {
  currentCV: CVData;
  jobDescription: string;
  onUpdateJobDescription?: (desc: string) => void;
  onOpenPricing?: () => void;
}

export const InterviewSimulator: React.FC<InterviewSimulatorProps> = ({
  currentCV,
  jobDescription,
  onUpdateJobDescription,
  onOpenPricing
}) => {
  const [activeJobDesc, setActiveJobDesc] = useState<string>(
    jobDescription || SAMPLE_JOB_OFFERS[0].description
  );
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluations, setEvaluations] = useState<Record<string, InterviewAnswerEvaluation>>({});
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Speech Recognition States (Web Speech API)
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-PT';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        const currentQId = questions[currentQuestionIndex]?.id;
        if (currentQId) {
          setAnswers((prev) => ({
            ...prev,
            [currentQId]: (prev[currentQId] ? prev[currentQId] + ' ' : '') + transcript
          }));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Erro no microfone:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [questions, currentQuestionIndex]);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Não foi possível iniciar o microfone:', e);
      }
    }
  };

  // Generate 5 questions via API
  const handleGenerateQuestions = async () => {
    setIsGeneratingQuestions(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/interview/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: activeJobDesc,
          cvData: currentCV
        })
      });

      const data = await res.json();
      if (data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setEvaluations({});
      } else {
        throw new Error('Formato de perguntas inválido retornado pelo servidor.');
      }
    } catch (err: any) {
      console.error('Falha ao gerar perguntas:', err);
      setErrorMessage(err.message || 'Erro ao gerar perguntas de entrevista.');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Auto-generate on first load if empty
  useEffect(() => {
    if (questions.length === 0) {
      handleGenerateQuestions();
    }
  }, []);

  const currentQ = questions[currentQuestionIndex];
  const currentAnswer = currentQ ? answers[currentQ.id] || '' : '';
  const currentEval = currentQ ? evaluations[currentQ.id] : undefined;

  // Handle Score Answer
  const handleScoreAnswer = async () => {
    if (!currentQ) return;
    if (!currentAnswer.trim() || currentAnswer.trim().length < 15) {
      setErrorMessage('Por favor elabore uma resposta mais detalhada (mínimo 15 caracteres) antes de avaliar.');
      return;
    }

    setIsEvaluating(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/interview/score-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ,
          answer: currentAnswer,
          jobDescription: activeJobDesc,
          cvData: currentCV
        })
      });

      const data = await res.json();
      setEvaluations((prev) => ({
        ...prev,
        [currentQ.id]: {
          questionId: currentQ.id,
          score: data.score,
          verdict: data.verdict,
          strengths: data.strengths || [],
          improvements: data.improvements || [],
          recommendedAnswer: data.recommendedAnswer || ''
        }
      }));
    } catch (err: any) {
      console.error('Falha ao avaliar resposta:', err);
      setErrorMessage('Erro ao avaliar resposta. Tente novamente.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Helper to load sample answer
  const handleLoadSampleAnswer = () => {
    if (!currentQ) return;
    const sample = `Na minha experiência anterior como ${currentCV.personalDetails.title || 'Líder Executivo'}, deparei-me com uma situação crítica onde foi necessário tomar decisões rápidas sob forte pressão de tempo e restrição orçamentária. 
Adotei uma abordagem em 3 etapas: primeiro, convoquei as partes interessadas para redefinir as prioridades essenciais; segundo, alinhei os SLAs e automatizei os relatórios de status diários; por fim, liderei a execução direta com a equipa.
Como resultado, entregamos o projeto com 100% de conformidade regulatória, reduzindo o custo operacional em 24% e restabelecendo a confiança da diretoria.`;

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: sample
    }));
  };

  // Calculate Overall Simulation Progress
  const evaluatedCount = Object.keys(evaluations).length;
  const averageScore =
    evaluatedCount > 0
      ? Math.round(
          Object.values(evaluations).reduce((acc, ev) => acc + ev.score, 0) / evaluatedCount
        )
      : 0;

  return (
    <div className="w-full max-w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                Inteligência Artificial de Recrutamento
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Simulador de Entrevista Executiva & Scoring IA
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pratique as 5 perguntas comportamentais e técnicas mais prováveis para a sua vaga alvo.
              Receba pontuação instantânea, análise do método STAR e sugestões de respostas modelo.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              type="button"
              onClick={handleGenerateQuestions}
              disabled={isGeneratingQuestions}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingQuestions ? 'animate-spin' : ''}`} />
              <span>{isGeneratingQuestions ? 'A Gerar 5 Perguntas...' : 'Gerar Novas Perguntas'}</span>
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Progresso da Simulação:</span>
            <span className="font-bold text-white font-mono">
              {evaluatedCount} / {questions.length} Respondidas
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Média Geral de Prontidão:</span>
            <span
              className={`font-black font-mono text-xs px-2 py-0.5 rounded-full ${
                averageScore >= 85
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : averageScore >= 70
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : averageScore > 0
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {averageScore > 0 ? `${averageScore}%` : 'Pendente'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] truncate">
            <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Candidato: {currentCV.personalDetails.name || 'Perfil Ativo'}</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold hover:underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Questions Carousel / Selector */}
      {questions.length > 0 ? (
        <div className="space-y-4">
          {/* Question Step Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {questions.map((q, idx) => {
              const isAnswered = Boolean(answers[q.id]?.trim());
              const hasEvaluation = Boolean(evaluations[q.id]);
              const score = evaluations[q.id]?.score;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                    currentQuestionIndex === idx
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-slate-100 text-slate-800 font-mono">
                    {idx + 1}
                  </span>
                  <span>Pergunta {idx + 1}</span>
                  {hasEvaluation ? (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        (score || 0) >= 85
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {score}%
                    </span>
                  ) : isAnswered ? (
                    <span className="w-2 h-2 rounded-full bg-blue-500" title="Resposta em rascunho" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Active Question Display Card */}
          {currentQ && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
              {/* Question Header */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        currentQ.type === 'behavioral'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : currentQ.type === 'technical'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {currentQ.type === 'behavioral'
                        ? 'Comportamental (STAR)'
                        : currentQ.type === 'technical'
                        ? 'Técnica & Metodologia'
                        : 'Cenário Situacional'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Pergunta {currentQuestionIndex + 1} de {questions.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                      title="Pergunta anterior"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
                      }
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                      title="Próxima pergunta"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Big Question Prompt */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  "{currentQ.question}"
                </h3>

                {/* Recruiter Intent Insight */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>O que o Recrutador Procura:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{currentQ.context}</p>
                  </div>

                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 text-xs text-amber-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Fórmula Recomendada:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{currentQ.suggestedStructure}</p>
                  </div>
                </div>

                {/* Key Criteria Pills */}
                {currentQ.keyCriteria && currentQ.keyCriteria.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Critérios Chave:
                    </span>
                    {currentQ.keyCriteria.map((crit, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200"
                      >
                        ✓ {crit}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Answer Workspace */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>A Sua Resposta para Esta Pergunta:</span>
                  </label>

                  <div className="flex items-center gap-2">
                    {speechSupported && (
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          isListening
                            ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                        title="Falar resposta com o microfone"
                      >
                        {isListening ? (
                          <>
                            <MicOff className="w-3.5 h-3.5 text-rose-600" />
                            <span>A Gravar...</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Ditado por Voz</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleLoadSampleAnswer}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Preencher Exemplo
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
                    }}
                    rows={5}
                    placeholder="Digite a sua resposta como se estivesse diante do painel de recrutadores. Descreva o contexto real, a ação que você tomou pessoalmente e o resultado alcançado com dados ou métricas..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all leading-relaxed"
                  />
                  <div className="absolute right-3 bottom-3 text-[10px] text-slate-400 font-mono">
                    {currentAnswer.length} caracteres ·{' '}
                    {currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0} palavras
                  </div>
                </div>

                {/* Submit for AI Scoring */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>O algoritmo analisa clareza, métricas quantificadas e método STAR.</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleScoreAnswer}
                    disabled={isEvaluating || !currentAnswer.trim()}
                    className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isEvaluating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>A Avaliar com IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        <span>Avaliar Resposta com IA</span>
                        <Send className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* AI Evaluation Result Card */}
              {currentEval && (
                <div className="mt-6 pt-6 border-t border-slate-200 space-y-4 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-lg shadow-inner ${
                          currentEval.score >= 85
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                            : currentEval.score >= 70
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-rose-100 text-rose-700 border border-rose-300'
                        }`}
                      >
                        {currentEval.score}%
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Veredito da Avaliação:
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              currentEval.score >= 85
                                ? 'bg-emerald-500 text-white'
                                : currentEval.score >= 70
                                ? 'bg-amber-500 text-white'
                                : 'bg-rose-500 text-white'
                            }`}
                          >
                            {currentEval.verdict}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {currentEval.score >= 85
                            ? 'Excelente estrutura executiva com forte apelo para o entrevistador.'
                            : currentEval.score >= 70
                            ? 'Resposta positiva, porém mais dados e métricas elevariam a sua autoridade.'
                            : 'Resposta genérica ou curta. Aplique as recomendações abaixo.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Improvements Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Strengths */}
                    <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pontos Fortes Identificados:</span>
                      </div>
                      <ul className="space-y-1 text-emerald-950 text-[11px]">
                        {currentEval.strengths.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Improvements */}
                    <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Oportunidades de Melhoria:</span>
                      </div>
                      <ul className="space-y-1 text-amber-950 text-[11px]">
                        {currentEval.improvements.map((imp, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-600 font-bold shrink-0">→</span>
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Model Answer Recommendation */}
                  {currentEval.recommendedAnswer && (
                    <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                        <Award className="w-4 h-4 text-indigo-600" />
                        <span>Sugestão de Resposta Modelo Executiva (Padrão STAR):</span>
                      </div>
                      <p className="text-indigo-900 text-[11px] leading-relaxed italic">
                        "{currentEval.recommendedAnswer}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Nenhuma pergunta gerada ainda</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Clique no botão acima para formular 5 perguntas sob medida para a sua candidatura.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateQuestions}
            className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Gerar Perguntas de Entrevista
          </button>
        </div>
      )}
    </div>
  );
};
