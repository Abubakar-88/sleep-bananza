import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { updateCustomer, selectShippingRate, placeOrder } from "../api/checkout";
import { formatPrice } from "../utils/formatPrice";
import { STATE_OPTIONS, POSTCODE_PATTERNS, ALL_COUNTRIES } from "../utils/regionData";
import { Button } from "../components/common/Button";
import { OrderSummary } from "../components/checkout/OrderSummary";

const COUNTRIES = ALL_COUNTRIES;

const PAYMENT_METHODS = [
  { id: "stripe", label: "Credit / Debit Card", hint: "Visa, Mastercard, Amex" },
  { id: "paypal", label: "PayPal", hint: "Pay with your PayPal account" },
  { id: "cod", label: "Cash on Delivery", hint: "Pay when your order arrives" },
];

const emptyAddress = {
  first_name: "",
  last_name: "",
  company: "",
  country: "US",
  address_1: "",
  address_2: "",
  city: "",
  state: "",
  postcode: "",
  phone: "",
  email: "",
};

// Fields that must be filled before it's worth asking the backend to
// recalculate shipping rates for the address typed so far. WooCommerce's
// Store API rejects update-customer with a (confusingly blank-labelled)
// "is required" error if ANY of these — including email/phone, which are
// easy to forget — are still empty, so this must mirror every `required`
// field in the form below, not just the shipping-relevant ones.
function addressIsQuotable(addr) {
  const hasState = !STATE_OPTIONS[addr.country] || Boolean(addr.state);
  return Boolean(
    addr.first_name &&
    addr.last_name &&
    addr.country &&
    addr.address_1 &&
    addr.city &&
    hasState &&
    addr.postcode &&
    addr.phone &&
    addr.email
  );
}

export function Checkout() {
  const { cart, refreshCart } = useCart();
  const navigate = useNavigate();

  const [billing, setBilling] = useState(emptyAddress);
  const [shipToDifferent, setShipToDifferent] = useState(false);
  const [shipping, setShipping] = useState(emptyAddress);
  const [orderNotes, setOrderNotes] = useState("");
  const [selectedRate, setSelectedRate] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [busy, setBusy] = useState(false);
  const [quotingShipping, setQuotingShipping] = useState(false);
  const [error, setError] = useState(null);

  const quoteTimer = useRef(null);

  // As the shopper finishes typing a usable address, quietly ask the Store
  // API to recalculate shipping — this is what a "Continue to Shipping"
  // step used to do explicitly; on one page it just happens in the
  // background instead, debounced so it doesn't fire on every keystroke.
  useEffect(() => {
    const address = shipToDifferent ? shipping : billing;
    if (!addressIsQuotable(address)) return;

    clearTimeout(quoteTimer.current);
    quoteTimer.current = setTimeout(async () => {
      setQuotingShipping(true);
      try {
        await updateCustomer({
          billing_address: billing,
          shipping_address: shipToDifferent ? shipping : billing,
        });
        await refreshCart();
      } catch {
        // Non-fatal — the shopper can still submit; the final placeOrder
        // call sends the address again and will surface any real error then.
      } finally {
        setQuotingShipping(false);
      }
    }, 700);

    return () => clearTimeout(quoteTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billing, shipping, shipToDifferent]);

  if (!cart?.items?.length) {
    return <p className="text-slate-500">Your cart is empty — add something before checking out.</p>;
  }

  function handleBillingChange(e) {
    const { name, value } = e.target;
    setBilling((prev) => ({
      ...prev,
      [name]: value,
      // Reset state when the country changes so a code from the old country
      // (e.g. "NY") can't be silently submitted for a country that doesn't use it.
      ...(name === "country" ? { state: "" } : {}),
    }));
  }

  function handleShippingChange(e) {
    const { name, value } = e.target;
    setShipping((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "country" ? { state: "" } : {}),
    }));
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const billing_address = billing;
      const shipping_address = shipToDifferent ? shipping : billing;

      // Save the final address first...
      await updateCustomer({ billing_address, shipping_address });
      await refreshCart();

      // ...then lock in whichever shipping rate is selected, if the store has one.
      const rates = cart.shipping_rates?.[0]?.shipping_rates || [];
      const rate = selectedRate || rates[0]?.rate_id;
      if (rate && cart.shipping_rates?.[0]?.package_id != null) {
        await selectShippingRate(cart.shipping_rates[0].package_id, rate);
      }

      const order = await placeOrder({
        payment_method: paymentMethod,
        billing_address,
        shipping_address,
      });
      await refreshCart();
      navigate("/", { state: { orderId: order.order_id } });
    } catch (err) {
      setError(err?.response?.data?.message || "Checkout failed. Please check your details and try again.");
    } finally {
      setBusy(false);
    }
  }

  const shippingRates = cart.shipping_rates?.[0]?.shipping_rates || [];

  return (
    <div>
      <div className="text-center mb-10">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">Checkout</h1>
        <p className="text-slate-500 text-sm">Please fill in your details below to complete your order.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handlePlaceOrder} className="space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
                {error}
              </div>
            )}

            {/* Billing */}
            <section className="space-y-5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center">1</span>
                <h2 className="font-semibold text-slate-900">Billing details</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="First name" required>
                  <input name="first_name" value={billing.first_name} onChange={handleBillingChange} required className="input" />
                </Field>
                <Field label="Last name" required>
                  <input name="last_name" value={billing.last_name} onChange={handleBillingChange} required className="input" />
                </Field>
              </div>

              <Field label="Company name (optional)">
                <input name="company" value={billing.company} onChange={handleBillingChange} className="input" placeholder="Company name" />
              </Field>

              <Field label="Country / Region" required>
                <select name="country" value={billing.country} onChange={handleBillingChange} className="input">
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Street address" required>
                <input name="address_1" value={billing.address_1} onChange={handleBillingChange} required className="input mb-2" placeholder="House number and street name" />
                <input name="address_2" value={billing.address_2} onChange={handleBillingChange} className="input" placeholder="Apartment, suite, unit, etc. (optional)" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Town / City" required>
                  <input name="city" value={billing.city} onChange={handleBillingChange} required className="input" />
                </Field>
                {STATE_OPTIONS[billing.country] ? (
                  <Field label="State / Province" required>
                    <select name="state" value={billing.state} onChange={handleBillingChange} required className="input">
                      <option value="">Select...</option>
                      {STATE_OPTIONS[billing.country].map((s) => (
                        <option key={s.code} value={s.code}>{s.label}</option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <Field label="State / Province (optional)">
                    <input name="state" value={billing.state} onChange={handleBillingChange} className="input" />
                  </Field>
                )}
              </div>

              <Field label="Postcode / ZIP" required>
                <input
                  name="postcode"
                  value={billing.postcode}
                  onChange={handleBillingChange}
                  required
                  pattern={POSTCODE_PATTERNS[billing.country]}
                  title="Enter a valid postcode for the selected country"
                  className="input"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone" required>
                  <input name="phone" value={billing.phone} onChange={handleBillingChange} required className="input" />
                </Field>
                <Field label="Email address" required>
                  <input type="email" name="email" value={billing.email} onChange={handleBillingChange} required className="input" />
                </Field>
              </div>
            </section>

            {/* Order notes */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center">2</span>
                <h2 className="font-semibold text-slate-900">Additional information (optional)</h2>
              </div>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={3}
                className="input"
                placeholder="Order notes (e.g. special notes for delivery)"
              />
            </section>

            {/* Ship to different address */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center">3</span>
                <h2 className="font-semibold text-slate-900">Ship to a different address?</h2>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={shipToDifferent}
                  onChange={(e) => setShipToDifferent(e.target.checked)}
                />
                Yes, I want to ship to a different address.
              </label>

              {shipToDifferent && (
                <div className="space-y-4 border-t border-slate-200 pt-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="First name" required>
                      <input name="first_name" value={shipping.first_name} onChange={handleShippingChange} required className="input" />
                    </Field>
                    <Field label="Last name" required>
                      <input name="last_name" value={shipping.last_name} onChange={handleShippingChange} required className="input" />
                    </Field>
                  </div>
                  <Field label="Country / Region" required>
                    <select name="country" value={shipping.country} onChange={handleShippingChange} className="input">
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Street address" required>
                    <input name="address_1" value={shipping.address_1} onChange={handleShippingChange} required className="input" />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Town / City" required>
                      <input name="city" value={shipping.city} onChange={handleShippingChange} required className="input" />
                    </Field>
                    {STATE_OPTIONS[shipping.country] ? (
                      <Field label="State / Province" required>
                        <select name="state" value={shipping.state} onChange={handleShippingChange} required className="input">
                          <option value="">Select...</option>
                          {STATE_OPTIONS[shipping.country].map((s) => (
                            <option key={s.code} value={s.code}>{s.label}</option>
                          ))}
                        </select>
                      </Field>
                    ) : (
                      <Field label="State / Province (optional)">
                        <input name="state" value={shipping.state} onChange={handleShippingChange} className="input" />
                      </Field>
                    )}
                  </div>
                  <Field label="Postcode / ZIP" required>
                    <input
                      name="postcode"
                      value={shipping.postcode}
                      onChange={handleShippingChange}
                      required
                      pattern={POSTCODE_PATTERNS[shipping.country]}
                      title="Enter a valid postcode for the selected country"
                      className="input"
                    />
                  </Field>
                </div>
              )}
            </section>

            {/* Shipping method */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center">4</span>
                <h2 className="font-semibold text-slate-900">Shipping method</h2>
                {quotingShipping && <span className="text-xs text-slate-400">Updating rates...</span>}
              </div>
              {shippingRates.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Enter your address above to see shipping options — standard shipping will be applied otherwise.
                </p>
              ) : (
                <div className="space-y-3">
                  {shippingRates.map((rate) => (
                    <label
                      key={rate.rate_id}
                      className="flex items-center justify-between border border-slate-300 rounded-md px-4 py-3 cursor-pointer has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50"
                    >
                      <span className="flex items-center gap-3 text-sm">
                        <input
                          type="radio"
                          name="shipping_rate"
                          value={rate.rate_id}
                          checked={(selectedRate || shippingRates[0]?.rate_id) === rate.rate_id}
                          onChange={() => setSelectedRate(rate.rate_id)}
                        />
                        {rate.name}
                      </span>
                      <span className="text-sm font-medium text-slate-900">
                        {rate.price === "0"
                          ? "Free"
                          : formatPrice(rate.price, cart.totals.currency_minor_unit, cart.totals.currency_symbol)}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </section>

            {/* Payment */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center">5</span>
                <h2 className="font-semibold text-slate-900">Payment method</h2>
              </div>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className="flex items-center gap-3 border border-slate-300 rounded-md px-4 py-3 cursor-pointer has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50"
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-900">{method.label}</span>
                      <span className="block text-xs text-slate-500">{method.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <Button type="submit" variant="accent" disabled={busy} className="w-full">
              {busy ? "Placing order..." : "Place Order"}
            </Button>
          </form>
        </div>

        <div>
          <OrderSummary />
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-sm text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}