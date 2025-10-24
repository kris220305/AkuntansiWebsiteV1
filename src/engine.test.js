import { describe, it, expect } from 'vitest'
import { EngineState, postJournal, trialBalance, financialStatements, vatReport } from './lib/engine.js'

describe('Journal → Ledger → TB → FS pipeline', () => {
  it('enforces double-entry and flows to reports', () => {
    // Clear state
    EngineState.journals.length = 0
    // Post a basic sales journal: cash debit, sales credit, VAT output credit
    postJournal({
      date:'2024-10-01', ref:'JV-001', description:'Sale', user:'test',
      lines:[
        { account:'1110', debit:1100000, credit:0 }, // cash
        { account:'4100', debit:0, credit:1000000 }, // sales
        { account:'2200', debit:0, credit:100000 }, // vat output 10%
      ]
    })
    const tb = trialBalance('2024-10-01','2024-10-31')
    expect(tb.totalDebit).toEqual(tb.totalCredit)
    const fs = financialStatements('2024-10-01','2024-10-31')
    expect(fs.profitOrLoss.revenue).toBeGreaterThan(0)
    const vat = vatReport('2024-10-01','2024-10-31')
    expect(vat.output).toBe(100000)
  })
})