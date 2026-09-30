// WooCommerce Store API returns prices as minor-unit integers (e.g. cents)
// plus a currency_minor_unit telling you how many decimal places to shift.
// Example: { prices: { price: "1999", currency_minor_unit: 2, currency_symbol: "$" } }
export function formatPrice(minorAmount, currencyMinorUnit = 2, currencySymbol = "$") {
  const amount = Number(minorAmount) / Math.pow(10, currencyMinorUnit);
  return `${currencySymbol}${amount.toFixed(currencyMinorUnit)}`;
}

export function formatPriceFromProduct(product) {
  if (!product?.prices) return "";
  return formatPrice(
    product.prices.price,
    product.prices.currency_minor_unit,
    product.prices.currency_symbol
  );
}
