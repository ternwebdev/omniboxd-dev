import { BusCompany, ReviewTag } from '../types';

export const BUS_COMPANIES: BusCompany[] = [
  { id: 'cutcsa', name: 'CUTCSA', short_name: 'CUTCSA', color: '#e85d10' },
  { id: 'coetc', name: 'COETC', short_name: 'COETC', color: '#1e5fc2' },
  { id: 'ucot', name: 'UCOT', short_name: 'UCOT', color: '#9b2020' },
  { id: 'copsa', name: 'COPSA', short_name: 'COPSA', color: '#1a7a3c' },
  { id: 'come', name: 'COME', short_name: 'COME', color: '#7a3ab0' },
  { id: 'tpm', name: 'TPM', short_name: 'TPM', color: '#2563eb' },
  { id: 'casanova', name: 'CASANOVA', short_name: 'CASANOVA', color: '#d97706' },
  { id: 'raincoop', name: 'RAINCOOP (Histórica)', short_name: 'RAINCOOP', color: '#b06010' },
];

export const DEFAULT_TAGS: ReviewTag[] = [
  { slug: 'sin-aire', label: 'Sin aire', emoji: '🥵', category: 'confort' },
  { slug: 'aire-al-mango', label: 'Aire al mango', emoji: '🥶', category: 'confort' },
  { slug: 'lleno-de-gente', label: 'Lleno hasta las manos', emoji: '🐟', category: 'confort' },
  { slug: 'asientos-comodos', label: 'Asientos cómodos', emoji: '💺', category: 'confort' },
  { slug: 'limpio', label: 'Limpio e impecable', emoji: '✨', category: 'confort' },
  { slug: 'chofer-buena-onda', label: 'Chofer re buena onda', emoji: '😊', category: 'chofer' },
  { slug: 'chofer-brava', label: 'Chofer con pocas pulgas', emoji: '😤', category: 'chofer' },
  { slug: 'musica-a-tope', label: 'Música / cumbia a tope', emoji: '🔊', category: 'chofer' },
  { slug: 'saludo', label: 'Saludó al subir', emoji: '👋', category: 'chofer' },
  { slug: 'frenazos', label: 'Frenazos de película', emoji: '🛑', category: 'chofer' },
  { slug: 'va-como-pina', label: 'Iba como piña', emoji: '🚀', category: 'chofer' },
  { slug: 'manejo-suave', label: 'Manejo suave', emoji: '🕊️', category: 'chofer' },
  { slug: 'salio-tarde', label: 'Salió con retraso', emoji: '🕐', category: 'puntualidad' },
  { slug: 'salio-antes', label: 'Salió antes de hora', emoji: '💨', category: 'puntualidad' },
  { slug: 'frecuencia-ok', label: 'Buena frecuencia', emoji: '✅', category: 'puntualidad' },
  { slug: 'seguro', label: 'Viaje tranquilo y seguro', emoji: '🛡️', category: 'seguridad' }
];

export const COMPANY_COLORS: Record<string, string> = {
  CUTCSA: '#e85d10',
  COETC: '#1e5fc2',
  UCOT: '#9b2020',
  COPSA: '#1a7a3c',
  COME: '#7a3ab0',
  RAINCOOP: '#b06010',
  TPM: '#2563eb',
  CASANOVA: '#d97706',
  default: '#555f5e'
};
