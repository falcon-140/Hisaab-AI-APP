import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LOCATIONS } from '../constants/theme';

const KEY = 'hisaab-v2';

export interface Location { id: string; name: string; rate: number; }
export interface Transaction { id: string; type: 'income'|'expense'; source: 'cash'|'bank'; amount: number; category: string; desc: string; date: string; }
export interface HourEntry { id: string; locationId: string; location: string; hours: number; rate: number; date: string; paid: boolean; }
export interface Split { id: string; person: string; amount: number; desc: string; direction: 'owed_to_me'|'i_owe'; date: string; settled: boolean; settledDate?: string; }
export interface CreditCard { id: string; name: string; balance: number; limit: number; payments: { id:string; amount:number; date:string; source:string }[]; }
export interface Reminder { id: string; title: string; amount: number; dueDate: string; done: boolean; createdDate: string; }

export interface HisaabData {
  bankBalance: number;
  cashBalance: number;
  transactions: Transaction[];
  hoursLog: HourEntry[];
  splits: Split[];
  creditCards: CreditCard[];
  reminders: Reminder[];
  locations: Location[];
  alertThreshold: number;
}

const EMPTY: HisaabData = {
  bankBalance: 0, cashBalance: 0,
  transactions: [], hoursLog: [], splits: [],
  creditCards: [], reminders: [],
  locations: DEFAULT_LOCATIONS,
  alertThreshold: 500,
};

interface HisaabContextType {
  data: HisaabData;
  save: (d: HisaabData) => Promise<void>;
  loading: boolean;
}

const HisaabContext = createContext<HisaabContextType | null>(null);

export function HisaabProvider({ children }: { children: React.ReactNode }) {
  const [data,    setData]    = useState<HisaabData>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(KEY);
        if (stored) {
          const d = JSON.parse(stored);
          let locs = d.locations;
          if (!locs && d.locationRates)
            locs = Object.entries(d.locationRates).map(([name, rate], i) => ({ id: `loc${i+1}`, name, rate }));
          setData({ ...EMPTY, ...d, locations: locs || DEFAULT_LOCATIONS });
        } else setData({ ...EMPTY });
      } catch { setData({ ...EMPTY }); }
      setLoading(false);
    })();
  }, []);

  const save = async (newData: HisaabData) => {
    setData(newData);
    try { await AsyncStorage.setItem(KEY, JSON.stringify(newData)); } catch {}
  };

  return (
    <HisaabContext.Provider value={{ data, save, loading }}>
      {children}
    </HisaabContext.Provider>
  );
}

export const useHisaab = () => {
  const ctx = useContext(HisaabContext);
  if (!ctx) throw new Error('useHisaab must be used inside HisaabProvider');
  return ctx;
};
