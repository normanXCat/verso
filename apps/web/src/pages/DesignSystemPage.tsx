import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Card } from '../components/ui/Card.js';
import { Tag } from '../components/ui/Tag.js';
import { Modal } from '../components/ui/Modal.js';
import { useToast } from '../components/ui/Toast.js';
import { ThemeToggle } from '../components/common/ThemeToggle.js';

export function DesignSystemPage(): React.ReactElement {
  const { toast } = useToast();

  const [inputText, setInputText] = useState('MC Plume');
  const [inputError, setInputError] = useState('');
  const [password, setPassword] = useState('Verso2026!');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBtnLoading, setIsBtnLoading] = useState(false);

  const simulateLoading = () => {
    setIsBtnLoading(true);
    setTimeout(() => setIsBtnLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-paper-bg text-paper-text paper-grain p-6 md:p-16 transition-colors duration-paper">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* En-tête */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-paper-border">
          <div className="space-y-2">
            <Link
              to="/"
              className="text-xs font-mono text-paper-accent hover:underline inline-block mb-1"
            >
              ← Retour à l'accueil
            </Link>
            <h1 className="font-serif text-4xl md:text-5xl font-normal tracking-tight">
              Design System — Encre & Papier
            </h1>
            <p className="text-sm text-paper-muted max-w-xl">
              Spécifications visuelles et bibliothèque de composants pour Verso. Cahier de rappeur,
              finition éditoriale sobre, typographie expressive et micro-interactions fluides.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle showLabel />
          </div>
        </header>

        {/* Section 1 : Palette de Tokens */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl tracking-tight flex items-center gap-3">
            <span>01.</span> Palette & Tokens
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="p-4 rounded-card border border-paper-border bg-paper-bg space-y-2">
              <div className="h-8 rounded bg-paper-bg border border-paper-border" />
              <p className="text-xs font-medium">Fond</p>
              <p className="text-[10px] font-mono text-paper-muted">--color-bg</p>
            </div>
            <div className="p-4 rounded-card border border-paper-border bg-paper-surface space-y-2 shadow-paper-sm">
              <div className="h-8 rounded bg-paper-surface border border-paper-border" />
              <p className="text-xs font-medium">Surface</p>
              <p className="text-[10px] font-mono text-paper-muted">--color-surface</p>
            </div>
            <div className="p-4 rounded-card border border-paper-border bg-paper-surface space-y-2">
              <div className="h-8 rounded bg-paper-text" />
              <p className="text-xs font-medium">Texte</p>
              <p className="text-[10px] font-mono text-paper-muted">--color-text</p>
            </div>
            <div className="p-4 rounded-card border border-paper-border bg-paper-surface space-y-2">
              <div className="h-8 rounded bg-paper-muted" />
              <p className="text-xs font-medium">Muted</p>
              <p className="text-[10px] font-mono text-paper-muted">--color-text-secondary</p>
            </div>
            <div className="p-4 rounded-card border border-paper-border bg-paper-surface space-y-2">
              <div className="h-8 rounded bg-paper-border" />
              <p className="text-xs font-medium">Bordure</p>
              <p className="text-[10px] font-mono text-paper-muted">--color-border</p>
            </div>
            <div className="p-4 rounded-card border border-paper-border bg-paper-surface space-y-2">
              <div className="h-8 rounded bg-paper-accent" />
              <p className="text-xs font-medium">Accent Unique</p>
              <p className="text-[10px] font-mono text-paper-accent">--color-accent</p>
            </div>
          </div>
        </section>

        {/* Section 2 : Typographie */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl tracking-tight flex items-center gap-3">
            <span>02.</span> Typographie
          </h2>
          <div className="space-y-6 p-6 rounded-panel border border-paper-border bg-paper-surface shadow-paper-sm">
            <div>
              <span className="text-[11px] font-mono text-paper-accent uppercase tracking-wider block mb-1">
                Instrument Serif (Titres & Hero)
              </span>
              <p className="font-serif text-4xl md:text-6xl font-normal leading-none tracking-tight">
                L'encre sèche, les rimes restent.
              </p>
            </div>

            <div className="pt-4 border-t border-paper-border/60">
              <span className="text-[11px] font-mono text-paper-accent uppercase tracking-wider block mb-1">
                Geist Sans (Interface & Corps)
              </span>
              <p className="text-base text-paper-text max-w-2xl leading-relaxed">
                Verso est un cahier numérique sans distraction pour les artistes du verbe. Chaque
                frappe est conservée, chaque version est indélébile.
              </p>
            </div>

            <div className="pt-4 border-t border-paper-border/60">
              <span className="text-[11px] font-mono text-paper-accent uppercase tracking-wider block mb-1">
                Geist Mono (BPM, syllabes, mesures)
              </span>
              <p className="font-mono text-sm text-paper-muted flex flex-wrap gap-6">
                <span>[01] 140 BPM</span>
                <span>[16 MESURES]</span>
                <span>[12 SYLLABES]</span>
                <span>[KEY: A MINOR]</span>
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 : Boutons & Actions */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl tracking-tight flex items-center gap-3">
            <span>03.</span> Boutons
          </h2>
          <div className="p-6 rounded-panel border border-paper-border bg-paper-surface space-y-6 shadow-paper-sm">
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary">Bouton Primaire</Button>
              <Button variant="secondary">Bouton Secondaire</Button>
              <Button variant="ghost">Bouton Fantôme</Button>
              <Button variant="danger">Bouton Danger</Button>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-paper-border/60">
              <Button size="sm" variant="secondary">
                Taille SM
              </Button>
              <Button size="md" variant="secondary">
                Taille MD
              </Button>
              <Button size="lg" variant="secondary">
                Taille LG
              </Button>
              <Button
                variant="primary"
                isLoading={isBtnLoading}
                onClick={simulateLoading}
                loadingText="Sauvegarde..."
              >
                Tester l'état de chargement
              </Button>
              <Button variant="primary" disabled>
                Désactivé
              </Button>
            </div>
          </div>
        </section>

        {/* Section 4 : Champs de Saisie Animés */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl tracking-tight flex items-center gap-3">
            <span>04.</span> Champs de Saisie Animés
          </h2>
          <div className="p-6 rounded-panel border border-paper-border bg-paper-surface space-y-6 shadow-paper-sm max-w-xl">
            <Input
              label="Nom d'artiste"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              isValid={inputText.length > 2}
              hint="Votre pseudonyme ou nom de plume."
            />

            <Input
              label="Validation d'erreur dynamique"
              value={inputError}
              onChange={(e) => {
                const val = e.target.value;
                setInputError(val);
              }}
              error={
                inputError.length > 0 && !inputError.includes('@')
                  ? "L'email doit comporter un symbole @"
                  : null
              }
              placeholder="artiste@verso.fr"
              hint="Tapez une adresse sans @ pour observer le message d'erreur animé."
            />

            <Input
              type="password"
              label="Mot de passe avec jauge de force"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showPasswordStrength
            />
          </div>
        </section>

        {/* Section 5 : Cartes & Détails de Cahier */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl tracking-tight flex items-center gap-3">
            <span>05.</span> Cartes & Cahier de Rappeur
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card interactive className="space-y-3">
              <div className="flex justify-between items-center">
                <Tag variant="neutral" mono>
                  TEXTE #12
                </Tag>
                <Tag variant="draft">Brouillon</Tag>
              </div>
              <h3 className="font-serif text-2xl">Freestyle Nocturne</h3>
              <p className="text-xs text-paper-muted font-sans line-clamp-3">
                J'écris quand la ville s'éteint, quand le tempo ralentit. Les phares dessinent des
                rimes que le bitume a prédit...
              </p>
              <p className="text-[10px] font-mono text-paper-muted pt-2 border-t border-paper-border">
                Survolez cette carte pour observer la légère rotation éditoriale.
              </p>
            </Card>

            <Card ruled className="space-y-3">
              <div className="flex justify-between items-center">
                <Tag variant="accent" mono>
                  RÉGLURE
                </Tag>
                <Tag variant="success">Terminé</Tag>
              </div>
              <h3 className="font-serif text-2xl">Feuille à lignes</h3>
              <p className="text-xs text-paper-text font-mono">
                Ligne 01 : Premier vers bien calé
                <br />
                Ligne 02 : Deuxième rime assonancée
                <br />
                Ligne 03 : Le silence entre les mesures
              </p>
            </Card>

            <Card margin ruled className="space-y-3">
              <div className="flex justify-between items-center">
                <Tag variant="accent">Marge Rouge</Tag>
                <span className="font-mono text-[11px] text-paper-muted">2026-10-03</span>
              </div>
              <h3 className="font-serif text-2xl">Cahier de notes</h3>
              <p className="text-xs text-paper-muted">
                La marge rouge historique des cahiers d'écriture appliquée aux notes et ratures de
                l'auteur.
              </p>
            </Card>
          </div>
        </section>

        {/* Section 6 : Tags & Badges */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl tracking-tight flex items-center gap-3">
            <span>06.</span> Tags & Métriques
          </h2>
          <div className="p-6 rounded-panel border border-paper-border bg-paper-surface flex flex-wrap gap-3 shadow-paper-sm">
            <Tag variant="neutral">Neutre</Tag>
            <Tag variant="accent">Accentué</Tag>
            <Tag variant="success">Validé</Tag>
            <Tag variant="draft">Brouillon</Tag>
            <Tag variant="neutral" mono>
              92 BPM
            </Tag>
            <Tag variant="accent" mono>
              16 Syllabes
            </Tag>
            <Tag variant="success" mono>
              Session active
            </Tag>
          </div>
        </section>

        {/* Section 7 : Notifications Toast & Fenêtres Modales */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl tracking-tight flex items-center gap-3">
            <span>07.</span> Modales & Notifications
          </h2>
          <div className="p-6 rounded-panel border border-paper-border bg-paper-surface space-y-4 shadow-paper-sm">
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                Ouvrir une Modale
              </Button>
              <Button
                variant="ghost"
                onClick={() => toast('Texte sauvegardé automatiquement à 17:30', 'success')}
              >
                Toast Succès
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  toast('Connexion réseau interrompue. Mode hors ligne actif.', 'error')
                }
              >
                Toast Erreur
              </Button>
              <Button
                variant="ghost"
                onClick={() => toast("Nouveau couplet ajouté à l'album", 'info')}
              >
                Toast Info
              </Button>
            </div>
          </div>
        </section>

        {/* Boîte Modale de Démonstration */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Réorganiser l'album"
          description="Ajustez l'ordonnancement de vos morceaux avant l'export."
        >
          <div className="space-y-4 py-2">
            <p className="text-sm text-paper-muted">
              Cette modale utilise les transitions douces cubic-bezier et un flou d'arrière-plan
              subtil sans effet néon.
            </p>
            <div className="p-4 rounded-card border border-paper-border bg-paper-bg space-y-2">
              <p className="font-mono text-xs text-paper-accent">
                Morceau sélectionné : "Intro (Encre)"
              </p>
              <p className="text-xs text-paper-muted">Durée : 02:45 • 90 BPM</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                Confirmer l'ordre
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
