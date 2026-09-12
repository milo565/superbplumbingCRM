export const GST_RATE = 0.1;

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calcTotals(input: {
  labourHours: number;
  labourRate: number;
  materialsCost: number;
  otherCost: number;
}) {
  const labour = roundMoney(input.labourHours * input.labourRate);
  const subtotal = roundMoney(labour + input.materialsCost + input.otherCost);
  const gstAmount = roundMoney(subtotal * GST_RATE);
  const totalIncGst = roundMoney(subtotal + gstAmount);
  return { labour, subtotal, gstAmount, totalIncGst };
}

export function lineItemTotals(
  items: { quantity: number; unitPrice: number }[],
) {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
  );
  const gstAmount = roundMoney(subtotal * GST_RATE);
  const totalIncGst = roundMoney(subtotal + gstAmount);
  return { subtotal, gstAmount, totalIncGst };
}
