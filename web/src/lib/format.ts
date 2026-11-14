export const uid = (prefix = 'id') =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;

export const inr = (amount: number) => `₹${Math.round(amount).toLocaleString('en-IN')}`;

export const plural = (n: number, one: string, many?: string) =>
  `${n.toLocaleString('en-IN')} ${n === 1 ? one : (many ?? `${one}s`)}`;
