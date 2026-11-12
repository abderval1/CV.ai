import React, { useState, useEffect } from 'react';
import { fetchSystemBanners } from '../services/adminModulesService';
import { SystemAnnouncementBanner } from '../types/adminModules';
import { useAuth } from '../context/AuthContext';
import { Info, AlertTriangle, Sparkles, Wrench, X, ArrowRight } from 'lucide-react';

interface SystemNotificationBannerProps {
  onOpenPricing?: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const SystemNotificationBanner: React.FC<SystemNotificationBannerProps> = ({
  onOpenPricing,
  onNavigateTab
}) => {
  const { user, isPro, isExecutive } = useAuth();
  const [banners, setBanners] = useState<SystemAnnouncementBanner[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('curriculopro_dismissed_banners');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    fetchSystemBanners().then((list) => {
      const now = new Date().toISOString();
      const active = list.filter((b) => {
        if (!b.active) return false;
        if (b.startsAt && b.startsAt > now) return false;
        if (b.expiresAt && b.expiresAt < now) return false;
        if (b.targetAudience === 'free_only' && (isPro || isExecutive)) return false;
        if (b.targetAudience === 'paid_only' && !isPro && !isExecutive) return false;
        return true;
      });
      setBanners(active);
    });
  }, [isPro, isExecutive]);

  const handleDismiss = (id: string) => {
    const next = [...dismissedIds, id];
    setDismissedIds(next);
    try {
      localStorage.setItem('curriculopro_dismissed_banners', JSON.stringify(next));
    } catch (e) {
      console.warn('Erro ao guardar banner descartado:', e);
    }
  };

  const visibleBanners = banners.filter((b) => !dismissedIds.includes(b.id));
  if (visibleBanners.length === 0) return null;

  const current = visibleBanners[0];

  const getStyle = () => {
    switch (current.type) {
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200';
      case 'maintenance':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200';
      case 'promo':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-900 dark:text-purple-200';
      default:
        return 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200';
    }
  };

  const getIcon = () => {
    switch (current.type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'promo':
        return <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-600 shrink-0" />;
    }
  };

  return (
    <div
      className={`no-print w-full border-b px-4 py-2 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 ${getStyle()}`}
    >
      <div className="flex items-center gap-2 min-w-0 max-w-5xl mx-auto flex-1 justify-center text-center sm:text-left">
        {getIcon()}
        <span className="font-bold truncate">{current.title}:</span>
        <span className="truncate hidden sm:inline opacity-90">{current.message}</span>
        {current.actionLabel && (
          <button
            type="button"
            onClick={() => {
              if (current.actionUrl === '#pricing') onOpenPricing?.();
              else if (current.actionUrl === '#templates' && onNavigateTab) onNavigateTab('editor');
              else if (onOpenPricing) onOpenPricing();
            }}
            className="ml-2 font-bold underline underline-offset-2 flex items-center gap-1 shrink-0 hover:opacity-80"
          >
            <span>{current.actionLabel}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {current.dismissible && (
        <button
          type="button"
          onClick={() => handleDismiss(current.id)}
          className="p-1 hover:bg-black/5 rounded-md text-slate-500 hover:text-slate-800 transition-colors shrink-0"
          title="Fechar aviso"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
