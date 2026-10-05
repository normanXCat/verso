import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { presentAuthError, type PresentedAuthError } from '../../lib/auth-errors.js';
import { AuthLayout } from '../../components/auth/AuthLayout.js';
import { LinkAccountModal } from '../../components/auth/LinkAccountModal.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { FormError } from '../../components/ui/FormError.js';

export function LoginPage(): React.ReactElement {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get('oauth') === 'error';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<PresentedAuthError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  // Validation email en direct
  const isEmailValid = email.length > 0 ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) : undefined;

  const submit = async (): Promise<void> => {
    setError(null);
    setShake(false);
    setIsLoading(true);

    try {
      await login({ email, password, rememberMe });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/app');
      }, 600);
    } catch (err) {
      setShake(true);
      setError(presentAuthError(err));
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    void submit();
  };

  return (
    <AuthLayout
      title="Connexion à l'atelier"
      subtitle="Retrouvez vos mesures, brouillons et projets d'albums."
      showSocial
      quote={{
        lines: [
          'La nuit avance, la feuille attend.',
          'Chaque mot posé est un pas de plus vers ce qui refuse de s’éteindre.',
          'Garder la cadence, coûte que coûte.',
        ],
        author: 'Note d’atelier Verso',
        detail: 'Session de minuit • 88 BPM',
      }}
      footer={
        <span>
          Pas encore de compte ?{' '}
          <Link
            to="/register"
            className="text-paper-accent font-medium hover:underline transition-all"
          >
            Créer un carnet d'écriture
          </Link>
        </span>
      }
    >
      <LinkAccountModal />

      {oauthError && (
        <div
          role="alert"
          className="mb-5 p-3 rounded-lg border border-paper-accent/40 bg-paper-accent/10 text-xs font-sans text-paper-accent"
        >
          La connexion via le fournisseur a échoué. Réessayez ou utilisez votre adresse email.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Adresse email avec label flottant et icône de validation */}
        <Input
          label="Adresse email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="artiste@verso.fr"
          isValid={isEmailValid}
        />

        {/* Mot de passe avec bascule afficher/masquer */}
        <div className="space-y-1">
          <Input
            label="Mot de passe"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
          />
          <div className="flex justify-end pt-1">
            <Link
              to="/forgot-password"
              className="text-xs font-mono text-paper-muted hover:text-paper-accent transition-colors"
            >
              Mot de passe oublié ?
            </Link>
          </div>
        </div>

        {/* Case à cocher Se souvenir de moi */}
        <div className="flex items-center gap-2.5 pt-1">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-paper-border text-paper-accent focus:ring-paper-accent bg-paper-bg cursor-pointer"
          />
          <label
            htmlFor="rememberMe"
            className="text-xs text-paper-muted hover:text-paper-text cursor-pointer select-none font-sans"
          >
            Mémoriser cette session sur cet appareil (30 jours)
          </label>
        </div>

        {/* Message d'erreur accessible avec réessai */}
        <FormError error={error} onRetry={() => void submit()} />

        {/* Bouton d'action avec gestion du chargement, du succès et de la secousse d'erreur */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          className="mt-2"
          isLoading={isLoading}
          loadingText="Vérification des accès..."
          isSuccess={isSuccess}
          successText="Connexion réussie"
          shake={shake}
          iconRight={<ArrowRight />}
        >
          Accéder à mon espace
        </Button>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
