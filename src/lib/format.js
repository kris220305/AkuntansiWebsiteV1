// Locale-aware number and currency formatting utilities
import dayjs from 'dayjs';

export const Locale = {
  ID: 'id-ID',
  EN: 'en-US',
};

export function formatNumber(value, locale = Locale.ID) {
  const nf = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return nf.format(Number(value || 0));
}

export function formatCurrency(value, locale = Locale.ID, currency = 'IDR') {
  const nf = new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0 });
  // IDX style: negatives in parentheses, currency code not repeated (we'll strip symbol for IDR)
  let txt = nf.format(Number(value || 0));
  // Force IDR prefix regardless of locale format
  const abs = Math.abs(Number(value || 0));
  const num = new Intl.NumberFormat(locale, { minimumFractionDigits: 0 }).format(abs);
  txt = `IDR ${num}`;
  if (Number(value || 0) < 0) txt = `(${txt})`;
  return txt;
}

export function parseLocalNumber(input, locale = Locale.ID) {
  // Convert localized number string to JS number
  if (typeof input === 'number') return input;
  if (!input) return 0;
  const map = {
    [Locale.ID]: { thousand: '.', decimal: ',' },
    [Locale.EN]: { thousand: ',', decimal: '.' },
  }[locale];
  const normalized = String(input)
    .replace(new RegExp('\\' + map.thousand, 'g'), '')
    .replace(map.decimal, '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function formatPeriodRange(start, end, locale = Locale.ID) {
  const s = dayjs(start).format('DD MMM YYYY');
  const e = dayjs(end).format('DD MMM YYYY');
  return `${s} – ${e}`;
}

export function nextDocNumber(prefix, date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const key = `docnum_${prefix}_${y}${m}`;
  const seq = (parseInt(localStorage.getItem(key) || '0', 10) + 1);
  localStorage.setItem(key, String(seq));
  return `${prefix}-${y}${m}-${String(seq).padStart(4, '0')}`;
}