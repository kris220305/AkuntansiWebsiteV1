import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trialBalance, financialStatements, vatReport } from '../lib/engine.js';
import { formatCurrency, Locale } from '../lib/format.js';
import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';
pdfMake.vfs = pdfFonts.vfs || (pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) || pdfFonts;

export default function Reports(){
  const { t, i18n } = useTranslation();
  const [from, setFrom] = useState(new Date().toISOString().slice(0,10));
  const [to, setTo] = useState(new Date().toISOString().slice(0,10));
  const [prevFrom, setPrevFrom] = useState('');
  const [prevTo, setPrevTo] = useState('');
  const locale = i18n.language==='id'?Locale.ID:Locale.EN;

  const tb = useMemo(()=> trialBalance(from, to), [from,to]);
  const fs = useMemo(()=> financialStatements(from,to,prevFrom||null,prevTo||null), [from,to,prevFrom,prevTo]);
  const vat = useMemo(()=> vatReport(from,to), [from,to]);

  const exportPdf = ()=>{
    const doc = {
      pageMargins: [40,60,40,60],
      content: [
        { text: t('trialBalance'), style:'h1' },
        { table: { headerRows:1, widths:['*','auto','auto'], body: [ ['Account','Debit','Credit'], ...tb.rows.map(r=>[r.account, formatCurrency(r.debit, locale), formatCurrency(r.credit, locale)]), ['TOTAL', formatCurrency(tb.totalDebit, locale), formatCurrency(tb.totalCredit, locale)] ] } },
        { text: t('financialStatements'), style:'h1', margin:[0,20,0,0] },
        { columns: [
          [ { text: t('statementOfFinancialPosition'), style:'h2' },
            { ul: [ `Assets: ${formatCurrency(fs.position.assets, locale)}`, `Liabilities: ${formatCurrency(fs.position.liabilities, locale)}`, `Equity: ${formatCurrency(fs.position.equity, locale)}` ] }, ],
          [ { text: t('statementOfProfitLoss'), style:'h2' },
            { ul: [ `Revenue: ${formatCurrency(fs.profitOrLoss.revenue, locale)}`, `Expenses: ${formatCurrency(fs.profitOrLoss.expenses, locale)}`, `Profit: ${formatCurrency(fs.profitOrLoss.profit, locale)}` ] }, ]
        ]},
        { text: t('vatReport'), style:'h1', margin:[0,20,0,0] },
        { ul: [ `Input: ${formatCurrency(vat.input, locale)}`, `Output: ${formatCurrency(vat.output, locale)}`, `Net: ${formatCurrency(vat.net, locale)}` ] },
      ],
      styles: { h1: { fontSize: 16, bold: true }, h2: { fontSize: 14, bold: true } }
    };
    pdfMake.createPdf(doc).download(`Reports_${from}_${to}.pdf`);
  };

  return (
    <div className="panel">
      <h3>{t('financialStatements')}</h3>
      <div className="row">
        <label>{t('period')}: <input type="date" value={from} onChange={e=>setFrom(e.target.value)} /> — <input type="date" value={to} onChange={e=>setTo(e.target.value)} /></label>
        <label>Prev: <input type="date" value={prevFrom} onChange={e=>setPrevFrom(e.target.value)} /> — <input type="date" value={prevTo} onChange={e=>setPrevTo(e.target.value)} /></label>
        <button onClick={exportPdf} className="btn primary">{t('exportPdf')}</button>
      </div>
      <div className="grid">
        <div className="card">
          <div className="card-title">{t('trialBalance')}</div>
          <div className="card-body">
            <div>Total {formatCurrency(tb.totalDebit, locale)} / {formatCurrency(tb.totalCredit, locale)}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-title">VAT</div>
          <div className="card-body">
            <div>Input {formatCurrency(vat.input, locale)} | Output {formatCurrency(vat.output, locale)} | Net {formatCurrency(vat.net, locale)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}