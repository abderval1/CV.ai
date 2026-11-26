import React from 'react';
import { CVData, TemplateStyle } from '../types/cv';
import { CoverLetterLayoutStyle } from '../data/showcaseCatalog';
import { GENERIC_DEFAULT_CV } from '../data/initialCV';
import portraitWomanImg from '../assets/images/portrait_executive_woman_1794571428995.jpg';
import { useLanguage } from '../context/LanguageContext';
import { TOOLS_UI_TRANSLATIONS } from '../i18n/toolsUiTranslations';

import { resolveTemplateStyleProfile } from '../utils/cvDocumentLabels';
import { getTemplateById } from '../data/templateCatalog';

interface CVPreviewCardProps {
  kind: 'cv';
  templateStyle: TemplateStyle;
  accentColor?: string;
  cvData?: CVData;
  hasPhoto?: boolean;
  size?: 'sm' | 'lg';
}

interface CoverPreviewCardProps {
  kind: 'cover';
  layoutStyle: CoverLetterLayoutStyle;
  accentColor?: string;
  candidateName: string;
  candidateTitle: string;
  location: string;
  email: string;
  phone: string;
  letterBody: string;
  size?: 'sm' | 'lg';
}

export type DocumentMiniPreviewProps = CVPreviewCardProps | CoverPreviewCardProps;

export const DocumentMiniPreview: React.FC<DocumentMiniPreviewProps> = (props) => {
  const { siteLanguage } = useLanguage();
  const ui = (TOOLS_UI_TRANSLATIONS[siteLanguage] || TOOLS_UI_TRANSLATIONS.en).miniPreview;
  const isLarge = props.size === 'lg';

  if (props.kind === 'cover') {
    const {
      layoutStyle,
      accentColor = '#0f172a',
      candidateName,
      candidateTitle,
      location,
      email,
      phone,
      letterBody
    } = props;

    const isSerif = layoutStyle === 'classic_bar' || layoutStyle === 'harvard_formal';
    const fontClass = isSerif ? 'font-serif' : 'font-sans';
    const paragraphs = letterBody
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (layoutStyle === 'split_accent') {
      return (
        <div
          className={`a4-paper-preserve w-full h-full bg-white text-slate-900 flex overflow-hidden select-none ${fontClass}`}
        >
          <div
            className={`${
              isLarge ? 'w-[28%] p-7' : 'w-[26%] p-3'
            } text-white flex flex-col justify-between shrink-0`}
            style={{ backgroundColor: accentColor }}
          >
            <div>
              <p className={`${isLarge ? 'text-base' : 'text-[8px]'} font-extrabold uppercase tracking-tight leading-tight`}>
                {candidateName}
              </p>
              <p className={`${isLarge ? 'text-[11px] mt-1.5' : 'text-[5.5px] mt-1'} text-white/85 leading-snug`}>
                {candidateTitle}
              </p>
              <div className={`border-t border-white/25 ${isLarge ? 'my-4 pt-3 space-y-1.5 text-[10px]' : 'my-2 pt-1.5 space-y-0.5 text-[4.8px]'} text-white/90`}>
                <p className="truncate">{location}</p>
                <p className="truncate">{phone}</p>
                <p className="truncate">{email}</p>
              </div>
            </div>
            <div className={`${isLarge ? 'text-[9px]' : 'text-[4.5px]'} text-white/60 uppercase tracking-wider`}>
              {ui.coverSidebarLabel}
            </div>
          </div>

          <div className={`flex-1 ${isLarge ? 'p-8 sm:p-10 space-y-4' : 'p-3.5 space-y-1.5'} overflow-hidden`}>
            <div className={`${isLarge ? 'text-[10px]' : 'text-[4.8px]'} text-slate-400 font-mono uppercase tracking-wider border-b border-slate-200 pb-1.5`}>
              {ui.coverHeaderLabel}
            </div>
            <div className={`${isLarge ? 'text-[13px] leading-relaxed space-y-3.5' : 'text-[5.2px] leading-[1.45] space-y-1.5'} text-slate-700`}>
              {paragraphs.map((p, idx) => (
                <p key={idx} className={isLarge ? 'whitespace-pre-line' : 'line-clamp-3'}>
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (layoutStyle === 'modern_header' || layoutStyle === 'europass_blue') {
      return (
        <div className={`a4-paper-preserve w-full h-full bg-white text-slate-900 flex flex-col overflow-hidden select-none ${fontClass}`}>
          <div
            className={`${isLarge ? 'px-9 py-7' : 'px-3.5 py-2.5'} text-white`}
            style={{ backgroundColor: accentColor }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className={`${isLarge ? 'text-xl' : 'text-[9px]'} font-extrabold uppercase tracking-tight truncate`}>
                  {candidateName}
                </p>
                <p className={`${isLarge ? 'text-xs mt-1' : 'text-[5.5px] mt-0.5'} text-white/90 truncate`}>
                  {candidateTitle}
                </p>
              </div>
            </div>
            <p className={`${isLarge ? 'text-[10px] mt-2.5' : 'text-[4.8px] mt-1'} text-white/80 font-mono truncate`}>
              {location} · {phone} · {email}
            </p>
          </div>

          <div className={`flex-1 ${isLarge ? 'px-9 py-7 space-y-4' : 'px-3.5 py-2.5 space-y-1.5'} overflow-hidden`}>
            <div className={`${isLarge ? 'text-[13px] leading-relaxed space-y-3.5' : 'text-[5.2px] leading-[1.45] space-y-1.5'} text-slate-700`}>
              {paragraphs.map((p, idx) => (
                <p key={idx} className={isLarge ? 'whitespace-pre-line' : 'line-clamp-3'}>
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // classic_bar, harvard_formal, tech_clean
    const isTech = layoutStyle === 'tech_clean';
    return (
      <div
        className={`a4-paper-preserve w-full h-full bg-white text-slate-900 flex flex-col justify-between overflow-hidden select-none ${fontClass} ${
          isLarge ? 'p-9 sm:p-11' : 'p-3.5'
        }`}
      >
        <div>
          <div
            className={`${
              layoutStyle === 'harvard_formal' ? 'text-center border-b border-slate-900' : 'border-b-2'
            } ${isLarge ? 'pb-4 mb-5' : 'pb-2 mb-2'}`}
            style={{ borderColor: accentColor }}
          >
            <p
              className={`${isLarge ? 'text-xl sm:text-2xl' : 'text-[9px]'} font-black uppercase tracking-tight`}
              style={{ color: isTech ? accentColor : '#0f172a' }}
            >
              {candidateName}
            </p>
            <p className={`${isLarge ? 'text-xs mt-1' : 'text-[5.5px] mt-0.5'} font-semibold text-slate-600 truncate`}>
              {candidateTitle}
            </p>
            <p className={`${isLarge ? 'text-[10px] mt-1.5' : 'text-[4.6px] mt-0.5'} font-mono text-slate-500 truncate`}>
              {location} | {phone} | {email}
            </p>
          </div>

          <div className={`${isLarge ? 'text-[13.5px] leading-relaxed space-y-3.5' : 'text-[5.1px] leading-[1.45] space-y-1.5'} text-slate-800`}>
            {paragraphs.map((p, idx) => (
              <p key={idx} className={isLarge ? 'whitespace-pre-line' : 'line-clamp-3'}>
                {p}
              </p>
            ))}
          </div>
        </div>

        <div className={`${isLarge ? 'pt-4 mt-6 text-[10px]' : 'pt-1.5 mt-2 text-[4.5px]'} border-t border-slate-200 flex items-center justify-between text-slate-400 font-mono`}>
          <span>{candidateName}</span>
          <span>{ui.a4Official}</span>
        </div>
      </div>
    );
  }

  // KIND === 'cv'
  const cv = props.cvData || GENERIC_DEFAULT_CV;
  const style = props.templateStyle;
  const profile = resolveTemplateStyleProfile(style);
  const templateMeta = getTemplateById(style);
  const accent = props.accentColor || cv.accentColor || templateMeta.accentColor || '#0f172a';
  const showPhoto = props.hasPhoto ?? templateMeta.hasPhoto;
  const photoSrc = cv.personalDetails.photoUrl || portraitWomanImg;
  const exp1 = cv.experiences[0];
  const exp2 = cv.experiences[1];
  const edu1 = cv.educations[0];
  const comp1 = cv.competencies[0];
  const comp2 = cv.competencies[1];

  const isSerif = profile.isSerifFamily;

  if (profile.isCreative) {
    return (
      <div className="a4-paper-preserve w-full h-full bg-white text-slate-900 flex overflow-hidden select-none font-sans">
        <div
          className={`${isLarge ? 'w-[33%] p-6 space-y-4' : 'w-[34%] p-2.5 space-y-2'} text-white shrink-0`}
          style={{ backgroundColor: accent || '#7c3aed' }}
        >
          {showPhoto && (
            <div className={`${isLarge ? 'w-20 h-20' : 'w-9 h-9'} rounded-full overflow-hidden border-2 border-white/40 mx-auto bg-slate-800`}>
              <img src={photoSrc} alt={cv.personalDetails.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="text-center">
            <p className={`${isLarge ? 'text-sm' : 'text-[6.8px]'} font-extrabold uppercase tracking-tight leading-tight`}>
              {cv.personalDetails.name}
            </p>
            <p className={`${isLarge ? 'text-[10px] mt-1' : 'text-[4.8px] mt-0.5'} text-white/80 line-clamp-2`}>
              {cv.personalDetails.title}
            </p>
          </div>

          <div className={`border-t border-white/20 ${isLarge ? 'pt-3 space-y-1.5 text-[10px]' : 'pt-1.5 space-y-0.5 text-[4.5px]'} text-white/90`}>
            <p className="font-bold uppercase tracking-wider text-white/70">{ui.contacts}</p>
            <p className="truncate">{cv.personalDetails.location}</p>
            <p className="truncate">{cv.personalDetails.phone}</p>
            <p className="truncate">{cv.personalDetails.email}</p>
          </div>

          <div className={`border-t border-white/20 ${isLarge ? 'pt-3 space-y-1.5 text-[10px]' : 'pt-1.5 space-y-1 text-[4.5px]'}`}>
            <p className="font-bold uppercase tracking-wider text-white/70">{ui.competencies}</p>
            {(cv.competencies || []).slice(0, 3).map((c) => (
              <div key={c.id} className="space-y-0.5">
                <p className="truncate font-semibold">{c.category}</p>
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/85 w-4/5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`flex-1 ${isLarge ? 'p-7 space-y-4' : 'p-2.5 space-y-1.5'} overflow-hidden`}>
          <div>
            <p className={`${isLarge ? 'text-[11px]' : 'text-[5.2px]'} font-bold uppercase tracking-wider mb-1`} style={{ color: accent }}>
              {ui.profile}
            </p>
            <p className={`${isLarge ? 'text-xs leading-relaxed' : 'text-[4.8px] leading-[1.35] line-clamp-3'} text-slate-700`}>
              {cv.summary}
            </p>
          </div>

          {exp1 && (
            <div className="border-t border-slate-100 pt-1.5">
              <p className={`${isLarge ? 'text-[11px]' : 'text-[5.2px]'} font-bold uppercase tracking-wider mb-1`} style={{ color: accent }}>
                {ui.experience}
              </p>
              <div className={isLarge ? 'space-y-2.5' : 'space-y-1'}>
                {[exp1, exp2].filter(Boolean).map((exp) => (
                  <div key={exp!.id}>
                    <div className="flex items-baseline justify-between gap-1">
                      <p className={`${isLarge ? 'text-xs' : 'text-[5.2px]'} font-bold text-slate-900 truncate`}>{exp!.role}</p>
                      <span className={`${isLarge ? 'text-[10px]' : 'text-[4.4px]'} text-slate-400 font-mono shrink-0`}>{exp!.period}</span>
                    </div>
                    <p className={`${isLarge ? 'text-[11px]' : 'text-[4.7px]'} font-semibold text-slate-600 truncate`}>{exp!.company}</p>
                    <p className={`${isLarge ? 'text-[11px] mt-1' : 'text-[4.5px] mt-0.5 line-clamp-2'} text-slate-600`}>
                      • {exp!.highlights[0]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {edu1 && (
            <div className="border-t border-slate-100 pt-1.5">
              <p className={`${isLarge ? 'text-[11px]' : 'text-[5.2px]'} font-bold uppercase tracking-wider mb-0.5`} style={{ color: accent }}>
                {ui.education}
              </p>
              <p className={`${isLarge ? 'text-xs' : 'text-[5px]'} font-bold text-slate-900 truncate`}>{edu1.degree}</p>
              <p className={`${isLarge ? 'text-[11px]' : 'text-[4.6px]'} text-slate-600 truncate`}>
                {edu1.institution} · {edu1.period}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (profile.isEuropass) {
    return (
      <div className="a4-paper-preserve w-full h-full bg-white text-slate-900 flex flex-col overflow-hidden select-none font-sans">
        <div
          className={`${isLarge ? 'px-7 py-5 gap-5' : 'px-3 py-2 gap-2'} flex items-center text-white`}
          style={{ backgroundColor: accent || '#1d4ed8' }}
        >
          {showPhoto && (
            <div className={`${isLarge ? 'w-18 h-22' : 'w-8 h-10'} rounded-md overflow-hidden border border-white/40 bg-slate-200 shrink-0`}>
              <img src={photoSrc} alt={cv.personalDetails.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className={`${isLarge ? 'text-lg' : 'text-[7.5px]'} font-black uppercase tracking-tight truncate`}>
              {cv.personalDetails.name}
            </p>
            <p className={`${isLarge ? 'text-xs mt-0.5' : 'text-[5px]'} text-white/90 truncate`}>{cv.personalDetails.title}</p>
            <p className={`${isLarge ? 'text-[10px] mt-1.5' : 'text-[4.4px] mt-0.5'} text-white/80 font-mono truncate`}>
              {cv.personalDetails.location} · {cv.personalDetails.phone} · {cv.personalDetails.email}
            </p>
          </div>
        </div>

        <div className={`flex-1 ${isLarge ? 'p-7 space-y-4' : 'p-3 space-y-1.5'} overflow-hidden`}>
          <div>
            <p className={`${isLarge ? 'text-[11px]' : 'text-[5px]'} font-bold uppercase tracking-wider border-b pb-0.5 mb-1`} style={{ color: accent, borderColor: accent }}>
              {ui.aboutMe}
            </p>
            <p className={`${isLarge ? 'text-xs leading-relaxed' : 'text-[4.7px] leading-[1.35] line-clamp-3'} text-slate-700`}>
              {cv.summary}
            </p>
          </div>

          {exp1 && (
            <div>
              <p className={`${isLarge ? 'text-[11px]' : 'text-[5px]'} font-bold uppercase tracking-wider border-b pb-0.5 mb-1`} style={{ color: accent, borderColor: accent }}>
                {ui.experience}
              </p>
              <div className={isLarge ? 'space-y-2.5' : 'space-y-1'}>
                {[exp1, exp2].filter(Boolean).map((exp) => (
                  <div key={exp!.id} className="grid grid-cols-12 gap-2">
                    <div className={`col-span-3 ${isLarge ? 'text-[10px]' : 'text-[4.3px]'} font-mono text-slate-500`}>
                      {exp!.period}
                    </div>
                    <div className="col-span-9 min-w-0">
                      <p className={`${isLarge ? 'text-xs' : 'text-[5px]'} font-bold text-slate-900 truncate`}>{exp!.role}</p>
                      <p className={`${isLarge ? 'text-[11px]' : 'text-[4.6px]'} text-slate-600 truncate`}>{exp!.company}</p>
                      <p className={`${isLarge ? 'text-[11px] mt-0.5' : 'text-[4.4px] line-clamp-2'} text-slate-600`}>• {exp!.highlights[0]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            {edu1 && (
              <div>
                <p className={`${isLarge ? 'text-[10px]' : 'text-[4.8px]'} font-bold uppercase tracking-wider`} style={{ color: accent }}>
                  {ui.educationTraining}
                </p>
                <p className={`${isLarge ? 'text-[11px] mt-1' : 'text-[4.6px] mt-0.5'} font-semibold text-slate-900 truncate`}>{edu1.degree}</p>
                <p className={`${isLarge ? 'text-[10px]' : 'text-[4.3px]'} text-slate-500 truncate`}>{edu1.institution}</p>
              </div>
            )}
            <div>
              <p className={`${isLarge ? 'text-[10px]' : 'text-[4.8px]'} font-bold uppercase tracking-wider`} style={{ color: accent }}>
                {ui.langSkills}
              </p>
              {(cv.languages || []).slice(0, 2).map((l, idx) => (
                <p key={idx} className={`${isLarge ? 'text-[10px] mt-0.5' : 'text-[4.4px]'} text-slate-700 truncate`}>
                  <strong>{l.language}:</strong> {l.level}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profile.isEditorial) {
    return (
      <div className="a4-paper-preserve w-full h-full bg-white text-slate-900 flex flex-col overflow-hidden select-none font-sans">
        <div
          className={`${isLarge ? 'px-8 py-6 gap-5' : 'px-3 py-2.5 gap-2'} flex items-center justify-between text-white`}
          style={{ backgroundColor: accent || '#334155' }}
        >
          <div className="min-w-0 flex-1">
            <p className={`${isLarge ? 'text-[9px]' : 'text-[4px]'} uppercase tracking-widest text-white/70 font-semibold`}>
              {style === 'marketing_professional' ? 'Growth & Brand Strategy' : 'Editorial Portfolio'}
            </p>
            <p className={`${isLarge ? 'text-xl mt-0.5' : 'text-[8px]'} font-black uppercase tracking-tight truncate`}>
              {cv.personalDetails.name}
            </p>
            <p className={`${isLarge ? 'text-xs mt-0.5' : 'text-[5px]'} text-white/90 font-medium truncate`}>
              {cv.personalDetails.title}
            </p>
            <p className={`${isLarge ? 'text-[10px] mt-1.5' : 'text-[4.2px] mt-0.5'} text-white/75 font-mono truncate`}>
              {cv.personalDetails.location} · {cv.personalDetails.email}
            </p>
          </div>
          {showPhoto && (
            <div className={`${isLarge ? 'w-16 h-16' : 'w-7 h-7'} rounded-lg overflow-hidden border-2 border-white/40 shrink-0`}>
              <img src={photoSrc} alt={cv.personalDetails.name} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className={`flex-1 ${isLarge ? 'p-8 space-y-4' : 'p-3 space-y-1.5'} overflow-hidden`}>
          <div>
            <p className={`${isLarge ? 'text-[11px]' : 'text-[5px]'} font-bold uppercase tracking-wider border-b pb-0.5 mb-1`} style={{ color: accent, borderColor: '#e2e8f0' }}>
              {ui.stdSummary}
            </p>
            <p className={`${isLarge ? 'text-xs leading-relaxed' : 'text-[4.6px] leading-[1.35] line-clamp-3'} text-slate-700`}>
              {cv.summary}
            </p>
          </div>
          {exp1 && (
            <div>
              <p className={`${isLarge ? 'text-[11px]' : 'text-[5px]'} font-bold uppercase tracking-wider border-b pb-0.5 mb-1`} style={{ color: accent, borderColor: '#e2e8f0' }}>
                {ui.stdExp}
              </p>
              <div className={isLarge ? 'space-y-2.5' : 'space-y-1'}>
                {[exp1, exp2].filter(Boolean).map((exp) => (
                  <div key={exp!.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`${isLarge ? 'text-xs' : 'text-[5px]'} font-bold text-slate-900 truncate`}>
                        {exp!.role} · <span className="font-normal text-slate-600">{exp!.company}</span>
                      </p>
                      <span className={`${isLarge ? 'text-[10px]' : 'text-[4.2px]'} font-mono text-slate-500 shrink-0`}>{exp!.period}</span>
                    </div>
                    <p className={`${isLarge ? 'text-[11px] mt-0.5' : 'text-[4.4px] line-clamp-2'} text-slate-600`}>• {exp!.highlights[0]}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {edu1 && (
            <div>
              <p className={`${isLarge ? 'text-[11px]' : 'text-[5px]'} font-bold uppercase tracking-wider border-b pb-0.5 mb-1`} style={{ color: accent, borderColor: '#e2e8f0' }}>
                {ui.stdEdu}
              </p>
              <p className={`${isLarge ? 'text-xs' : 'text-[4.8px]'} font-bold text-slate-900 truncate`}>{edu1.degree}</p>
              <p className={`${isLarge ? 'text-[11px]' : 'text-[4.4px]'} text-slate-600 truncate`}>{edu1.institution} · {edu1.period}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Linear / Classic / Harvard / ATS / Tech / Minimalist / Academic / Modern / Finance / Board / Product / Blueprint
  const isCenteredHeader = profile.isHarvard || profile.isAcademic || profile.isBoard;
  const isTech = profile.isTech;
  const isMinimalist = profile.isMinimalist;
  const isModern = profile.isModern;
  const isFinance = profile.isFinance;
  const isBoard = profile.isBoard;
  const isProduct = profile.isProduct;
  const isBlueprint = profile.isBlueprint;
  const isMonoAts = profile.isStrictMonoAts;
  const isDarkAccent = isMonoAts || isFinance || profile.isHarvard || profile.isAts;

  return (
    <div
      className={`a4-paper-preserve w-full h-full bg-white text-slate-900 flex flex-col overflow-hidden select-none ${
        isSerif ? 'font-serif' : 'font-sans'
      } ${isBoard ? 'border-t-4' : ''} ${isLarge ? 'p-8 sm:p-10 space-y-4' : 'p-3 space-y-1.5'}`}
      style={isBoard ? { borderTopColor: accent || '#1e3a8a' } : undefined}
    >
      {/* Header */}
      <div
        className={`flex items-start justify-between gap-3 ${
          isCenteredHeader ? 'text-center flex-col items-center' : ''
        } ${isLarge ? 'pb-3 border-b-2' : 'pb-1.5 border-b'}`}
        style={{ borderColor: isMonoAts || isFinance ? '#0f172a' : accent }}
      >
        <div className="min-w-0 flex-1">
          <p
            className={`${isLarge ? 'text-xl' : 'text-[8px]'} font-black uppercase tracking-tight truncate`}
            style={{ color: isDarkAccent ? '#0f172a' : accent }}
          >
            {cv.personalDetails.name}
          </p>
          <p className={`${isLarge ? 'text-xs mt-0.5' : 'text-[5px]'} font-semibold text-slate-600 truncate`}>
            {cv.personalDetails.title}
          </p>
          <p className={`${isLarge ? 'text-[10px] mt-1' : 'text-[4.4px] mt-0.5'} font-mono text-slate-500 truncate`}>
            {cv.personalDetails.location} · {cv.personalDetails.phone} · {cv.personalDetails.email}
          </p>
        </div>
        {showPhoto && !isCenteredHeader && (
          <div className={`${isLarge ? 'w-14 h-14' : 'w-6 h-6'} ${isProduct ? 'rounded-lg' : 'rounded-full'} overflow-hidden border border-slate-200 shrink-0`}>
            <img src={photoSrc} alt={cv.personalDetails.name} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Summary */}
      <div
        className={`${
          isModern
            ? `border-l-2 ${isLarge ? 'pl-3' : 'pl-1.5'}`
            : isProduct
            ? `bg-slate-50 border border-slate-200 rounded ${isLarge ? 'p-3' : 'p-1.5'}`
            : ''
        }`}
        style={isModern ? { borderColor: accent } : undefined}
      >
        <p
          className={`${isLarge ? 'text-[11px]' : 'text-[5px]'} font-bold uppercase tracking-wider mb-0.5`}
          style={{ color: isMonoAts || isFinance ? '#0f172a' : accent }}
        >
          {isBlueprint ? `01. ${ui.techSummary}` : isTech ? ui.techSummary : isMinimalist ? ui.minSummary : ui.stdSummary}
        </p>
        <p className={`${isLarge ? 'text-xs leading-relaxed' : 'text-[4.6px] leading-[1.35] line-clamp-3'} text-slate-700`}>
          {cv.summary}
        </p>
      </div>

      {/* Competencies */}
      {(comp1 || comp2) && (
        <div>
          <p
            className={`${isLarge ? 'text-[11px]' : 'text-[5px]'} font-bold uppercase tracking-wider border-b border-slate-200 pb-0.5 mb-1`}
            style={{ color: isMonoAts || isFinance ? '#0f172a' : accent }}
          >
            {isBlueprint ? `02. ${ui.techComp}` : isTech ? ui.techComp : isMinimalist ? ui.minComp : ui.stdComp}
          </p>
          <div className={isProduct || isBlueprint ? 'grid grid-cols-2 gap-1.5' : isLarge ? 'space-y-1 text-xs' : 'space-y-0.5 text-[4.5px]'}>
            {[comp1, comp2].filter(Boolean).map((c) => (
              <p
                key={c!.id}
                className={`text-slate-700 truncate ${
                  isProduct || isBlueprint
                    ? `bg-slate-50 border border-slate-200 rounded ${isLarge ? 'p-1.5 text-[10px]' : 'p-0.5 text-[4.2px]'}`
                    : ''
                }`}
              >
                <strong className="text-slate-900">{c!.category}:</strong> {c!.description}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {exp1 && (
        <div>
          <p
            className={`${isLarge ? 'text-[11px]' : 'text-[5px]'} font-bold uppercase tracking-wider border-b border-slate-200 pb-0.5 mb-1`}
            style={{ color: isMonoAts ? '#0f172a' : accent }}
          >
            {isTech ? ui.techExp : isMinimalist ? ui.minExp : ui.stdExp}
          </p>
          <div className={isLarge ? 'space-y-2.5' : 'space-y-1'}>
            {[exp1, exp2].filter(Boolean).map((exp) => (
              <div key={exp!.id}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className={`${isLarge ? 'text-xs' : 'text-[5px]'} font-bold text-slate-900 truncate`}>
                    {exp!.company} — <span className="font-semibold text-slate-700">{exp!.role}</span>
                  </p>
                  <span className={`${isLarge ? 'text-[10px]' : 'text-[4.3px]'} font-mono text-slate-500 shrink-0`}>
                    {exp!.period}
                  </span>
                </div>
                <ul className={`${isLarge ? 'text-[11px] space-y-0.5 mt-1' : 'text-[4.5px] mt-0.5'} text-slate-700`}>
                  {(isLarge ? exp!.highlights.slice(0, 3) : exp!.highlights.slice(0, 2)).map((h, i) => (
                    <li key={i} className={isLarge ? '' : 'truncate'}>
                      • {h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {edu1 && (
        <div className="pt-0.5">
          <p
            className={`${isLarge ? 'text-[11px]' : 'text-[5px]'} font-bold uppercase tracking-wider border-b border-slate-200 pb-0.5 mb-1`}
            style={{ color: isMonoAts ? '#0f172a' : accent }}
          >
            {isTech ? ui.techEdu : isMinimalist ? ui.minEdu : ui.stdEdu}
          </p>
          <div className="flex items-baseline justify-between gap-2">
            <p className={`${isLarge ? 'text-xs' : 'text-[4.8px]'} font-bold text-slate-900 truncate`}>{edu1.degree}</p>
            <span className={`${isLarge ? 'text-[10px]' : 'text-[4.2px]'} font-mono text-slate-500 shrink-0`}>{edu1.period}</span>
          </div>
          <p className={`${isLarge ? 'text-[11px]' : 'text-[4.5px]'} text-slate-600 truncate`}>{edu1.institution}</p>
        </div>
      )}
    </div>
  );
};
