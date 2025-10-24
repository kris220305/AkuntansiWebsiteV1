import React, { createContext, useContext, useReducer } from 'react';
import { EngineState, postJournal, lockPeriod, unlockPeriod } from '../lib/engine.js';

const initial = {
  theme: (() => { try { return localStorage.getItem('kriss_theme') || 'light'; } catch { return 'light'; } })(),
  language: (() => { try { return localStorage.getItem('kriss_language') || 'id'; } catch { return 'id'; } })(),
  journals: EngineState.journals,
  locks: EngineState.locks,
  audits: EngineState.audits,
  error: null,
  success: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_ENGINE':
      return { ...state, engine: action.payload };
    case 'SET_READY':
      return { ...state, ready: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, success: null };
    case 'SET_SUCCESS':
      return { ...state, success: action.payload, error: null };

    // Sales Management
    case 'ADD_SALES_DOCUMENT':
      return { 
        ...state, 
        salesDocuments: [...(state.salesDocuments || []), action.payload] 
      };
    
    // Dunning Reminder
    case 'SEND_DUNNING_REMINDER': {
      const ref = action.ref; // docNumber or id
      const salesDocs = state.salesDocuments || [];
      const nowIso = new Date().toISOString();
      const updated = salesDocs.map(doc => {
        const matches = doc.docNumber === ref || doc.id === ref;
        if (!matches) return doc;
        const level = (doc.dunningLevel || 0) + 1;
        const history = [...(doc.dunningHistory || []), { at: nowIso, level, notes: action.notes || '' }];
        return { ...doc, dunningLevel: level, lastReminderAt: nowIso, dunningHistory: history };
      });
      return { ...state, salesDocuments: updated, success: 'Dunning reminder sent', error: null };
    }
    
    // Purchase Management
    case 'ADD_PURCHASE_DOCUMENT':
      return { 
        ...state, 
        purchaseDocuments: [...(state.purchaseDocuments || []), action.payload] 
      };
    
    // Inventory Management
    case 'ADD_INVENTORY_ITEM':
      return { 
        ...state, 
        inventoryItems: [...(state.inventoryItems || []), action.payload] 
      };
    
    // Customer Management
    case 'ADD_CUSTOMER':
      return { 
        ...state, 
        customers: [...(state.customers || []), action.payload] 
      };
    
    // Supplier Management
    case 'ADD_SUPPLIER':
      return { 
        ...state, 
        suppliers: [...(state.suppliers || []), action.payload] 
      };
    
    // Multi-Currency Management
    case 'ADD_CURRENCY':
      return { 
        ...state, 
        currencies: [...(state.currencies || []), action.payload] 
      };
    
    case 'UPDATE_CURRENCY_RATE':
      return {
        ...state,
        currencies: (state.currencies || []).map(currency =>
          currency.id === action.payload.id
            ? { ...currency, rate: action.payload.rate, lastUpdated: action.payload.lastUpdated }
            : currency
        )
      };

    // Journal Posting
    case 'postJournal': {
      try {
        const j = postJournal(action.payload);
        return { 
          ...state, 
          journals: EngineState.journals, 
          success: 'Jurnal berhasil diposting', 
          error: null 
        };
      } catch (e) {
        return { ...state, error: e.message || 'Gagal memposting jurnal', success: null };
      }
    }

    case 'lock': {
      lockPeriod(action.period, action.user);
      return { ...state, locks: EngineState.locks, success: 'Period locked', error: null };
    }

    case 'unlock': {
      unlockPeriod(action.period, action.user);
      return { ...state, locks: EngineState.locks, success: 'Period unlocked', error: null };
    }

    case 'toggleTheme': {
      const next = state.theme === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('kriss_theme', next); } catch {}
      return { ...state, theme: next };
    }

    case 'setLanguage': {
      try { localStorage.setItem('kriss_language', action.lang); } catch {}
      return { ...state, language: action.lang };
    }

    case 'RESTORE_STATE': {
      const payload = action.payload || {};
      // Sync EngineState arrays (journals, locks, audits) if provided
      if (Array.isArray(payload.journals)) EngineState.journals = payload.journals;
      if (Array.isArray(payload.locks)) EngineState.locks = payload.locks;
      if (Array.isArray(payload.audits)) EngineState.audits = payload.audits;
      // Persist theme/language if provided
      if (payload.theme) { try { localStorage.setItem('kriss_theme', payload.theme); } catch {} }
      if (payload.language) { try { localStorage.setItem('kriss_language', payload.language); } catch {} }
      return {
        ...state,
        theme: payload.theme || state.theme,
        language: payload.language || state.language,
        journals: Array.isArray(payload.journals) ? payload.journals : state.journals,
        locks: Array.isArray(payload.locks) ? payload.locks : state.locks,
        audits: Array.isArray(payload.audits) ? payload.audits : state.audits,
        salesDocuments: Array.isArray(payload.salesDocuments) ? payload.salesDocuments : (state.salesDocuments || []),
        purchaseDocuments: Array.isArray(payload.purchaseDocuments) ? payload.purchaseDocuments : (state.purchaseDocuments || []),
        customers: Array.isArray(payload.customers) ? payload.customers : (state.customers || []),
        suppliers: Array.isArray(payload.suppliers) ? payload.suppliers : (state.suppliers || []),
        currencies: Array.isArray(payload.currencies) ? payload.currencies : (state.currencies || []),
        success: 'State restored',
        error: null,
      };
    }
    
    default:
      return state;
  }
};

const StoreCtx = createContext(null);
export function StoreProvider({ children }){
  const [state, dispatch] = useReducer(reducer, initial);
  return <StoreCtx.Provider value={{ state, dispatch }}>{children}</StoreCtx.Provider>;
}
export function useStore(){ return useContext(StoreCtx); }