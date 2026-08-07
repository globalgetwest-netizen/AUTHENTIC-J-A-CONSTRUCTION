import { describe, expect, it } from 'vitest';
import {
  NHIL_RATE,
  PAYE_BRACKETS,
  SSNIT_EMPLOYEE_RATE,
  SSNIT_EMPLOYER_RATE,
  annualPaye,
  computePayroll,
} from './ghana-tax';

describe('annualPaye', () => {
  it('returns zero for non-positive income', () => {
    expect(annualPaye(0)).toBe(0);
    expect(annualPaye(-100)).toBe(0);
  });

  it('taxes nothing in the zero band', () => {
    expect(annualPaye(4880)).toBe(0);
  });

  it('applies 5% just above the zero band', () => {
    // 1 GHS into the 5% band → 0.05
    expect(annualPaye(4881)).toBeCloseTo(0.05);
  });

  it('applies marginal rates incrementally', () => {
    // 20,000 → 0% full band + 5% (2,080) + 10% (13,760)
    const expected = 2080 * 0.05 + (20000 - 6960) * 0.1;
    expect(annualPaye(20000)).toBeCloseTo(expected);
  });

  it('defines an ascending bracket table ending in the top band', () => {
    expect(PAYE_BRACKETS[0]!.rate).toBe(0);
    expect(PAYE_BRACKETS[PAYE_BRACKETS.length - 1]!.max).toBe(Infinity);
    for (let i = 1; i < PAYE_BRACKETS.length; i += 1) {
      expect(PAYE_BRACKETS[i]!.min).toBe(PAYE_BRACKETS[i - 1]!.max);
      expect(PAYE_BRACKETS[i]!.rate).toBeGreaterThan(PAYE_BRACKETS[i - 1]!.rate);
    }
  });
});

describe('computePayroll', () => {
  it('returns zeros for non-positive gross', () => {
    const result = computePayroll(0);
    expect(result).toMatchObject({ gross: 0, net: 0, totalDeductions: 0 });
    expect(result.deductions).toEqual([]);
  });

  it('computes the full Ghana breakdown for a GHS 4,500 salary', () => {
    const result = computePayroll(4500);

    // SSNIT employee 5.5%
    expect(result.ssnitEmployee).toBe(4500 * SSNIT_EMPLOYEE_RATE);

    // Chargeable = 4,500 − 247.50 = 4,252.50 → annual 51,030
    // 0@4,880 + 5%x2,080 (=104) + 10%x13,800 (=1,380) + 17.5%x30,270 (=5,297.25)
    // annual = 6,781.25 → monthly PAYE ≈ 565.10
    expect(result.paye).toBeCloseTo(565.1, 2);
    expect(result.totalDeductions).toBeCloseTo(result.ssnitEmployee + result.paye, 2);
    expect(result.net).toBeCloseTo(4500 - result.totalDeductions, 2);
    expect(result.employerContributions.ssnit).toBe(4500 * SSNIT_EMPLOYER_RATE);
    expect(result.employerContributions.nhil).toBe(4500 * NHIL_RATE);

    // net = 4,500 − 812.60 = 3,687.40
    expect(result.net).toBeCloseTo(3687.4, 2);
  });

  it('exposes each deduction as a line item', () => {
    const result = computePayroll(4500);
    expect(result.deductions).toHaveLength(2);
    expect(result.deductions.map((d) => d.amount)).toContain(result.ssnitEmployee);
    expect(result.deductions.map((d) => d.amount)).toContain(result.paye);
    expect(result.deductions.reduce((sum, d) => sum + d.amount, 0)).toBeCloseTo(
      result.totalDeductions,
      2,
    );
  });

  it('keeps net consistent with gross minus statutory deductions at a high salary', () => {
    const result = computePayroll(120000);
    expect(result.paye).toBeGreaterThan(result.ssnitEmployee);
    expect(result.net).toBeLessThan(result.gross);
    expect(result.totalDeductions).toBeCloseTo(result.ssnitEmployee + result.paye, 2);
  });
});