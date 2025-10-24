// Bilingual hierarchical COA (4-digit codes, configurable)
export const defaultCOA = [
  { code: '1000', parent: null, idName: 'Aset', enName: 'Assets' },
  { code: '1100', parent: '1000', idName: 'Kas & Bank', enName: 'Cash & Bank' },
  { code: '1110', parent: '1100', idName: 'Kas', enName: 'Cash' },
  { code: '1120', parent: '1100', idName: 'Bank', enName: 'Bank' },
  { code: '1200', parent: '1000', idName: 'Piutang Usaha', enName: 'Accounts Receivable' },
  { code: '1300', parent: '1000', idName: 'Persediaan', enName: 'Inventory' },
  { code: '1400', parent: '1000', idName: 'Aset Tetap', enName: 'Property, Plant & Equipment' },

  { code: '2000', parent: null, idName: 'Liabilitas', enName: 'Liabilities' },
  { code: '2100', parent: '2000', idName: 'Utang Usaha', enName: 'Accounts Payable' },
  { code: '2200', parent: '2000', idName: 'Utang PPN Keluaran', enName: 'VAT Output Payable' },

  { code: '3000', parent: null, idName: 'Ekuitas', enName: 'Equity' },
  { code: '3100', parent: '3000', idName: 'Modal Disetor', enName: 'Paid-in Capital' },
  { code: '3200', parent: '3000', idName: 'Laba Ditahan', enName: 'Retained Earnings' },

  { code: '4000', parent: null, idName: 'Pendapatan', enName: 'Revenue' },
  { code: '4100', parent: '4000', idName: 'Penjualan', enName: 'Sales' },
  { code: '4200', parent: '4000', idName: 'Pendapatan Lain', enName: 'Other Income' },

  { code: '5000', parent: null, idName: 'Beban', enName: 'Expenses' },
  { code: '5100', parent: '5000', idName: 'Harga Pokok Penjualan', enName: 'Cost of Goods Sold' },
  { code: '5200', parent: '5000', idName: 'Gaji & Upah', enName: 'Salaries & Wages' },
  { code: '5300', parent: '5000', idName: 'Beban Operasional', enName: 'Operating Expenses' },
  { code: '5400', parent: '5000', idName: 'PPN Masukan', enName: 'VAT Input' },
];

export function nameFor(code, lang = 'id') {
  const item = defaultCOA.find(a => a.code === code);
  if (!item) return code;
  return lang === 'en' ? item.enName : item.idName;
}