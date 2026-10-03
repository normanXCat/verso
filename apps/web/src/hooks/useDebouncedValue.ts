import { useEffect, useState } from 'react';

/**
 * Retourne une version retardée d'une valeur. Utilisé pour la recherche en direct
 * afin de ne pas déclencher une requête à chaque frappe.
 */
export function useDebouncedValue<T>(value: T, delayMs = 200): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
