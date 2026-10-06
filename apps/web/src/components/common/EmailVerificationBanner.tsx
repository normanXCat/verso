import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MailWarning, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { authClient, AuthApiError } from '../../lib/auth-client.js';
import { Button } from '../ui/Button.js';

/** Clé de session : le rappel masqué ne revient pas avant la prochaine session de navigateur. */
const DISMISS_KEY = 'verso-email-banner-dismissed';

/** Délai (secondes) avant de pouvoir demander un nouvel envoi. */
const RESEND_COOLDOWN_SECONDS = 30;

type BannerStatus = 'idle' | 'loading' | 'sent' | 'error';

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Rappel persistant de vérification d'adresse email.
 *
 * Le bandeau est placé **dans le flux**, en tête du document, au-dessus de la barre de
 * navigation : il ne peut donc jamais la recouvrir. Il publie sa hauteur réelle dans la
 * variable CSS `--banner-h`, ce qui permet aux éléments positionnés en `fixed`
 * (bouton de mode concentration de l'éditeur) de se décaler d'autant.
 *
 * Toutes les couleurs proviennent des jetons du thème (`paper-*`), jamais de valeurs
 * codées en dur, pour rester conforme AA en clair comme en sombre.
 */
export function EmailVerificationBanner(): React.ReactElement | null {
  const { user, isAuthenticated, isEmailVerified } = useAuth();
  const [status, setStatus] = useState<BannerStatus>('idle');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [dismissed, setDismissed] = useState(readDismissed);
  const bannerRef = useRef<HTMLElement | null>(null);

  const visible = isAuthenticated && Boolean(user) && !isEmailVerified && !dismissed;

  // Publie la hauteur du bandeau dans `--banner-h` pour les éléments `fixed`.
  useEffect(() => {
    const root = document.documentElement;
    const node = bannerRef.current;

    if (!visible || !node) {
      root.style.setProperty('--banner-h', '0px');
      return;
    }

    const sync = (): void => {
      root.style.setProperty('--banner-h', `${Math.round(node.getBoundingClientRect().height)}px`);
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    window.addEventListener('resize', sync, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sync);
      root.style.setProperty('--banner-h', '0px');
    };
  }, [visible]);

  // Décompte du délai avant un nouvel envoi.
  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = window.setTimeout(() => setCooldown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleResend = useCallback(async (): Promise<void> => {
    if (status === 'loading' || cooldown > 0) {
      return;
    }

    setStatus('loading');
    setFeedback(null);

    try {
      const res = await authClient.resendVerification();
      setStatus('sent');
      setFeedback(res.message || 'Email envoyé.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setStatus('error');
      setFeedback(
        err instanceof AuthApiError
          ? err.message
          : "Impossible de renvoyer l'email pour le moment.",
      );
      setCooldown(RESEND_COOLDOWN_SECONDS);
    }
  }, [status, cooldown]);

  const handleDismiss = useCallback((): void => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Stockage indisponible (navigation privée stricte) : le masquage reste en mémoire.
    }
    setDismissed(true);
  }, []);

  if (!visible || !user) {
    return null;
  }

  const isBusy = status === 'loading';
  const isCoolingDown = cooldown > 0;

  return (
    <aside
      ref={bannerRef}
      role="status"
      aria-label="Vérification de l'adresse email requise"
      data-verso-email-banner
      className="w-full border-b border-paper-border bg-paper-surface text-paper-text"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6 md:flex-nowrap md:px-12">
        <p className="flex min-w-0 items-center gap-2 text-[13px] leading-snug md:whitespace-nowrap">
          <MailWarning className="h-4 w-4 shrink-0 text-paper-accent" aria-hidden="true" />
          <span className="min-w-0">
            Vérifie ton adresse email (<strong className="font-medium">{user.email}</strong>) pour
            activer ton compte.
          </span>
        </p>

        <div className="flex shrink-0 items-center gap-2">
          {feedback && (
            <span
              className={`text-xs font-medium ${
                status === 'error' ? 'text-paper-accent' : 'text-paper-muted'
              }`}
            >
              {feedback}
              {isCoolingDown && status === 'sent' ? ` Nouvel envoi dans ${cooldown} s.` : ''}
            </span>
          )}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={isBusy}
            disabled={isBusy || isCoolingDown}
            onClick={() => void handleResend()}
          >
            {status === 'sent' ? 'Email envoyé' : "Renvoyer l'email"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            iconOnly
            aria-label="Masquer ce rappel pour cette session"
            title="Masquer ce rappel"
            iconLeft={<X className="h-4 w-4" />}
            onClick={handleDismiss}
          />
        </div>
      </div>
    </aside>
  );
}
