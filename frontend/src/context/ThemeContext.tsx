import React, { createContext, useContext, useState, useEffect } from 'react';
import { TeamId, TeamTheme, TEAM_THEMES } from '../types/theme';

interface ThemeContextType {
  currentTeam: TeamId;
  theme: TeamTheme;
  setTeam: (team: TeamId) => void;
  availableTeams: TeamTheme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTeam, setCurrentTeam] = useState<TeamId>(() => {
    const saved = localStorage.getItem('apexdata_team_theme');
    return (saved && saved in TEAM_THEMES) ? (saved as TeamId) : 'mclaren';
  });

  const theme = TEAM_THEMES[currentTeam];

  useEffect(() => {
    localStorage.setItem('apexdata_team_theme', currentTeam);
    const root = document.documentElement;
    root.style.setProperty('--team-primary', theme.primaryColor);
    root.style.setProperty('--team-secondary', theme.secondaryColor);
    root.style.setProperty('--team-accent', theme.accentColor);
    root.style.setProperty('--team-glow', theme.glowColor);
    root.style.setProperty('--team-bg-tint', theme.bgTint);
  }, [currentTeam, theme]);

  return (
    <ThemeContext.Provider
      value={{
        currentTeam,
        theme,
        setTeam: setCurrentTeam,
        availableTeams: Object.values(TEAM_THEMES)
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
