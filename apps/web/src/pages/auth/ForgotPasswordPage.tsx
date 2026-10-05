import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authClient, AuthApiError } from '../../lib/auth-client.js';
import { AuthLayout } from '../../components/auth/AuthLayout.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';

export function ForgotPasswordPage(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const isEmailValid = email.length > 0 ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) : undefined;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setShake(false);
    setIsLoading(true);

    try {
      const res = await authClient.forgotPassword({ email });
      setMessage(res.message);
    } catch (err) {
      setShake(true);
      if (err instanceof AuthApiError) {
        setError(err.message);
      } else {
        setError("Impossible d'envoyer le lien de réinitialisation. Veuillez réessayer.");
      }
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Récupérer l'accès"
      subtitle="Saisissez votre adresse email pour recevoir un lien d'accès sécurisé."
      quote={{
        lines: [
          'Ce qui est écrit ne s’efface pas.',
          'L’accès se rouvre, la plume reprend son cours.',
          'Chaque mot vous attend à la même ligne.',
        ],
        author: 'Archives de l’Atelier',
        detail: 'Sécurité & Restauration',
      }}
      footer={
        <Link to="/login" className="text-paper-accent font-medium hover:underline transition-all">
          Retour à la page de connexion
        </Link>
      }
    >
      {message ? (
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-emerald-600/40 bg-emerald-950/10 text-xs font-mono text-emerald-600 dark:text-emerald-400 leading-relaxed">
            {message}
          </div>
          <Link to="/login" className="block">
            <Button variant="secondary" fullWidth>
              Retour à la connexion
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Adresse email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="artiste@verso.fr"
            isValid={isEmailValid}
            hint="Un lien à usage unique valable 1 heure vous sera transmis."
          />

          {error && (
            <div className="p-3 rounded-lg border border-paper-accent/40 bg-paper-accent/10 text-xs font-mono text-paper-accent">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            isLoading={isLoading}
            loadingText="Transmission de la clé..."
            shake={shake}
          >
            Envoyer le lien de réinitialisation
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
