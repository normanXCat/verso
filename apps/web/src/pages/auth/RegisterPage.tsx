import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { AuthApiError } from '../../lib/auth-client.js';
import { AuthLayout } from '../../components/auth/AuthLayout.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';

export function RegisterPage(): React.ReactElement {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
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

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
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
        navigate('/');
      }, 600);
    } catch (err) {
      setShake(true);
      if (err instanceof AuthApiError) {
        setError(err.message);
      } else {
        setError("Une erreur inattendue est survenue lors de l'ouverture du carnet.");
      }
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
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

        {/* Message d'erreur */}
        {error && (
          <div className="p-3 rounded-lg border border-paper-accent/40 bg-paper-accent/10 text-xs font-mono text-paper-accent">
            {error}
          </div>
        )}

        {/* Bouton de soumission */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-2"
          isLoading={isLoading}
          loadingText="Création de votre carnet..."
          isSuccess={isSuccess}
          successText="Carnet initialisé avec succès"
          shake={shake}
        >
          Créer mon carnet d'écriture
        </Button>
      </form>
    </AuthLayout>
  );
}

export default RegisterPage;
