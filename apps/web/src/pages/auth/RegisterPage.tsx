import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { presentAuthError, type PresentedAuthError } from '../../lib/auth-errors.js';
import { AuthLayout } from '../../components/auth/AuthLayout.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { FormError } from '../../components/ui/FormError.js';

export function RegisterPage(): React.ReactElement {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<PresentedAuthError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  // Validation en direct
  const isEmailValid = email.length > 0 ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) : undefined;
  const isPasswordValid =
    password.length > 0
      ? password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password)
      : undefined;

  const submit = async (): Promise<void> => {
    setError(null);
    setShake(false);
    setIsLoading(true);

    try {
      await register({
        email,
        password,
        displayName: displayName.trim() || undefined,
      });
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
      title="Ouvrir un carnet d'artiste"
      subtitle="Chaque mesure est pesée, sauvegardée et protégée dès le premier mot."
      showSocial
      quote={{
        lines: [
          'Tout commence par une page vierge,',
          'une mesure nue et le courage d’y graver sa propre voix.',
          'Rien ne s’efface quand l’encre est sincère.',
        ],
        author: 'Genèse d’Atelier',
        detail: 'Cahier N° 01 • Règle d’écriture',
      }}
      footer={
        <span>
          Vous avez déjà un compte ?{' '}
          <Link
            to="/login"
            className="text-paper-accent font-medium hover:underline transition-all"
          >
            Se connecter
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Adresse email avec validation en direct */}
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

        {/* Nom d'artiste / Nom de plume */}
        <Input
          label="Nom de plume ou nom d'artiste (optionnel)"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="MC Plume"
          maxLength={50}
        />

        {/* Mot de passe avec jauge de force segmentée */}
        <Input
          label="Mot de passe"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          showPasswordStrength
          isValid={isPasswordValid}
          hint="8 caractères minimum, 1 majuscule, 1 chiffre et 1 symbole."
        />

        {/* Message d'erreur accessible avec détail par champ et réessai */}
        <FormError error={error} onRetry={() => void submit()} />

        {/* Bouton de soumission */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          className="mt-2"
          isLoading={isLoading}
          loadingText="Création de votre carnet..."
          isSuccess={isSuccess}
          successText="Carnet initialisé avec succès"
          shake={shake}
          iconRight={<ArrowRight />}
        >
          Créer mon carnet d'écriture
        </Button>
      </form>
    </AuthLayout>
  );
}

export default RegisterPage;
