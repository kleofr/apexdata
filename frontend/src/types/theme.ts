export type TeamId = 
  | 'mclaren'
  | 'ferrari'
  | 'redbull'
  | 'mercedes'
  | 'astonmartin'
  | 'alpine'
  | 'williams'
  | 'sauber'
  | 'haas'
  | 'rb';

export interface TeamTheme {
  id: TeamId;
  name: string;
  constructorName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgTint: string;
  glowColor: string;
  textColor: string;
  tagline: string;
}

export const TEAM_THEMES: Record<TeamId, TeamTheme> = {
  mclaren: {
    id: 'mclaren',
    name: 'McLaren F1 Team',
    constructorName: 'McLaren',
    primaryColor: '#FF8000',
    secondaryColor: '#00F0FF',
    accentColor: '#FF6A00',
    bgTint: 'rgba(255, 128, 0, 0.05)',
    glowColor: 'rgba(255, 128, 0, 0.35)',
    textColor: '#FFFFFF',
    tagline: 'Papaya Precision // High Aerodynamic Efficiency'
  },
  ferrari: {
    id: 'ferrari',
    name: 'Scuderia Ferrari HP',
    constructorName: 'Ferrari',
    primaryColor: '#E80020',
    secondaryColor: '#FFF200',
    accentColor: '#FF2400',
    bgTint: 'rgba(232, 0, 32, 0.05)',
    glowColor: 'rgba(232, 0, 32, 0.35)',
    textColor: '#FFFFFF',
    tagline: 'Rosso Corsa // Maranello Power Unit Dynamics'
  },
  redbull: {
    id: 'redbull',
    name: 'Oracle Red Bull Racing',
    constructorName: 'Red Bull Racing',
    primaryColor: '#3671C6',
    secondaryColor: '#CC1E4A',
    accentColor: '#FCD800',
    bgTint: 'rgba(54, 113, 198, 0.05)',
    glowColor: 'rgba(54, 113, 198, 0.35)',
    textColor: '#FFFFFF',
    tagline: 'Dominant Aerodynamics // Red Bull Powertrains'
  },
  mercedes: {
    id: 'mercedes',
    name: 'Mercedes-AMG PETRONAS',
    constructorName: 'Mercedes',
    primaryColor: '#27F4D2',
    secondaryColor: '#C0C0C0',
    accentColor: '#00D2BE',
    bgTint: 'rgba(39, 244, 210, 0.05)',
    glowColor: 'rgba(39, 244, 210, 0.35)',
    textColor: '#FFFFFF',
    tagline: 'Silver Arrows // High Downforce Calibration'
  },
  astonmartin: {
    id: 'astonmartin',
    name: 'Aston Martin Aramco F1',
    constructorName: 'Aston Martin',
    primaryColor: '#229971',
    secondaryColor: '#CEDC00',
    accentColor: '#00594F',
    bgTint: 'rgba(34, 153, 113, 0.05)',
    glowColor: 'rgba(34, 153, 113, 0.35)',
    textColor: '#FFFFFF',
    tagline: 'British Racing Green // Silverstone Aero Technology'
  },
  alpine: {
    id: 'alpine',
    name: 'BWT Alpine F1 Team',
    constructorName: 'Alpine',
    primaryColor: '#0093CC',
    secondaryColor: '#FF87BC',
    accentColor: '#0078A5',
    bgTint: 'rgba(0, 147, 204, 0.05)',
    glowColor: 'rgba(0, 147, 204, 0.35)',
    textColor: '#FFFFFF',
    tagline: 'Enstone Dynamics // Viry-Chatillon Hybrid Integration'
  },
  williams: {
    id: 'williams',
    name: 'Williams Racing',
    constructorName: 'Williams',
    primaryColor: '#64C4FF',
    secondaryColor: '#041E42',
    accentColor: '#00A0DE',
    bgTint: 'rgba(100, 196, 255, 0.05)',
    glowColor: 'rgba(100, 196, 255, 0.35)',
    textColor: '#FFFFFF',
    tagline: 'Grove Heritage // Straight-Line Speed Efficiency'
  },
  sauber: {
    id: 'sauber',
    name: 'Stake F1 Team Kick Sauber',
    constructorName: 'Kick Sauber',
    primaryColor: '#52E252',
    secondaryColor: '#1A1A1A',
    accentColor: '#36C936',
    bgTint: 'rgba(82, 226, 82, 0.05)',
    glowColor: 'rgba(82, 226, 82, 0.35)',
    textColor: '#FFFFFF',
    tagline: 'Hinwil Engineering // Neon High-Velocity Chassis'
  },
  haas: {
    id: 'haas',
    name: 'MoneyGram Haas F1 Team',
    constructorName: 'Haas',
    primaryColor: '#E6002B',
    secondaryColor: '#B6BABD',
    accentColor: '#FFFFFF',
    bgTint: 'rgba(230, 0, 43, 0.05)',
    glowColor: 'rgba(230, 0, 43, 0.35)',
    textColor: '#FFFFFF',
    tagline: 'Kannapolis & Banbury Technical Alliance'
  },
  rb: {
    id: 'rb',
    name: 'Visa Cash App RB',
    constructorName: 'RB',
    primaryColor: '#6692FF',
    secondaryColor: '#FFFFFF',
    accentColor: '#1E3D8F',
    bgTint: 'rgba(102, 146, 255, 0.05)',
    glowColor: 'rgba(102, 146, 255, 0.35)',
    textColor: '#FFFFFF',
    tagline: 'Faenza Aerodynamic Prototype Engineering'
  }
};
