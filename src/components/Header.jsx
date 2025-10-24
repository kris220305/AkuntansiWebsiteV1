import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../state/store.jsx';

export default function Header(){
  const { t, i18n } = useTranslation();
  const { state, dispatch } = useStore();
  const currentPeriod = new Date().toISOString().slice(0,7);
  const isLocked = state.locks.some(l => l.period === currentPeriod);
  const lockNow = ()=> dispatch({ type:'lock', period: currentPeriod, user: 'user' });
  const unlockNow = ()=> dispatch({ type:'unlock', period: currentPeriod, user: 'user' });
  const toggleTheme = ()=> dispatch({ type:'toggleTheme' });
  const toggleLang = ()=> { const next = i18n.language==='id'?'en':'id'; i18n.changeLanguage(next); dispatch({ type:'setLanguage', lang: next }); };
  return (
    <header className="header">
      <div className="brand">{t('appName')}</div>
      <div className="actions">
        <span className="btn ghost" aria-label="period-status">{t(isLocked ? 'statusLocked' : 'statusOpen')} · {currentPeriod}</span>
        <button onClick={toggleLang} className="btn ghost">{t('language')}: {i18n.language.toUpperCase()}</button>
        <button onClick={toggleTheme} className="btn ghost">{state.theme==='light'?t('light'):t('dark')}</button>
        <button onClick={lockNow} className="btn primary" disabled={isLocked}>{t('locked')}</button>
        <button onClick={unlockNow} className="btn primary" disabled={!isLocked}>{t('unlock')}</button>
        <a href="https://instagram.com/krisnaawahyu_" target="_blank" rel="noreferrer" className="btn ig">@krisnaawahyu_</a>
      </div>
    </header>
  );
}