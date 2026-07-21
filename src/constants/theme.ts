export const C = {
  green:       '#1A3D2B',
  greenLight:  '#2D6A4F',
  gold:        '#C9963A',
  goldLight:   '#FFF8EC',
  income:      '#2E7D52',
  expense:     '#C0392B',
  bg:          '#F5F2ED',
  card:        '#FFFFFF',
  border:      '#E8E3DC',
  muted:       '#8A8178',
  text:        '#1E1A16',
  purple:      '#6C3483',
  purpleLight: '#F8F5FF',
  blue:        '#1A5276',
  white:       '#FFFFFF',
};

export const EXCHANGE_RATE = 83.5;

export const fmt    = (n: number | undefined) => Number(n || 0).toFixed(2);
export const fmtINR = (n: number | undefined) =>
  '₹' + Math.round(Number(n || 0) * EXCHANGE_RATE).toLocaleString('en-IN');
export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const EXPENSE_CATS = [
  'DoorDash','Lyft','Uber','Rent','USCIS','Remitly',
  'Mint/Phone','Credit Payment','Grocery','Walmart','Other',
];
export const INCOME_CATS = [
  'Hotel Work','Subway Paycheck','Motel Paycheck',
  'Split Received','Cash Payment','Other',
];
export const PIE_COLORS = [
  '#C0392B','#1A3D2B','#C9963A','#6C3483','#1A5276',
  '#2E7D52','#D35400','#8E44AD','#7F8C8D','#2980B9','#16A085',
];

export const DEFAULT_LOCATIONS = [
  { id: 'loc1', name: 'Motel Blackstone', rate: 12 },
  { id: 'loc2', name: 'Motel 99',         rate: 9  },
  { id: 'loc3', name: 'IKP',              rate: 9  },
];
