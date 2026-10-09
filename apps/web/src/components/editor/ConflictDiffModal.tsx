import React, { useState } from 'react';
import { AlertTriangle, Copy, Check, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { useToast } from '../ui/Toast.js';

interface ConflictDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverContent: string;
  serverTitle: string;
  localContent: string;
  localTitle: string;
  onKeepServer: () => void;
  onKeepLocal: () => void;
}

export const ConflictDiffModal: React.FC<ConflictDiffModalProps> = ({
  isOpen,
  onClose,
  serverContent,
  serverTitle,
  localContent,
  localTitle,
  onKeepServer,
  onKeepLocal,
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyLocal = async () => {
    try {
      await navigator.clipboard.writeText(localContent);
      setCopied(true);
      toast('Vos paroles ont été copiées dans le presse-papier', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Impossible de copier dans le presse-papier', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Conflit d'édition asynchrone détecté"
      className="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Bannière explicative rassurante */}
        <div className="flex items-start space-x-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-amber-300">
              Une version plus récente a été enregistrée pendant votre écriture.
            </p>
            <p className="text-xs text-amber-200/80">
              Rassurez-vous, aucune parole n'a été perdue : votre version a été automatiquement
              archivée dans l'historique des versions avec l'étiquette <strong>« Conflit »</strong>.
            </p>
          </div>
        </div>

        {/* Vue comparative côte à côte */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Colonne serveur */}
          <div className="flex flex-col border border-neutral-800 rounded-lg bg-neutral-900/60 overflow-hidden">
            <div className="px-3 py-2 bg-neutral-800/60 border-b border-neutral-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-200">
                Version courante (serveur)
              </span>
              <span className="text-[11px] text-neutral-400 truncate max-w-[120px]">
                {serverTitle}
              </span>
            </div>
            <div className="p-3 font-mono text-xs text-neutral-300 max-h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
              {serverContent || <em className="text-neutral-500">Texte vide</em>}
            </div>
          </div>

          {/* Colonne locale en conflit */}
          <div className="flex flex-col border border-amber-500/30 rounded-lg bg-neutral-900/60 overflow-hidden">
            <div className="px-3 py-2 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-300">
                Vos modifications locales ({localTitle})
              </span>
              <button
                type="button"
                onClick={handleCopyLocal}
                className="inline-flex items-center space-x-1 text-[11px] text-amber-300 hover:text-amber-200 transition-colors"
                title="Copier vos vers"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copié !' : 'Copier mes vers'}</span>
              </button>
            </div>
            <div className="p-3 font-mono text-xs text-neutral-200 max-h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
              {localContent || <em className="text-neutral-500">Texte vide</em>}
            </div>
          </div>
        </div>

        {/* Boutons de résolution */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-neutral-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onKeepServer}
            className="w-full sm:w-auto"
          >
            Adopter la version du serveur
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onKeepLocal}
            className="w-full sm:w-auto inline-flex items-center space-x-1.5"
          >
            <span>Conserver mes modifications</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Modal>
  );
};
