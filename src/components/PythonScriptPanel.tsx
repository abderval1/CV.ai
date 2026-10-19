import React, { useState } from 'react';
import { CVData } from '../types/cv';
import { generatePythonScript } from '../utils/pythonScriptGenerator';
import { Copy, Check, Download, Terminal, Code2 } from 'lucide-react';

interface PythonScriptPanelProps {
  cv: CVData;
}

export const PythonScriptPanel: React.FC<PythonScriptPanelProps> = ({ cv }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const scriptContent = generatePythonScript(cv);

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([scriptContent], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gerar_cv.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-slate-800" />
            <h2 className="text-sm font-bold text-slate-900">
              Script Python Local (python-docx)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descarregar gerar_cv.py</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-600">
          Como Engenheiro Informático, podes também executar este script em 10 segundos no teu terminal para compilar o ficheiro Word (.docx) localmente com a formatação exata da ONU.
        </p>

        {/* Instructions */}
        <div className="bg-slate-900 text-slate-200 p-3.5 rounded-lg text-xs font-mono space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Terminal className="w-3.5 h-3.5" />
            <span>Execução no Terminal:</span>
          </div>
          <div className="space-y-1">
            <p className="text-emerald-400"># 1. Instala a biblioteca necessária</p>
            <p className="text-slate-100">pip install python-docx</p>
            <p className="text-emerald-400 mt-2"># 2. Executa o script</p>
            <p className="text-slate-100">python gerar_cv.py</p>
          </div>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="bg-slate-950 text-slate-200 rounded-xl p-4 overflow-hidden border border-slate-800 shadow-md">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400 font-mono">
          <span>gerar_cv.py</span>
          <span>{scriptContent.split('\n').length} linhas</span>
        </div>
        <pre className="mt-3 text-[12px] font-mono leading-relaxed overflow-x-auto text-slate-300 max-h-[550px] p-1">
          {scriptContent}
        </pre>
      </div>
    </div>
  );
};
