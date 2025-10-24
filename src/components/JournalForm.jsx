import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../state/store.jsx';
import { seedCOA } from '../lib/engine.js';
import { formatNumber, parseLocalNumber } from '../lib/format.js';
import NumberInput from './NumberInput.jsx';

const COA = seedCOA();

export default function JournalForm(){
  const { t, i18n } = useTranslation();
  const { dispatch } = useStore();
  const { state } = useStore();
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [ref, setRef] = useState('JV-001');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState([{ account:'1110', debit:0, credit:0 }, { account:'4100', debit:0, credit:0 }]);

  const totalDebit = lines.reduce((s,l)=> s + parseLocalNumber(l.debit, i18n.language==='id'?'id-ID':'en-US'), 0);
  const totalCredit = lines.reduce((s,l)=> s + parseLocalNumber(l.credit, i18n.language==='id'?'id-ID':'en-US'), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.001;

  const addLine = ()=> setLines([...lines, { account:'1110', debit:0, credit:0 }]);
  const updateLine = (idx, field, value)=> setLines(lines.map((l,i)=> i===idx ? { ...l, [field]: value } : l));
  const removeLine = (idx)=> {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== idx));
    }
  };

  const autoBalance = () => {
    const locale = i18n.language==='id'?'id-ID':'en-US';
    const diff = totalDebit - totalCredit; // >0: tambah credit; <0: tambah debit
    if (Math.abs(diff) < 0.001) return;
    setLines(prev => {
      const next = [...prev];
      const idx = next.length - 1; // seimbangkan di baris terakhir
      if (diff > 0) {
        const currentCredit = parseLocalNumber(next[idx].credit, locale);
        next[idx].credit = currentCredit + diff;
      } else {
        const currentDebit = parseLocalNumber(next[idx].debit, locale);
        next[idx].debit = currentDebit + Math.abs(diff);
      }
      return next;
    });
  };
  
  const validateForm = () => {
    if (!date || !ref || !description) {
      return 'Tanggal, referensi, dan deskripsi harus diisi';
    }
    if (lines.length < 2) {
      return 'Minimal harus ada 2 baris jurnal';
    }
    if (!balanced) {
      return 'Total debit dan credit harus seimbang';
    }
    const hasEmptyLines = lines.some(l => !l.account || (l.debit === 0 && l.credit === 0));
    if (hasEmptyLines) {
      return 'Semua baris harus memiliki akun dan nilai debit atau credit';
    }
    return null;
  };
  
  const submit = ()=> {
    const validationError = validateForm();
    if (validationError) {
      dispatch({ type: 'SET_ERROR', payload: validationError });
      return;
    }
    
    const payload = {
      date, ref, description,
      lines: lines.map(l=> ({
        ...l, 
        debit: typeof l.debit === 'number' ? l.debit : parseLocalNumber(l.debit, i18n.language==='id'?'id-ID':'en-US'), 
        credit: typeof l.credit === 'number' ? l.credit : parseLocalNumber(l.credit, i18n.language==='id'?'id-ID':'en-US')
      })),
      user: 'user',
    };
    dispatch({ type:'postJournal', payload });
  };

  return (
    <div className="panel">
      <h3>{t('addJournal')}</h3>
      <div className="card-body">{t('journalHint')}</div>
      <div className="row">
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        <input value={ref} onChange={e=>setRef(e.target.value)} placeholder="Ref" />
        <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" />
      </div>
      <table className="table">
        <thead>
          <tr><th>Account</th><th>Debit</th><th>Credit</th><th>Action</th></tr>
        </thead>
        <tbody>
          {lines.map((l,idx)=> (
            <tr key={idx}>
              <td>
                <select value={l.account} onChange={e=>updateLine(idx,'account', e.target.value)}>
                  {COA.map(a=> <option key={a.code} value={a.code}>{a.code} — {i18n.language==='en'?a.enName:a.idName}</option>)}
                </select>
              </td>
              <td>
                <NumberInput 
                  value={l.debit} 
                  onChange={value=>updateLine(idx,'debit', value)}
                  placeholder="0"
                  allowNegative={false}
                />
              </td>
              <td>
                <NumberInput 
                  value={l.credit} 
                  onChange={value=>updateLine(idx,'credit', value)}
                  placeholder="0"
                  allowNegative={false}
                />
              </td>
              <td>
                {lines.length > 2 && (
                  <button 
                    type="button" 
                    onClick={() => removeLine(idx)} 
                    className="btn ghost small"
                    title="Hapus baris"
                  >
                    ×
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row">
        <div>{t('totalDebit')}: {formatNumber(totalDebit, i18n.language==='id'?'id-ID':'en-US')}</div>
        <div>{t('totalCredit')}: {formatNumber(totalCredit, i18n.language==='id'?'id-ID':'en-US')}</div>
        <span className="btn ghost">{balanced ? t('balanced') : t('notBalanced')}</span>
        <button onClick={addLine} className="btn ghost">{t('addLine')}</button>
        <button onClick={autoBalance} className="btn ghost">Seimbangkan Otomatis</button>
        <button onClick={submit} disabled={!balanced} className="btn primary">{t('post')}</button>
      </div>
      {!balanced && <div className="form-error">⚠️ Total debit dan credit harus seimbang. Isi kedua sisi atau klik "Seimbangkan Otomatis".</div>}
      {state.error && <div className="form-error">{state.error}</div>}
      {state.success && <div className="form-success">✅ {state.success}</div>}
    </div>
  );
}