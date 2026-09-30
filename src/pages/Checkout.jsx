import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { updateCustomer, selectShippingRate, placeOrder } from "../api/checkout";
import { formatPrice } from "../utils/formatPrice";
import { STATE_OPTIONS, POSTCODE_PATTERNS, ALL_COUNTRIES } from "../utils/regionData";
import { Button } from "../components/common/Button";
import { CheckoutSteps } from "../components/checkout/CheckoutSteps";
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

export function Checkout() {
  const { cart, refreshCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [billing, setBilling] = useState(emptyAddress);
  const [shipToDifferent, setShipToDifferent] = useState(false);
  const [shipping, setShipping] = useState(emptyAddress);
  const [orderNotes, setOrderNotes] = useState("");
  const [selectedRate, setSelectedRate] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

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

  async function handleBillingSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await updateCustomer({
        billing_address: billing,
        shipping_address: shipToDifferent ? shipping : billing,
      });
      await refreshCart();
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save billing details. Please check the form and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleShippingSubmit(e) {
    e.preventDefault();
    const rates = cart.shipping_rates?.[0]?.shipping_rates || [];
    const rate = selectedRate || rates[0]?.rate_id;
    if (!rate) {
      setStep(3);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await selectShippingRate(cart.shipping_rates[0].package_id, rate);
      await refreshCart();
      setStep(3);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not set the shipping method. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const order = await placeOrder({
        payment_method: paymentMethod,
        billing_address: billing,
        shipping_address: shipToDifferent ? shipping : billing,
      });
      await refreshCart();
      navigate("/", { state: { orderId: order.order_id } });
    } catch (err) {
      setError(err?.response?.data?.message || "Checkout failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const shippingRates = cart.shipping_rates?.[0]?.shipping_rates || [];

  return (
    <div>
      <div className="text-center mb-10">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">Checkout</h1>
        <p className="text-slate-500 text-sm mb-6">Please fill in your details below to complete your order.</p>
        <CheckoutSteps current={step} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleBillingSubmit} className="space-y-5">
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

              <div className="pt-2">
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
              </div>

              <div className="pt-2">
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
              </div>

              {shipToDifferent && (
                <div className="space-y-4 border-t border-slate-200 pt-4">
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

              <Button type="submit" variant="accent" disabled={busy} className="w-full">
                {busy ? "Saving..." : "Continue to Shipping →"}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleShippingSubmit} className="space-y-5">
              <h2 className="font-semibold text-slate-900">Shipping method</h2>
              {shippingRates.length === 0 && (
                <p className="text-sm text-slate-500">Standard shipping will be applied at checkout.</p>
              )}
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
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                  ← Back
                </Button>
                <Button type="submit" variant="accent" disabled={busy} className="flex-1">
                  {busy ? "Saving..." : "Continue to Payment →"}
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handlePlaceOrder} className="space-y-5">
              <h2 className="font-semibold text-slate-900">Payment method</h2>
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
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                  ← Back
                </Button>
                <Button type="submit" variant="accent" disabled={busy} className="flex-1">
                  {busy ? "Placing order..." : "Place Order"}
                </Button>
              </div>
            </form>
          )}
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