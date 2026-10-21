import React, { useRef } from 'react';
import { CVData } from '../types/cv';
import { SAMPLE_AVATARS } from '../data/templateCatalog';
import { Camera, Trash2, Check, Upload, HelpCircle, X, Sparkles } from 'lucide-react';

interface PhotoManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cv: CVData;
  onChange: (cv: CVData) => void;
}

export const PhotoManagerModal: React.FC<PhotoManagerModalProps> = ({
  isOpen,
  onClose,
  cv,
  onChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentPhoto = cv.personalDetails.photoUrl;
  const isPhotoVisible = cv.personalDetails.showPhoto !== false && Boolean(currentPhoto);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 3MB for good performance)
    if (file.size > 3 * 1024 * 1024) {
      alert('Por favor escolha uma foto com menos de 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onChange({
        ...cv,
        personalDetails: {
          ...cv.personalDetails,
          photoUrl: base64,
          showPhoto: true
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (url: string) => {
    onChange({
      ...cv,
      personalDetails: {
        ...cv.personalDetails,
        photoUrl: url,
        showPhoto: true
      }
    });
  };

  const handleRemovePhoto = () => {
    onChange({
      ...cv,
      personalDetails: {
        ...cv.personalDetails,
        photoUrl: '',
        showPhoto: false
      }
    });
  };

  const handleToggleVisibility = (enabled: boolean) => {
    onChange({
      ...cv,
      personalDetails: {
        ...cv.personalDetails,
        showPhoto: enabled
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">Foto de Perfil Profissional</h3>
              <p className="text-[11px] text-slate-300">
                Padrão Europeu Europass, Criativo e Minimalista
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Active Photo Preview & Toggle */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="relative">
              {currentPhoto ? (
                <img
                  src={currentPhoto}
                  alt={cv.personalDetails.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-300 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-200 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                  <Camera className="w-8 h-8" />
                </div>
              )}
              {isPhotoVisible && (
                <span
                  className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[10px]"
                  title="Foto ativa no currículo"
                >
                  ✓
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800">
                  {currentPhoto ? 'Foto Carregada' : 'Sem Foto Configurada'}
                </span>
                {currentPhoto && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover</span>
                  </button>
                )}
              </div>

              {currentPhoto ? (
                <div className="flex items-center gap-2 mt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cv.personalDetails.showPhoto !== false}
                      onChange={(e) => handleToggleVisibility(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-xs text-slate-600">
                    {cv.personalDetails.showPhoto !== false
                      ? 'Visível no CV'
                      : 'Ocultada no CV'}
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Carregue a sua foto ou escolha um avatar profissional para testar.
                </p>
              )}
            </div>
          </div>

          {/* Upload Custom Photo */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Carregar Foto do Meu Computador / Telemóvel</span>
            </button>
            <p className="text-[10px] text-center text-slate-500 mt-1.5">
              Formatos recomendados: JPG, PNG ou WEBP (máx. 3MB). Fundo neutro e iluminação suave.
            </p>
          </div>

          {/* Quick Preset Avatars */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Ou selecione um avatar profissional para testar:</span>
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {SAMPLE_AVATARS.map((avatar) => {
                const isSelected = currentPhoto === avatar.url;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => handleSelectSample(avatar.url)}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    />
                    <span className="text-[10px] font-medium text-slate-700 truncate w-full">
                      {avatar.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Strategic Context Reminder */}
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Dica de Conformidade:</strong> A foto será exibida nos modelos <em>Europeu Europass</em>, <em>Criativo Split</em> e <em>Minimalista Nórdico</em>. Se você selecionar o modelo <em>Harvard</em> ou <em>ATS Estrito</em>, o sistema ocultará a foto para evitar desclassificação por leis de viés nos EUA/UK.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Concluir & Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};
