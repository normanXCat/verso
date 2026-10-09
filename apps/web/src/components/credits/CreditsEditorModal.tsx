import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
} from 'lucide-react';
import type { CreditRole } from '@verso/shared';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { useToast } from '../ui/Toast.js';
import { creditsClient } from '../../lib/credits-client.js';

export interface CreditsEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  songId: string;
  songTitle: string;
  isEditable?: boolean;
}

interface EditableCredit {
  id?: string;
  name: string;
  role: CreditRole;
  percentage: number | null;
  order: number;
}

const ROLE_OPTIONS: { value: CreditRole; label: string }[] = [
  { value: 'AUTHOR', label: 'Auteur des paroles' },
  { value: 'FEATURING', label: 'Featuring' },
  { value: 'COMPOSER', label: 'Beatmaker / Compositeur' },
  { value: 'PRODUCER', label: 'Producteur' },
];

export function CreditsEditorModal({
  isOpen,
  onClose,
  songId,
  songTitle,
  isEditable = true,
}: CreditsEditorModalProps): React.ReactElement {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [items, setItems] = useState<EditableCredit[]>([]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['songs', songId, 'credits'],
    queryFn: () => creditsClient.getCredits(songId),
    enabled: isOpen && songId.length > 0,
  });

  useEffect(() => {
    if (data?.credits) {
      setItems(
        data.credits.map((c, idx) => ({
          id: c.id,
          name: c.name,
          role: c.role,
          percentage: c.percentage ?? null,
          order: c.order ?? idx,
        })),
      );
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (creditsToSave: EditableCredit[]) =>
      creditsClient.updateCredits(songId, {
        credits: creditsToSave.map((c, index) => ({
          id: c.id,
          name: c.name.trim(),
          role: c.role,
          percentage: c.percentage !== null && !isNaN(c.percentage) ? Number(c.percentage) : null,
          order: index,
        })),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['songs', songId, 'credits'] });
      toast('Crédits artistiques enregistrés avec succès', 'success');
      onClose();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Impossible d’enregistrer les crédits';
      toast(message, 'error');
    },
  });

  // Somme des pourcentages pour le rôle Auteur (FR-028)
  const authorPercentages = items
    .filter((it) => it.role === 'AUTHOR' && it.percentage !== null && !isNaN(it.percentage))
    .reduce((acc, it) => acc + (it.percentage ?? 0), 0);

  const roundedAuthorPercentage = Math.round(authorPercentages * 100) / 100;
  const hasAuthorCredits = items.some((it) => it.role === 'AUTHOR');
  const hasAnyPercentage = items.some(
    (it) => it.percentage !== null && !isNaN(it.percentage) && it.percentage > 0,
  );

  const handleAddCredit = () => {
    setItems((prev) => [
      ...prev,
      {
        name: '',
        role: prev.length === 0 ? 'AUTHOR' : 'FEATURING',
        percentage: null,
        order: prev.length,
      },
    ]);
  };

  const handleRemoveCredit = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    setItems((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleChange = (index: number, field: keyof EditableCredit, value: unknown) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return { ...item, [field]: value };
      }),
    );
  };

  const handleSave = () => {
    // Vérifier les noms vides
    const emptyNames = items.filter((it) => !it.name.trim());
    if (emptyNames.length > 0) {
      toast('Chaque intervenant crédité doit avoir un nom ou pseudonyme', 'error');
      return;
    }
    saveMutation.mutate(items);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crédits artistiques & antériorité"
      description={`Déclarez les rôles artistiques et quotes-parts pour « ${songTitle} ». Ces mentions figureront sur votre certificat PDF horodaté.`}
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Jauge de quote-part cumulée */}
        {hasAuthorCredits && hasAnyPercentage && (
          <div
            className={`rounded-card border p-4 transition-colors ${
              roundedAuthorPercentage === 100
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-amber-500/30 bg-amber-500/5'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {roundedAuthorPercentage === 100 ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                )}
                <div>
                  <div className="text-sm font-medium text-paper-text">
                    Quote-part auteurs cumulée :{' '}
                    <span className="font-mono font-bold">{roundedAuthorPercentage}%</span>
                  </div>
                  <div className="text-xs text-paper-muted">
                    {roundedAuthorPercentage === 100
                      ? 'Répartition intégrale des droits d’auteur (100%).'
                      : 'La quote-part cumulée est différente de 100% (avertissement indicatif, n’empêche pas l’enregistrement).'}
                  </div>
                </div>
              </div>

              {/* Petite jauge visuelle */}
              <div className="w-24 bg-paper-surface rounded-full h-2 border border-paper-border overflow-hidden shrink-0">
                <div
                  className={`h-full transition-all duration-300 ${
                    roundedAuthorPercentage === 100
                      ? 'bg-emerald-500'
                      : roundedAuthorPercentage > 100
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(roundedAuthorPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Chargement ou erreur */}
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-paper-muted">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Chargement des crédits…</span>
          </div>
        )}

        {isError && (
          <div className="rounded-card border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-600">
            Impossible de récupérer les crédits de ce morceau.
          </div>
        )}

        {/* Liste des crédits */}
        {!isLoading && !isError && (
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="rounded-card border border-dashed border-paper-border p-8 text-center">
                <Award className="mx-auto h-8 w-8 text-paper-muted/60 mb-2" />
                <p className="text-sm text-paper-muted">
                  Aucun crédit n’a encore été déclaré sur ce texte.
                </p>
                <p className="text-xs text-paper-muted mt-1">
                  Déclarez les auteurs, artistes en featuring, beatmakers et producteurs.
                </p>
                {isEditable && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    iconLeft={<Plus />}
                    onClick={handleAddCredit}
                  >
                    Ajouter le premier crédit
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-mono uppercase tracking-wide text-paper-muted px-2">
                  <span className="col-span-5">Artiste / Intervenant</span>
                  <span className="col-span-4">Rôle</span>
                  <span className="col-span-2 text-right">Part (%)</span>
                  <span className="col-span-1" />
                </div>

                {items.map((credit, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center rounded-paper border border-paper-border bg-paper-surface p-2 transition-colors focus-within:border-paper-accent"
                  >
                    {/* Nom */}
                    <div className="col-span-5">
                      <input
                        type="text"
                        disabled={!isEditable}
                        placeholder="Blaze ou nom complet"
                        value={credit.name}
                        onChange={(e) => handleChange(index, 'name', e.target.value)}
                        className="w-full rounded border border-paper-border bg-paper-bg px-2.5 py-1.5 text-sm text-paper-text placeholder:text-paper-muted focus:border-paper-accent focus:outline-none disabled:opacity-50"
                      />
                    </div>

                    {/* Rôle */}
                    <div className="col-span-4">
                      <select
                        disabled={!isEditable}
                        value={credit.role}
                        onChange={(e) => handleChange(index, 'role', e.target.value as CreditRole)}
                        className="w-full rounded border border-paper-border bg-paper-bg px-2 py-1.5 text-sm text-paper-text focus:border-paper-accent focus:outline-none disabled:opacity-50"
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Pourcentage */}
                    <div className="col-span-2">
                      <input
                        type="number"
                        disabled={!isEditable}
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="ex. 50"
                        value={credit.percentage ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : parseFloat(e.target.value);
                          handleChange(index, 'percentage', isNaN(val as number) ? null : val);
                        }}
                        className="w-full text-right rounded border border-paper-border bg-paper-bg px-2 py-1.5 text-sm text-paper-text placeholder:text-paper-muted focus:border-paper-accent focus:outline-none disabled:opacity-50"
                      />
                    </div>

                    {/* Actions de réordonnancement et suppression */}
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      {isEditable && (
                        <>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMove(index, 'up')}
                              aria-label="Monter"
                              title="Monter"
                              className="text-paper-muted hover:text-paper-text disabled:opacity-20 p-0.5"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              disabled={index === items.length - 1}
                              onClick={() => handleMove(index, 'down')}
                              aria-label="Descendre"
                              title="Descendre"
                              className="text-paper-muted hover:text-paper-text disabled:opacity-20 p-0.5"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCredit(index)}
                            aria-label="Supprimer le crédit"
                            title="Supprimer"
                            className="text-paper-muted hover:text-rose-500 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {isEditable && (
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      iconLeft={<Plus />}
                      onClick={handleAddCredit}
                    >
                      Ajouter un intervenant
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Note informative de l'antériorité */}
        <div className="flex items-start gap-2 rounded-card bg-paper-surface/50 border border-paper-border/60 p-3 text-xs text-paper-muted">
          <Info className="h-4 w-4 shrink-0 text-paper-accent mt-0.5" />
          <span>
            Conformément aux exigences légales et à la protection des droits, chaque export PDF
            généré intègre un cartouche certifié avec l’horodatage de la révision et le tableau
            complet de vos crédits déclarés.
          </span>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-paper-border">
          <Button type="button" variant="ghost" onClick={onClose}>
            {isEditable ? 'Annuler' : 'Fermer'}
          </Button>
          {isEditable && (
            <Button
              type="button"
              variant="primary"
              isLoading={saveMutation.isPending}
              loadingText="Enregistrement…"
              onClick={handleSave}
            >
              Enregistrer les crédits
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
