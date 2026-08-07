/**
 * Ghana statutory payroll engine — pure, unit-testable.
 *
 * Take-home is computed as:
 *   net = gross − employee SSNIT (5.5%) − PAYE income tax
 *
 * PAYE is a progressive tax applied to the ANNUALISED chargeable income
 * (monthly chargeable × 12) using the current annual brackets, then scaled
 * back to a monthly amount. Employer SSNIT (13%) and NHIL (2.5%) are recorded
 * as informational employer contributions — they are NOT withheld from the
 * employee's pay.
 *
 * Rates are a single source of truth here so a change of law is a one-line edit.
 */

/** Employee social-security (SSNIT tier 1) contribution, as a fraction of gross. */
export const SSNIT_EMPLOYEE_RATE = 0.055;
/** Employer's SSNIT share — informational only. */
export const SSNIT_EMPLOYER_RATE = 0.13;
/** National Health Insurance Levy (employer share) — informational only. */
export const NHIL_RATE = 0.0275;

export interface PayeBracket {
  /** Lower bound of the band (inclusive). */
  readonly min: number;
  /** Upper bound of the band (exclusive). `Infinity` for the top band. */
  readonly max: number;
  /** Marginal rate applied within the band. */
  readonly rate: number;
}

/**
 * Annual Ghana PAYE brackets (GHS), applied to annualised chargeable income.
 * Update this table when tax law changes.
 */
export const PAYE_BRACKETS: readonly PayeBracket[] = [
  { min: 0, max: 4880, rate: 0 },
  { min: 4880, max: 6960, rate: 0.05 },
  { min: 6960, max: 20760, rate: 0.1 },
  { min: 20760, max: 298000, rate: 0.175 },
  { min: 298000, max: 600000, rate: 0.25 },
  { min: 600000, max: Infinity, rate: 0.35 },
];

/** A single line on the payslip deductions table. */
export interface DeductionLine {
  name: string;
  amount: number;
}

export interface EmployerContributions {
  ssnit: number;
  nhil: number;
}

export interface PayrollComputed {
  gross: number;
  ssnitEmployee: number;
  paye: number;
  totalDeductions: number;
  net: number;
  deductions: DeductionLine[];
  employerContributions: EmployerContributions;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Total progressive income tax on an annual chargeable income. */
export function annualPaye(annualChargeable: number): number {
  if (annualChargeable <= 0) return 0;
  let tax = 0;
  let remaining = annualChargeable;
  for (const band of PAYE_BRACKETS) {
    if (remaining <= 0) break;
    const width = band.max - band.min;
    const taxableInBand = Math.min(remaining, width);
    tax += taxableInBand * band.rate;
    remaining -= taxableInBand;
  }
  return round2(tax);
}

/**
 * Computes the full payroll breakdown (deductions + net) for a gross amount.
 * Gross is treated as cents-rounded to two decimal places.
 */
export function computePayroll(gross: number): PayrollComputed {
  const grossRounded = round2(gross);
  if (grossRounded <= 0) {
    return {
      gross: 0,
      ssnitEmployee: 0,
      paye: 0,
      totalDeductions: 0,
      net: 0,
      deductions: [],
      employerContributions: { ssnit: 0, nhil: 0 },
    };
  }

  const ssnitEmployee = round2(grossRounded * SSNIT_EMPLOYEE_RATE);
  const chargeableMonthly = round2(grossRounded - ssnitEmployee);
  const annualTax = annualPaye(round2(chargeableMonthly * 12));
  const paye = round2(annualTax / 12);

  const totalDeductions = round2(ssnitEmployee + paye);
  const net = round2(grossRounded - totalDeductions);

  const deductions: DeductionLine[] = [
    { name: 'SSNIT (staff 5.5%)', amount: ssnitEmployee },
    { name: 'PAYE (income tax)', amount: paye },
  ];

  const employerContributions: EmployerContributions = {
    ssnit: round2(grossRounded * SSNIT_EMPLOYER_RATE),
    nhil: round2(grossRounded * NHIL_RATE),
  };

  return {
    gross: grossRounded,
    ssnitEmployee,
    paye,
    totalDeductions,
    net,
    deductions,
    employerContributions,
  };
}