export interface AmortizationRow {
  mes: number;
  saldoInicial: number;
  interes: number;
  abonoCapital: number;
  cuota: number;
  saldoFinal: number;
}

export interface LoanCalculation {
  cuota: number;
  totalPagado: number;
  totalIntereses: number;
  amortizacion: AmortizationRow[];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calcularPrestamo(
  capital: number,
  catAnual: number,
  plazoMeses: number
): LoanCalculation {
  const r = catAnual / 12;
  const factor = Math.pow(1 + r, plazoMeses);
  const cuota = round2((capital * (r * factor)) / (factor - 1));

  const amortizacion: AmortizationRow[] = [];
  let saldo = capital;

  for (let mes = 1; mes <= plazoMeses; mes++) {
    const interes = round2(saldo * r);
    const abonoCapital = round2(cuota - interes);
    const saldoFinal = round2(Math.max(saldo - abonoCapital, 0));
    amortizacion.push({
      mes,
      saldoInicial: round2(saldo),
      interes,
      abonoCapital,
      cuota,
      saldoFinal,
    });
    saldo = saldo - abonoCapital;
  }

  return {
    cuota,
    totalPagado: round2(cuota * plazoMeses),
    totalIntereses: round2(cuota * plazoMeses - capital),
    amortizacion,
  };
}
