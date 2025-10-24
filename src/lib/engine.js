// Core accounting engine: double-entry enforcement, ledger, TB, FS, VAT
import Decimal from 'decimal.js';
import { defaultCOA } from './coa.js';

export const EngineState = {
  journals: [],
  locks: [], // {period: '2024-09', lockedBy, at}
  audits: [], // {at, user, action, ref}
  settings: { language: 'id' }
};

function isLocked(date) {
  const ym = new Date(date).toISOString().slice(0,7);
  return EngineState.locks.some(l => l.period === ym);
}

export function lockPeriod(period, user) {
  if (!EngineState.locks.find(l => l.period === period)) {
    EngineState.locks.push({ period, lockedBy: user || 'system', at: new Date().toISOString() });
    EngineState.audits.push({ at: new Date().toISOString(), user, action: 'lock', ref: period });
  }
}

export function unlockPeriod(period, user) {
  EngineState.locks = EngineState.locks.filter(l => l.period !== period);
  EngineState.audits.push({ at: new Date().toISOString(), user, action: 'unlock', ref: period });
}

export function addAudit({ user, action, ref, meta }) {
  EngineState.audits.push({ at: new Date().toISOString(), user: user || 'system', action, ref, meta });
}

export function postJournal({ date, ref, description, lines, user }) {
  if (isLocked(date)) throw new Error('Period locked');
  // Double-entry enforcement
  const debit = lines.reduce((s,l)=> new Decimal(s).plus(l.debit||0), new Decimal(0));
  const credit = lines.reduce((s,l)=> new Decimal(s).plus(l.credit||0), new Decimal(0));
  if (!debit.equals(credit)) throw new Error('Σdebit ≠ Σcredit');
  const j = { id: EngineState.journals.length+1, date, ref, description, lines };
  EngineState.journals.push(j);
  EngineState.audits.push({ at: new Date().toISOString(), user, action: 'post', ref });
  return j;
}

export function ledger(fromDate, toDate) {
  // Return map accountCode -> entries & running balance
  const entries = {};
  EngineState.journals
    .filter(j => (!fromDate || new Date(j.date)>=new Date(fromDate)) && (!toDate || new Date(j.date)<=new Date(toDate)))
    .forEach(j => {
      j.lines.forEach(l => {
        const acc = entries[l.account] || { account: l.account, rows: [], debit: new Decimal(0), credit: new Decimal(0) };
        acc.rows.push({ date: j.date, ref: j.ref, description: j.description, debit: l.debit||0, credit: l.credit||0 });
        acc.debit = acc.debit.plus(l.debit||0);
        acc.credit = acc.credit.plus(l.credit||0);
        entries[l.account] = acc;
      });
    });
  // compute balance (Assets/Expenses debit nature; Liabilities/Equity/Revenue credit nature)
  const debitNature = code => ['1','5'].includes(code[0]);
  Object.values(entries).forEach(acc => {
    const bal = acc.debit.minus(acc.credit);
    acc.balance = debitNature(acc.account) ? bal : bal.neg();
  });
  return entries;
}

export function trialBalance(fromDate, toDate) {
  const led = ledger(fromDate, toDate);
  const rows = Object.values(led).map(acc => {
    const net = acc.debit.minus(acc.credit); // debit - credit
    const debit = Number(Decimal.max(net, 0));
    const credit = Number(Decimal.max(net.neg(), 0));
    return { account: acc.account, debit, credit };
  });
  const totalDebit = rows.reduce((s,r)=>s+Number(r.debit),0);
  const totalCredit = rows.reduce((s,r)=>s+Number(r.credit),0);
  return { rows, totalDebit, totalCredit };
}

export function financialStatements(fromDate, toDate, prevFromDate, prevToDate) {
  // Simple aggregation by first digit
  const tb = trialBalance(fromDate, toDate);
  const prev = prevFromDate && prevToDate ? trialBalance(prevFromDate, prevToDate) : null;
  const sumGroup = (rows, digit) => rows.filter(r=>r.account.startsWith(digit)).reduce((s,r)=> s + (digit==='4' || digit==='2' || digit==='3' ? Number(r.credit) - Number(r.debit) : Number(r.debit) - Number(r.credit)), 0);
  const assets = sumGroup(tb.rows,'1');
  const liabilities = sumGroup(tb.rows,'2');
  const equity = sumGroup(tb.rows,'3');
  const revenue = sumGroup(tb.rows,'4');
  const expenses = sumGroup(tb.rows,'5');
  const profit = revenue - expenses;
  const retainedEarnings = equity; // simplified: assume all equity accounts map to retained earnings
  const cashFlowsIndirect = profit // starting point
    + 0; // placeholder for WC adjustments
  return {
    position: { assets, liabilities, equity: equity + profit },
    profitOrLoss: { revenue, expenses, profit },
    changesInEquity: { retainedEarnings, profit },
    cashFlows: { indirect: cashFlowsIndirect },
    comparatives: prev ? {
      position: {
        assets: sumGroup(prev.rows,'1'),
        liabilities: sumGroup(prev.rows,'2'),
        equity: sumGroup(prev.rows,'3') + (sumGroup(prev.rows,'4') - sumGroup(prev.rows,'5')),
      },
      profitOrLoss: { revenue: sumGroup(prev.rows,'4'), expenses: sumGroup(prev.rows,'5'), profit: sumGroup(prev.rows,'4') - sumGroup(prev.rows,'5') },
    } : null
  };
}

export function vatReport(fromDate, toDate) {
  // VAT Input (5400) and VAT Output (2200) by journal lines
  let input = new Decimal(0), output = new Decimal(0);
  EngineState.journals
    .filter(j => (!fromDate || new Date(j.date)>=new Date(fromDate)) && (!toDate || new Date(j.date)<=new Date(toDate)))
    .forEach(j => j.lines.forEach(l => {
      if (l.account === '5400') input = input.plus(l.debit||0).minus(l.credit||0);
      if (l.account === '2200') output = output.plus(l.credit||0).minus(l.debit||0);
    }));
  return { input: Number(input), output: Number(output), net: Number(output.minus(input)) };
}

export function seedCOA() { return defaultCOA; }