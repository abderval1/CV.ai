import React, { useState, useEffect } from 'react';
import { useAuth, getAuthErrorMessage } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { getStoredPlatformSettingsSync } from '../services/adminModulesService';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  Eye,
  EyeOff,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
  onRegistrationSuccess?: () => void;
  promptMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
  onRegistrationSuccess,
  promptMessage
}) => {
  const {
    login,
    register,
    loginWithProvider,
    resetPassword,
    completePasswordReset,
    isAuthenticated,
    authRedirectError,
    clearAuthRedirectError
  } = useAuth();
  const { showSuccess } = useToast();
  const { siteText, siteLanguage } = useLanguage();
  const a = siteText.auth;

  const authFeedback = React.useMemo(() => {
    const map: Record<
      'pt' | 'en' | 'es' | 'fr' | 'de' | 'it',
      {
        weak: string;
        medium: string;
        strong: string;
        strengthLabel: string;
        invalidEmail: string;
        invalidReset: string;
        resetDoneTitle: string;
        resetDoneDesc: string;
        shortPass: string;
        regPaused: string;
        regPausedTitle: string;
        regPausedDesc: string;
        enterName: string;
        passMismatch: string;
        acceptTerms: string;
        loginSuccessTitle: string;
        loginSuccessDesc: string;
        regSuccessTitle: string;
        regSuccessDesc: string;
        googleSuccessTitle: string;
        googleSuccessDesc: string;
        googleRedirecting: string;
        googleUnauthDomain: string;
        googleDomainTip1: string;
        googleDomainTip2: string;
        inAppWarning1: string;
        inAppWarning2: string;
        inAppWarning3: string;
        mobileReturnMsg: string;
        resetCodeLabel: string;
        resetCodePlaceholder: string;
        newPassLabel: string;
        newPassPlaceholder: string;
        togglePassAria: string;
        closeAria: string;
        humanCheckTitle: string;
        humanCheckHint: string;
        humanCheckPlaceholder: string;
        humanCheckRequired: string;
        humanCheckRefresh: string;
        humanCheckLoadErr: string;
      }
    > = {
      pt: {
        weak: 'Fraca',
        medium: 'Média',
        strong: 'Forte & Segura',
        strengthLabel: 'Segurança da senha:',
        invalidEmail: 'Por favor insira um endereço de e-mail válido.',
        invalidReset: 'Insira o código de 6 dígitos e uma nova palavra-passe com pelo menos 6 caracteres.',
        resetDoneTitle: 'Palavra-passe Redefinida',
        resetDoneDesc: 'A sua sessão foi iniciada automaticamente.',
        shortPass: 'A palavra-passe deve ter pelo menos 6 caracteres.',
        regPaused: 'Novos registos encontram-se temporariamente pausados. Contas existentes podem entrar normalmente.',
        regPausedTitle: 'Novos cadastros temporariamente pausados',
        regPausedDesc: 'A criação de novas contas foi desativada temporariamente pelo administrador. Se já possui conta, alterne para iniciar sessão.',
        enterName: 'Por favor insira o seu nome completo.',
        passMismatch: 'As palavras-passe não coincidem. Verifique os dois campos.',
        acceptTerms: 'Por favor aceite os Termos de Uso e Política de Privacidade para prosseguir.',
        loginSuccessTitle: 'Sessão Iniciada',
        loginSuccessDesc: 'Bem-vindo de volta.',
        regSuccessTitle: 'Conta Criada com Sucesso',
        regSuccessDesc: 'Bem-vindo! Ative o seu plano para criar, editar e descarregar.',
        googleSuccessTitle: 'Autenticação Google Concluída',
        googleSuccessDesc: 'Sessão sincronizada com sucesso.',
        googleRedirecting: 'A abrir seleção de conta Google...',
        googleUnauthDomain: 'O acesso Google ainda não está autorizado neste domínio. Utilize o acesso imediato por E-mail e Palavra-passe logo abaixo.',
        googleDomainTip1: 'Para ativar o botão Google neste URL, adicione',
        googleDomainTip2: 'nas definições de domínios autorizados ou entre já abaixo com o seu e-mail.',
        inAppWarning1: 'Navegador interno detetado:',
        inAppWarning2: 'aplicações como WhatsApp ou Instagram costumam bloquear o acesso Google. Toque em',
        inAppWarning3: 'Abrir no Chrome / Safari',
        mobileReturnMsg: 'O navegador do telemóvel regressou antes de concluir a confirmação com a Google. Permita pop-ups ou entre abaixo com E-mail e Palavra-passe.',
        resetCodeLabel: 'Código de Verificação (6 dígitos)',
        resetCodePlaceholder: 'Ex: 482910',
        newPassLabel: 'Nova Palavra-passe',
        newPassPlaceholder: 'Mínimo de 6 caracteres',
        togglePassAria: 'Mostrar ou ocultar palavra-passe',
        closeAria: 'Fechar janela de autenticação',
        humanCheckTitle: 'Verificação Humana (Anti-Robôs)',
        humanCheckHint: 'Some os números da imagem para confirmar que não é um robô.',
        humanCheckPlaceholder: 'Soma',
        humanCheckRequired: 'Por favor some os números da imagem antes de criar a conta.',
        humanCheckRefresh: 'Trocar desafio',
        humanCheckLoadErr: 'Não foi possível carregar o desafio. Clique em Trocar.'
      },
      en: {
        weak: 'Weak',
        medium: 'Medium',
        strong: 'Strong & Secure',
        strengthLabel: 'Password strength:',
        invalidEmail: 'Please enter a valid email address.',
        invalidReset: 'Enter the 6-digit code and a new password with at least 6 characters.',
        resetDoneTitle: 'Password Reset',
        resetDoneDesc: 'You have been signed in automatically.',
        shortPass: 'Password must be at least 6 characters long.',
        regPaused: 'New registrations are temporarily paused. Existing accounts can sign in normally.',
        regPausedTitle: 'New signups temporarily paused',
        regPausedDesc: 'New account creation has been temporarily disabled by an administrator. If you already have an account, switch to Sign In.',
        enterName: 'Please enter your full name.',
        passMismatch: 'Passwords do not match. Please check both fields.',
        acceptTerms: 'Please accept the Terms of Service and Privacy Policy to continue.',
        loginSuccessTitle: 'Signed In',
        loginSuccessDesc: 'Welcome back.',
        regSuccessTitle: 'Account Created',
        regSuccessDesc: 'Welcome! Activate your plan to create, edit, and export.',
        googleSuccessTitle: 'Google Sign-In Complete',
        googleSuccessDesc: 'Session synced successfully.',
        googleRedirecting: 'Opening Google account selection...',
        googleUnauthDomain: 'Google sign-in is not yet authorized on this domain. Use Email and Password below.',
        googleDomainTip1: 'To enable Google Sign-In on this URL, add',
        googleDomainTip2: 'to authorized domains or sign in with email below.',
        inAppWarning1: 'In-app browser detected:',
        inAppWarning2: 'apps like WhatsApp or Instagram may block Google sign-in. Tap',
        inAppWarning3: 'Open in Chrome / Safari',
        mobileReturnMsg: 'Mobile browser returned before completing Google sign-in. Allow pop-ups or sign in with Email and Password below.',
        resetCodeLabel: 'Verification Code (6 digits)',
        resetCodePlaceholder: 'e.g. 482910',
        newPassLabel: 'New Password',
        newPassPlaceholder: 'At least 6 characters',
        togglePassAria: 'Show or hide password',
        closeAria: 'Close authentication modal',
        humanCheckTitle: 'Human Verification (Anti-Bot)',
        humanCheckHint: 'Add the numbers shown in the image to prove you are human.',
        humanCheckPlaceholder: 'Sum',
        humanCheckRequired: 'Please add the numbers in the image before registering.',
        humanCheckRefresh: 'New challenge',
        humanCheckLoadErr: 'Could not load challenge. Click refresh.'
      },
      es: {
        weak: 'Débil',
        medium: 'Media',
        strong: 'Fuerte y Segura',
        strengthLabel: 'Seguridad de la contraseña:',
        invalidEmail: 'Por favor ingresa un correo electrónico válido.',
        invalidReset: 'Ingresa el código de 6 dígitos y una nueva contraseña de al menos 6 caracteres.',
        resetDoneTitle: 'Contraseña Restablecida',
        resetDoneDesc: 'Tu sesión se ha iniciado automáticamente.',
        shortPass: 'La contraseña debe tener al menos 6 caracteres.',
        regPaused: 'Los nuevos registros están temporalmente pausados. Las cuentas existentes pueden iniciar sesión normalmente.',
        regPausedTitle: 'Registros temporalmente pausados',
        regPausedDesc: 'El registro de nuevas cuentas ha sido pausado temporalmente. Si ya tienes cuenta, cambia a Iniciar Sesión.',
        enterName: 'Por favor ingresa tu nombre completo.',
        passMismatch: 'Las contraseñas no coinciden. Verifica ambos campos.',
        acceptTerms: 'Por favor acepta los Términos de Servicio y la Política de Privacidad para continuar.',
        loginSuccessTitle: 'Sesión Iniciada',
        loginSuccessDesc: 'Bienvenido de nuevo.',
        regSuccessTitle: 'Cuenta Creada con Éxito',
        regSuccessDesc: '¡Bienvenido! Activa tu plan para crear, editar y descargar.',
        googleSuccessTitle: 'Autenticación Google Completada',
        googleSuccessDesc: 'Sesión sincronizada correctamente.',
        googleRedirecting: 'Abriendo selección de cuenta Google...',
        googleUnauthDomain: 'El acceso con Google no está autorizado en este dominio. Usa Correo y Contraseña abajo.',
        googleDomainTip1: 'Para activar Google en esta URL, añade',
        googleDomainTip2: 'a dominios autorizados o entra con tu correo abajo.',
        inAppWarning1: 'Navegador integrado detectado:',
        inAppWarning2: 'apps como WhatsApp o Instagram suelen bloquear Google. Toca',
        inAppWarning3: 'Abrir en Chrome / Safari',
        mobileReturnMsg: 'El navegador móvil regresó antes de confirmar con Google. Permite ventanas emergentes o entra con correo y contraseña abajo.',
        resetCodeLabel: 'Código de Verificación (6 dígitos)',
        resetCodePlaceholder: 'Ej: 482910',
        newPassLabel: 'Nueva Contraseña',
        newPassPlaceholder: 'Mínimo 6 caracteres',
        togglePassAria: 'Mostrar u ocultar contraseña',
        closeAria: 'Cerrar ventana de acceso',
        humanCheckTitle: 'Verificación Humana (Anti-Bots)',
        humanCheckHint: 'Suma los números de la imagen para continuar.',
        humanCheckPlaceholder: 'Suma',
        humanCheckRequired: 'Por favor suma los números de la imagen antes de crear tu cuenta.',
        humanCheckRefresh: 'Cambiar',
        humanCheckLoadErr: 'No se pudo cargar el reto. Pulsa actualizar.'
      },
      fr: {
        weak: 'Faible',
        medium: 'Moyenne',
        strong: 'Forte & Sécurisée',
        strengthLabel: 'Sécurité du mot de passe :',
        invalidEmail: 'Veuillez saisir une adresse e-mail valide.',
        invalidReset: 'Saisissez le code à 6 chiffres et un nouveau mot de passe d’au moins 6 caractères.',
        resetDoneTitle: 'Mot de passe réinitialisé',
        resetDoneDesc: 'Vous avez été connecté automatiquement.',
        shortPass: 'Le mot de passe doit contenir au moins 6 caractères.',
        regPaused: 'Les nouvelles inscriptions sont temporairement suspendues.',
        regPausedTitle: 'Inscriptions temporairement suspendues',
        regPausedDesc: 'La création de nouveaux comptes est momentanément désactivée. Passez à Connexion si vous avez déjà un compte.',
        enterName: 'Veuillez saisir votre nom complet.',
        passMismatch: 'Les mots de passe ne correspondent pas.',
        acceptTerms: 'Veuillez accepter les Conditions d’utilisation et la Politique de confidentialité.',
        loginSuccessTitle: 'Connecté',
        loginSuccessDesc: 'Bon retour.',
        regSuccessTitle: 'Compte Créé',
        regSuccessDesc: 'Bienvenue ! Activez votre offre pour créer, éditer et exporter.',
        googleSuccessTitle: 'Connexion Google Réussie',
        googleSuccessDesc: 'Session synchronisée avec succès.',
        googleRedirecting: 'Ouverture du sélecteur de compte Google...',
        googleUnauthDomain: 'Google Sign-In n’est pas encore autorisé sur ce domaine. Utilisez l’e-mail ci-dessous.',
        googleDomainTip1: 'Pour activer Google sur cette URL, ajoutez',
        googleDomainTip2: 'aux domaines autorisés ou connectez-vous par e-mail ci-dessous.',
        inAppWarning1: 'Navigateur intégré détecté :',
        inAppWarning2: 'des apps comme WhatsApp ou Instagram bloquent souvent Google. Touchez',
        inAppWarning3: 'Ouvrir dans Chrome / Safari',
        mobileReturnMsg: 'Le navigateur mobile est revenu avant la confirmation Google. Autorisez les fenêtres contextuelles ou utilisez l’e-mail ci-dessous.',
        resetCodeLabel: 'Code de vérification (6 chiffres)',
        resetCodePlaceholder: 'Ex : 482910',
        newPassLabel: 'Nouveau mot de passe',
        newPassPlaceholder: '6 caractères minimum',
        togglePassAria: 'Afficher ou masquer le mot de passe',
        closeAria: 'Fermer la fenêtre de connexion',
        humanCheckTitle: 'Vérification Humaine (Anti-Robots)',
        humanCheckHint: 'Additionnez les nombres dans l’image pour confirmer.',
        humanCheckPlaceholder: 'Total',
        humanCheckRequired: 'Veuillez additionner les nombres de l’image avant de créer un compte.',
        humanCheckRefresh: 'Actualiser',
        humanCheckLoadErr: 'Échec du chargement. Cliquez sur actualiser.'
      },
      de: {
        weak: 'Schwach',
        medium: 'Mittel',
        strong: 'Stark & Sicher',
        strengthLabel: 'Passwortsicherheit:',
        invalidEmail: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
        invalidReset: 'Geben Sie den 6-stelligen Code und ein neues Passwort mit mindestens 6 Zeichen ein.',
        resetDoneTitle: 'Passwort zurückgesetzt',
        resetDoneDesc: 'Sie wurden automatisch angemeldet.',
        shortPass: 'Das Passwort muss mindestens 6 Zeichen lang sein.',
        regPaused: 'Neuregistrierungen sind vorübergehend pausiert.',
        regPausedTitle: 'Registrierungen pausiert',
        regPausedDesc: 'Die Erstellung neuer Konten wurde vorübergehend deaktiviert. Wechseln Sie zur Anmeldung, falls Sie schon ein Konto besitzen.',
        enterName: 'Bitte geben Sie Ihren vollständigen Namen ein.',
        passMismatch: 'Die Passwörter stimmen nicht überein.',
        acceptTerms: 'Bitte akzeptieren Sie die Nutzungsbedingungen und Datenschutzrichtlinie.',
        loginSuccessTitle: 'Angemeldet',
        loginSuccessDesc: 'Willkommen zurück.',
        regSuccessTitle: 'Konto erstellt',
        regSuccessDesc: 'Willkommen! Aktivieren Sie einen Tarif für Bearbeitung und Export.',
        googleSuccessTitle: 'Google-Anmeldung erfolgreich',
        googleSuccessDesc: 'Sitzung erfolgreich synchronisiert.',
        googleRedirecting: 'Google-Kontoauswahl wird geöffnet...',
        googleUnauthDomain: 'Google Sign-In ist für diese Domain noch nicht freigeschaltet. Nutzen Sie E-Mail & Passwort unten.',
        googleDomainTip1: 'Um Google hier zu aktivieren, fügen Sie',
        googleDomainTip2: 'zu den autorisierten Domains hinzu oder melden Sie sich per E-Mail an.',
        inAppWarning1: 'In-App-Browser erkannt:',
        inAppWarning2: 'Apps wie WhatsApp oder Instagram blockieren oft Google. Tippen Sie auf',
        inAppWarning3: 'In Chrome / Safari öffnen',
        mobileReturnMsg: 'Der mobile Browser ist zurückgekehrt, bevor Google bestätigt wurde. Nutzen Sie E-Mail & Passwort unten.',
        resetCodeLabel: 'Bestätigungscode (6 Ziffern)',
        resetCodePlaceholder: 'z. B. 482910',
        newPassLabel: 'Neues Passwort',
        newPassPlaceholder: 'Mindestens 6 Zeichen',
        togglePassAria: 'Passwort anzeigen oder verbergen',
        closeAria: 'Anmeldefenster schließen',
        humanCheckTitle: 'Menschliche Prüfung (Bot-Schutz)',
        humanCheckHint: 'Addieren Sie die Zahlen im Bild zur Bestätigung.',
        humanCheckPlaceholder: 'Summe',
        humanCheckRequired: 'Bitte addieren Sie die Zahlen im Bild vor der Registrierung.',
        humanCheckRefresh: 'Neu laden',
        humanCheckLoadErr: 'Konnte nicht geladen werden. Bitte neu laden.'
      },
      it: {
        weak: 'Debole',
        medium: 'Media',
        strong: 'Forte e Sicura',
        strengthLabel: 'Sicurezza password:',
        invalidEmail: 'Inserisci un indirizzo email valido.',
        invalidReset: 'Inserisci il codice a 6 cifre e una nuova password di almeno 6 caratteri.',
        resetDoneTitle: 'Password reimpostata',
        resetDoneDesc: 'Accesso effettuato automaticamente.',
        shortPass: 'La password deve contenere almeno 6 caratteri.',
        regPaused: 'Le nuove registrazioni sono temporaneamente sospese.',
        regPausedTitle: 'Registrazioni temporaneamente sospese',
        regPausedDesc: 'La creazione di nuovi account è momentaneamente disabilitata. Passa ad Accedi se hai già un account.',
        enterName: 'Inserisci il tuo nome completo.',
        passMismatch: 'Le password non corrispondono.',
        acceptTerms: 'Accetta i Termini di Servizio e l’Informativa sulla Privacy per continuare.',
        loginSuccessTitle: 'Accesso effettuato',
        loginSuccessDesc: 'Bentornato.',
        regSuccessTitle: 'Account creato',
        regSuccessDesc: 'Benvenuto! Attiva un piano per modificare ed esportare.',
        googleSuccessTitle: 'Accesso Google completato',
        googleSuccessDesc: 'Sessione sincronizzata con successo.',
        googleRedirecting: 'Apertura selezione account Google...',
        googleUnauthDomain: 'L’accesso Google non è ancora autorizzato su questo dominio. Usa Email e Password qui sotto.',
        googleDomainTip1: 'Per abilitare Google su questo URL, aggiungi',
        googleDomainTip2: 'ai domini autorizzati oppure accedi con email qui sotto.',
        inAppWarning1: 'Browser in-app rilevato:',
        inAppWarning2: 'app come WhatsApp o Instagram bloccano spesso Google. Tocca',
        inAppWarning3: 'Apri in Chrome / Safari',
        mobileReturnMsg: 'Il browser mobile è tornato prima di completare l’accesso Google. Consenti i pop-up o accedi con Email e Password qui sotto.',
        resetCodeLabel: 'Codice di verifica (6 cifre)',
        resetCodePlaceholder: 'Es: 482910',
        newPassLabel: 'Nuova Password',
        newPassPlaceholder: 'Minimo 6 caratteri',
        togglePassAria: 'Mostra o nascondi password',
        closeAria: 'Chiudi finestra di accesso',
        humanCheckTitle: 'Verifica Umana (Anti-Bot)',
        humanCheckHint: 'Somma i numeri nell’immagine per continuare.',
        humanCheckPlaceholder: 'Somma',
        humanCheckRequired: 'Somma i numeri nell’immagine prima di registrarti.',
        humanCheckRefresh: 'Aggiorna',
        humanCheckLoadErr: 'Impossibile caricare la sfida. Riprova.'
      }
    };
    return map[siteLanguage] || map.pt;
  }, [siteLanguage]);

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(defaultMode);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // 2-step password reset state when Firebase email reset is active
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [resetCode, setResetCode] = useState<string>('');
  const [newResetPassword, setNewResetPassword] = useState<string>('');
  const [googleDomainWarning, setGoogleDomainWarning] = useState<string | null>(null);
  const [captchaChallenge, setCaptchaChallenge] = useState<{
    challengeId: string;
    challengeToken: string;
    imageUrl: string;
    botProtectionEnabled: boolean;
  } | null>(null);
  const [captchaLoading, setCaptchaLoading] = useState<boolean>(false);
  const [captchaError, setCaptchaError] = useState<boolean>(false);
  const [captchaAnswer, setCaptchaAnswer] = useState<string>('');
  const [honeypotWebsite, setHoneypotWebsite] = useState<string>('');
  const [honeypotPhone, setHoneypotPhone] = useState<string>('');

  const errorBannerRef = React.useRef<HTMLDivElement | null>(null);
  const bodyScrollRef = React.useRef<HTMLDivElement | null>(null);
  const googleInFlightRef = React.useRef<boolean>(false);

  const loadSignupChallenge = React.useCallback(async () => {
    setCaptchaLoading(true);
    setCaptchaError(false);
    setCaptchaAnswer('');
    try {
      const res = await fetch('/api/auth/signup-challenge', { cache: 'no-store', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (data?.challengeId && data?.challengeToken && data?.imageUrl) {
        setCaptchaChallenge({
          challengeId: data.challengeId,
          challengeToken: data.challengeToken,
          imageUrl: data.imageUrl,
          botProtectionEnabled: data.botProtectionEnabled !== false
        });
      } else {
        setCaptchaError(true);
      }
    } catch {
      setCaptchaError(true);
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  const isInAppBrowser = React.useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /FBAN|FBAV|Instagram|WhatsApp|Line\/|MicroMessenger|BytedanceWebview|TikTok|LinkedInApp|; wv\)/i.test(
      navigator.userAgent || ''
    );
  }, []);

  const [platformSettings, setPlatformSettings] = useState(() => getStoredPlatformSettingsSync());

  useEffect(() => {
    const syncHandler = () => setPlatformSettings(getStoredPlatformSettingsSync());
    window.addEventListener('admin-config-updated', syncHandler);
    return () => window.removeEventListener('admin-config-updated', syncHandler);
  }, []);

  // Always synchronize active tab & reset transient errors whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setError(authRedirectError || null);
      setSuccessInfo(null);
      setGoogleDomainWarning(null);
      setPassword('');
      setConfirmPassword('');
      setCaptchaAnswer('');
      setHoneypotWebsite('');
      setHoneypotPhone('');
      setResetStep('request');
      setResetCode('');
      setNewResetPassword('');
      setLoading(false);
      setGoogleLoading(false);
      googleInFlightRef.current = false;
    }
  }, [isOpen, defaultMode, authRedirectError]);

  // Fetch a fresh anti-bot challenge whenever registration tab is active
  useEffect(() => {
    if (
      isOpen &&
      mode === 'register' &&
      platformSettings.allowNewRegistrations !== false &&
      platformSettings.enableBotProtection !== false
    ) {
      void loadSignupChallenge();
    }
  }, [
    isOpen,
    mode,
    platformSettings.allowNewRegistrations,
    platformSettings.enableBotProtection,
    loadSignupChallenge
  ]);

  // Auto-close modal seamlessly if Firebase auth completes via listener or redirect
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      googleInFlightRef.current = false;
      setGoogleLoading(false);
      setLoading(false);
      clearAuthRedirectError();
      onClose();
    }
  }, [isOpen, isAuthenticated, onClose, clearAuthRedirectError]);

  // Recover gracefully on mobile if the OAuth popup closes or loses window.opener silently on return
  useEffect(() => {
    if (!isOpen || !googleLoading || typeof document === 'undefined' || typeof window === 'undefined') return;
    const isMobileEnv =
      /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '') ||
      Boolean(window.matchMedia?.('(pointer: coarse)')?.matches);
    if (!isMobileEnv) return;

    let recoveryTimer: ReturnType<typeof setTimeout> | null = null;
    let leftForeground = false;

    const markLeftForeground = () => {
      leftForeground = true;
      if (recoveryTimer) {
        clearTimeout(recoveryTimer);
        recoveryTimer = null;
      }
    };

    const scheduleReturnRecovery = () => {
      if (!leftForeground || !googleInFlightRef.current) return;
      if (recoveryTimer) clearTimeout(recoveryTimer);
      recoveryTimer = setTimeout(() => {
        if (googleInFlightRef.current && !isAuthenticated) {
          googleInFlightRef.current = false;
          setGoogleLoading(false);
          setLoading(false);
          setError(authFeedback.mobileReturnMsg);
        }
      }, 4500);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        markLeftForeground();
      } else if (document.visibilityState === 'visible') {
        scheduleReturnRecovery();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', markLeftForeground);
    window.addEventListener('focus', scheduleReturnRecovery);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', markLeftForeground);
      window.removeEventListener('focus', scheduleReturnRecovery);
      if (recoveryTimer) clearTimeout(recoveryTimer);
    };
  }, [isOpen, googleLoading, isAuthenticated]);

  // Prevent background page scroll on mobile while modal is open
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Scroll inline feedback into view on mobile viewports when errors/success messages appear
  useEffect(() => {
    if (error && errorBannerRef.current) {
      errorBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [error]);

  if (!isOpen) return null;

  const allowNewRegistrations = platformSettings.allowNewRegistrations !== false;
  const botProtectionEnabled =
    platformSettings.enableBotProtection !== false &&
    (captchaChallenge ? captchaChallenge.botProtectionEnabled : true);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: '', color: '' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, text: authFeedback.weak, color: 'bg-rose-500 text-rose-600' };
    if (score <= 3) return { score: 2, text: authFeedback.medium, color: 'bg-amber-500 text-amber-600' };
    return { score: 3, text: authFeedback.strong, color: 'bg-emerald-500 text-emerald-600' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError(authFeedback.invalidEmail);
      return;
    }

    if (mode === 'forgot') {
      if (resetStep === 'request') {
        setLoading(true);
        try {
          const result = await resetPassword(cleanEmail);
          setSuccessInfo(result.message);
        } catch (err: any) {
          setError(getAuthErrorMessage(err));
        } finally {
          setLoading(false);
        }
        return;
      }

      if (!resetCode.trim() || newResetPassword.length < 6) {
        setError(authFeedback.invalidReset);
        return;
      }

      setLoading(true);
      try {
        await completePasswordReset(cleanEmail, resetCode, newResetPassword);
        showSuccess(authFeedback.resetDoneTitle, authFeedback.resetDoneDesc);
        onClose();
      } catch (err: any) {
        setError(getAuthErrorMessage(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setError(authFeedback.shortPass);
      return;
    }

    if (mode === 'register') {
      if (!allowNewRegistrations) {
        setError(authFeedback.regPaused);
        return;
      }
      if (!name.trim()) {
        setError(authFeedback.enterName);
        return;
      }
      if (confirmPassword !== password) {
        setError(authFeedback.passMismatch);
        return;
      }
      if (botProtectionEnabled && !captchaAnswer.trim()) {
        setError(authFeedback.humanCheckRequired);
        return;
      }
      if (!agreeTerms) {
        setError(authFeedback.acceptTerms);
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(cleanEmail, password, rememberMe);
        showSuccess(authFeedback.loginSuccessTitle, authFeedback.loginSuccessDesc);
      } else {
        await register(name.trim(), cleanEmail, password, targetRole.trim(), rememberMe, {
          challengeId: captchaChallenge?.challengeId,
          challengeToken: captchaChallenge?.challengeToken,
          challengeAnswer: captchaAnswer.trim(),
          website: honeypotWebsite,
          companyPhone: honeypotPhone
        });
        showSuccess(authFeedback.regSuccessTitle, authFeedback.regSuccessDesc);
        onRegistrationSuccess?.();
      }
      onClose();
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
      if (
        mode === 'register' &&
        (err?.code === 'auth/captcha-expired' ||
          err?.code === 'auth/captcha-invalid' ||
          err?.code === 'auth/bot-detected')
      ) {
        void loadSignupChallenge();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProviderLogin = async (provider: 'google' | 'linkedin') => {
    clearAuthRedirectError();
    setError(null);
    setSuccessInfo(null);
    setGoogleDomainWarning(null);
    setLoading(true);
    setGoogleLoading(true);
    googleInFlightRef.current = true;
    try {
      const ok = await loginWithProvider(provider);
      googleInFlightRef.current = false;
      if (ok) {
        showSuccess(authFeedback.googleSuccessTitle, authFeedback.googleSuccessDesc);
        onClose();
      } else {
        // Redirecting away via signInWithRedirect
        setSuccessInfo(authFeedback.googleRedirecting);
      }
    } catch (err: any) {
      googleInFlightRef.current = false;
      if (err?.code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : '';
        setGoogleDomainWarning(host || 'domain');
        setError(authFeedback.googleUnauthDomain);
      } else {
        setError(getAuthErrorMessage(err));
      }
    } finally {
      googleInFlightRef.current = false;
      setGoogleLoading(false);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-slate-200 w-full sm:max-w-md flex flex-col max-h-[94dvh] sm:max-h-[90dvh] overflow-hidden">
        {/* Sticky Modal Header */}
        <div className="bg-[#0B0F17] text-white px-5 py-4 sm:px-6 sm:py-5 relative shrink-0 border-b border-slate-800">
          <button
            type="button"
            onClick={() => {
              clearAuthRedirectError();
              onClose();
            }}
            className="absolute top-3 right-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors touch-manipulation"
            aria-label={authFeedback.closeAria}
          >
            <X className="w-5 h-5" />
          </button>

          <p className="text-[11px] font-medium tracking-wide uppercase text-amber-400 mb-1 pr-10">
            {a.kicker}
          </p>

          <h2 id="auth-modal-title" className="text-lg sm:text-xl font-bold tracking-tight pr-10">
            {mode === 'login' && a.loginTitle}
            {mode === 'register' && a.registerTitle}
            {mode === 'forgot' && a.forgotTitle}
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' && a.loginSubtitle}
            {mode === 'register' && a.registerSubtitle}
            {mode === 'forgot' && a.forgotSubtitle}
          </p>

          {promptMessage && (
            <div className="mt-3 bg-amber-500/15 border border-amber-400/35 rounded-lg p-2.5 flex items-start gap-2 text-amber-100 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{promptMessage}</span>
            </div>
          )}

          {/* Mode Switcher */}
          {mode !== 'forgot' && (
            <div className="mt-4 grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessInfo(null);
                  setGoogleDomainWarning(null);
                  bodyScrollRef.current?.scrollTo({ top: 0 });
                }}
                className={`min-h-[42px] py-2 px-3 text-xs font-semibold rounded-md transition-colors touch-manipulation ${
                  mode === 'login'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {a.tabLogin}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setSuccessInfo(null);
                  setGoogleDomainWarning(null);
                  bodyScrollRef.current?.scrollTo({ top: 0 });
                }}
                className={`min-h-[42px] py-2 px-3 text-xs font-semibold rounded-md transition-colors touch-manipulation ${
                  mode === 'register'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {a.tabRegister}
              </button>
            </div>
          )}
        </div>

        {/* Single Scrollable Form Body (No nested scroll traps on mobile keyboards) */}
        <div
          ref={bodyScrollRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 pb-8 space-y-4"
        >
          {mode === 'register' && !allowNewRegistrations && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{authFeedback.regPausedTitle}</p>
                <p className="text-[11px] mt-0.5">{authFeedback.regPausedDesc}</p>
              </div>
            </div>
          )}

          {error && (
            <div
              ref={errorBannerRef}
              role="alert"
              className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <span className="font-medium leading-relaxed block">{error}</span>
                {googleDomainWarning && (
                  <p className="text-[11px] text-rose-700 bg-white/80 border border-rose-200 rounded-md px-2.5 py-1.5 leading-relaxed">
                    {authFeedback.googleDomainTip1}{' '}
                    <code className="font-mono font-semibold text-slate-900 select-all">{googleDomainWarning}</code>{' '}
                    {authFeedback.googleDomainTip2}
                  </p>
                )}
              </div>
            </div>
          )}

          {successInfo && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span>{successInfo}</span>
              </div>
            </div>
          )}

          {/* Social Logins */}
          {mode !== 'forgot' && (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleProviderLogin('google')}
                disabled={loading}
                className="w-full min-h-[46px] flex items-center justify-center gap-2.5 py-2.5 px-4 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 rounded-lg text-sm sm:text-xs font-semibold text-slate-800 transition-colors touch-manipulation"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-600 shrink-0" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{googleLoading ? a.googleLoading : a.googleBtn}</span>
              </button>

              {isInAppBrowser && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed">
                  <strong>{authFeedback.inAppWarning1}</strong> {authFeedback.inAppWarning2}{' '}
                  <strong>{authFeedback.inAppWarning3}</strong>.
                </div>
              )}

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-medium text-slate-400 relative z-10 whitespace-nowrap">
                  {a.dividerOr}
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>
            </div>
          )}

          {/* Form (noValidate prevents silent native HTML5 bubble failures in scrolled mobile views) */}
          <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label htmlFor="auth-name" className="block text-xs font-semibold text-slate-800 mb-1">
                    {a.fullNameLabel}
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-name"
                      type="text"
                      autoComplete="name"
                      autoCapitalize="words"
                      enterKeyHint="next"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={a.fullNamePlaceholder}
                      className="w-full min-h-[44px] text-base sm:text-sm pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/15 transition-colors bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-role" className="block text-xs font-semibold text-slate-800 mb-1">
                    {a.targetRoleLabel}
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-role"
                      type="text"
                      enterKeyHint="next"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder={a.targetRolePlaceholder}
                      className="w-full min-h-[44px] text-base sm:text-sm pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/15 transition-colors bg-white text-slate-900"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-800 mb-1">
                {a.emailLabel}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={mode === 'forgot' && resetStep === 'verify'}
                  placeholder={a.emailPlaceholder}
                  className="w-full min-h-[44px] text-base sm:text-sm pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/15 disabled:bg-slate-50 transition-colors bg-white text-slate-900"
                />
              </div>
            </div>

            {mode === 'forgot' && resetStep === 'verify' && (
              <>
                <div>
                  <label htmlFor="auth-reset-code" className="block text-xs font-semibold text-slate-800 mb-1">
                    {authFeedback.resetCodeLabel}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-reset-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder={authFeedback.resetCodePlaceholder}
                      className="w-full min-h-[44px] text-base sm:text-sm font-mono pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/15 bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-reset-pass" className="block text-xs font-semibold text-slate-800 mb-1">
                    {authFeedback.newPassLabel}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-reset-pass"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={newResetPassword}
                      onChange={(e) => setNewResetPassword(e.target.value)}
                      placeholder={authFeedback.newPassPlaceholder}
                      className="w-full min-h-[44px] text-base sm:text-sm pl-10 pr-12 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/15 bg-white text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 touch-manipulation"
                      aria-label={authFeedback.togglePassAria}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {mode !== 'forgot' && (
              <div>
                <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-800 mb-1">
                  {a.passwordLabel}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    enterKeyHint={mode === 'login' ? 'done' : 'next'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={a.passwordPlaceholder}
                    className="w-full min-h-[44px] text-base sm:text-sm pl-10 pr-12 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/15 transition-colors bg-white text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 touch-manipulation"
                    aria-label={authFeedback.togglePassAria}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength visualizer for registration */}
                {mode === 'register' && password && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full flex-1 rounded-full ${
                          strength.score >= 1 ? strength.color.split(' ')[0] : 'bg-slate-200'
                        }`}
                      />
                      <div
                        className={`h-full flex-1 rounded-full ${
                          strength.score >= 2 ? strength.color.split(' ')[0] : 'bg-slate-200'
                        }`}
                      />
                      <div
                        className={`h-full flex-1 rounded-full ${
                          strength.score >= 3 ? strength.color.split(' ')[0] : 'bg-slate-200'
                        }`}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">
                      {authFeedback.strengthLabel}{' '}
                      <strong className={strength.color.split(' ')[1]}>{strength.text}</strong>
                    </span>
                  </div>
                )}
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label htmlFor="auth-confirm-password" className="block text-xs font-semibold text-slate-800 mb-1">
                  {a.confirmPasswordLabel}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    enterKeyHint="done"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={a.confirmPasswordPlaceholder}
                    className={`w-full min-h-[44px] text-base sm:text-sm pl-10 pr-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white text-slate-900 ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                        : 'border-slate-300 focus:border-slate-900 focus:ring-slate-900/15'
                    }`}
                  />
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">
                    {authFeedback.passMismatch}
                  </p>
                )}
              </div>
            )}

            {/* Checkboxes & Helpers */}
            {mode === 'login' && (
              <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
                <label className="flex items-center gap-2 min-h-[44px] cursor-pointer text-slate-600 font-medium touch-manipulation">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span>{a.rememberMe}</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setResetStep('request');
                    setError(null);
                    setSuccessInfo(null);
                  }}
                  className="min-h-[44px] px-1 text-slate-600 hover:text-slate-950 font-semibold underline touch-manipulation"
                >
                  {a.forgotPasswordLink}
                </button>
              </div>
            )}

            {mode === 'register' && allowNewRegistrations && botProtectionEnabled && (
              <>
                {/* Invisible anti-bot honeypot traps (never visible or focusable for humans) */}
                <div
                  aria-hidden="true"
                  className="absolute -left-[9999px] top-auto w-px h-px overflow-hidden opacity-0 pointer-events-none"
                >
                  <label htmlFor="hp-website">Website</label>
                  <input
                    id="hp-website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypotWebsite}
                    onChange={(e) => setHoneypotWebsite(e.target.value)}
                  />
                  <label htmlFor="hp-company-phone">Company Phone</label>
                  <input
                    id="hp-company-phone"
                    name="companyPhone"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypotPhone}
                    onChange={(e) => setHoneypotPhone(e.target.value)}
                  />
                </div>

                {/* Addition CAPTCHA Box */}
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/90 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{authFeedback.humanCheckTitle}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => void loadSignupChallenge()}
                      disabled={captchaLoading}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-950 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${captchaLoading ? 'animate-spin' : ''}`} />
                      <span>{authFeedback.humanCheckRefresh}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="shrink-0 h-[48px] w-[176px] rounded-lg border border-slate-200 bg-white flex items-center justify-center overflow-hidden">
                      {captchaLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      ) : captchaChallenge?.imageUrl ? (
                        <img
                          src={captchaChallenge.imageUrl}
                          alt={authFeedback.humanCheckTitle}
                          className="w-full h-full object-contain select-none pointer-events-none"
                          draggable={false}
                        />
                      ) : (
                        <span className="text-[10px] text-rose-600 px-2 text-center leading-tight">
                          {captchaError ? authFeedback.humanCheckLoadErr : '...'}
                        </span>
                      )}
                    </div>

                    <input
                      id="auth-captcha-answer"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={3}
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value.replace(/\D/g, ''))}
                      placeholder={authFeedback.humanCheckPlaceholder}
                      aria-label={authFeedback.humanCheckTitle}
                      className="flex-1 min-w-[90px] min-h-[48px] text-center font-mono text-base font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/15 bg-white text-slate-900"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 leading-snug">
                    {authFeedback.humanCheckHint}
                  </p>
                </div>
              </>
            )}

            {mode === 'register' && (
              <div className="pt-0.5">
                <label className="flex items-start gap-2.5 py-1.5 cursor-pointer text-xs text-slate-600 touch-manipulation">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-slate-900 focus:ring-slate-900 shrink-0"
                  />
                  <span className="text-[11px] leading-relaxed">
                    {a.termsPrefix} <strong>{a.termsService}</strong> {a.termsAnd}{' '}
                    <strong>{a.termsPrivacy}</strong> {a.termsSuffix}
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'register' && !allowNewRegistrations)}
              className={`w-full min-h-[48px] py-3 px-4 ${
                mode === 'register'
                  ? 'bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950'
                  : 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white'
              } disabled:opacity-50 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm mt-2 touch-manipulation`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {loading
                  ? a.processing
                  : mode === 'login'
                  ? a.submitLogin
                  : mode === 'register'
                  ? a.submitRegister
                  : resetStep === 'verify'
                  ? a.submitResetConfirm
                  : a.submitForgot}
              </span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
            {mode !== 'forgot' && (
              <p className="text-[11px] text-center text-slate-500 pt-1 leading-relaxed">
                {mode === 'register' ? a.registerReassurance : a.loginReassurance}
              </p>
            )}
          </form>

          {/* Return link when on forgot view */}
          {mode === 'forgot' && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setResetStep('request');
                  setError(null);
                  setSuccessInfo(null);
                }}
                className="min-h-[44px] px-3 text-xs font-semibold text-slate-600 hover:text-slate-950 underline touch-manipulation"
              >
                {a.backToLogin}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
