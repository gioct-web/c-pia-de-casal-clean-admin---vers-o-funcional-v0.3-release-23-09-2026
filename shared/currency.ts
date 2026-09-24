export function parseBRL(value: string): number {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) / 100 : 0;
}

export function formatBRLInput(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number.isFinite(value) ? value : 0);
}
