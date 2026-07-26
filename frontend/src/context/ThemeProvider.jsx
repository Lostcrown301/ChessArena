import { useMemo } from 'react';
import { ThemeContext } from './ThemeContext';

// ThemeProvider establishes a future extension point while the app ships dark by default.
export function ThemeProvider({ children }) {
  const value = useMemo(
    () => ({
      theme: 'dark',
    }),
    [],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
