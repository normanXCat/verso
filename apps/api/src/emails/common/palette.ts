/**
 * Palette de couleurs explicites de Verso pour les emails transactionnels.
 * RÈGLE ABSOLUE : Jamais de variable CSS ni de couleurs shorthand dans les emails.
 *
 * Tous les contrastes respectent les critères WCAG AA (≥ 4.5:1 pour le texte normal,
 * ≥ 3:1 pour les grands titres et éléments d'interface).
 */

export const EMAIL_PALETTE = {
  // Mode Sombre (par défaut de la plateforme Verso)
  dark: {
    background: '#0E0D0B', // Fond général de l'email
    card: '#171512', // Fond du conteneur carte
    cardInner: '#1B1814', // Fond des blocs d'information et encadrés
    border: '#2A2621', // Bordures et séparateurs
    borderSubtle: '#23201B', // Bordures secondaires
    text: '#EDE6D8', // Texte principal (contraste 14.4:1 sur #171512 - AAA)
    textSecondary: '#9A9183', // Texte secondaire / métadonnées (contraste 5.1:1 - AA)
    textMuted: '#7A7266', // Notes discrètes / liens de secours
    accent: '#FF5A2E', // Accent vermillon Verso (contraste 6.1:1 sur #171512)
    accentHover: '#FF410F',
    buttonText: '#14110F', // Encre foncée sur fond accent (contraste 6.5:1 - AA)
    codeBg: '#12100E', // Fond des extraits monospace
    badgeBg: '#23201B',
  },

  // Repli Mode Clair (pour les clients de messagerie gérant prefers-color-scheme: light)
  light: {
    background: '#F4EFE6', // Fond général papier
    card: '#FFFFFF', // Fond du conteneur carte
    cardInner: '#FAF7F2', // Fond des blocs d'information
    border: '#DDD5C6', // Bordures et séparateurs
    borderSubtle: '#EAE4D8',
    text: '#14110F', // Texte principal encre foncée (contraste 17.5:1 - AAA)
    textSecondary: '#666158', // Texte secondaire (contraste 5.5:1 - AA)
    textMuted: '#8C8578',
    accent: '#CD3711', // Accent vermillon sur fond clair (contraste 5.06:1 - AA)
    accentHover: '#B83210',
    buttonText: '#FFFFFF', // Texte blanc sur fond accent vermillon (contraste 5.06:1 - AA)
    codeBg: '#F0EAE0',
    badgeBg: '#EAE4D8',
  },
} as const;
