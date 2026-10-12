import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, X, CreditCard, ShieldCheck, Navigation, Phone, CheckCircle,
  Star, Bell, Utensils, ChevronRight, Percent, Minus, Plus, Store as StoreIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useApp, formatZAR, StatusBadge, StageStepper, LiveMap } from "../context/AppContext";
import type { Order, Store } from "../types";
import { SUBURBS } from "../mockData";

export function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return <div className="flex justify-between text-slate-600"><span>{label}</span><span className={`font-semibold ${tone || "text-slate-800"}`}>{value}</span></div>;
}

export function CartView({ onCheckout, onBack }: { onCheckout: () => void; onBack: () => void }) {
  const app = useApp();
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState<string | undefined>();
  const [tip, setTip] = useState(0);
  const totals = app.computeTotals(applied, tip);
  const store = app.stores.find((s) => s.id === app.cartStoreId);
  const apply = () => {
    const code = promo.trim().toUpperCase();
    if (["LEKKER10", "MZANSIFREE", "HERITAGE25"].includes(code)) { setApplied(code); toast.success("Promo applied 🎉"); }
    else { setApplied(undefined); toast.error("Invalid promo code"); }
  };
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-slate-600"><X className="h-4 w-4" /> Continue shopping</button>
      <h2 className="text-xl font-black text-slate-800">Your basket</h2>
      {app.cart.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-slate-900/10"><p className="text-4xl">🛒</p><p className="mt-2 font-bold text-slate-700">Your basket is empty</p><p className="text-sm text-slate-500">Add some lekker items from a store.</p></div>
      ) : (
        <>
          <div className="rounded-2xl bg-white p-3 text-sm ring-1 ring-slate-900/10">
            <div className="flex items-center gap-2 font-semibold text-slate-700"><StoreIcon className="h-4 w-4 text-[#D97706]" />{store?.name}</div>
            <p className="mt-1 text-xs text-amber-700">Single-store basket · items ship together</p>
          </div>
          <div className="space-y-2">
            {app.cart.map((l) => (
              <div key={l.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-900/10">
                <img src={l.image} className="h-12 w-12 rounded-lg object-cover" alt={l.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800">{l.name}</p>
                  {l.optionName && <p className="text-xs text-slate-500">{l.optionName}</p>}
                  {l.special && <p className="truncate text-xs italic text-slate-400">&ldquo;{l.special}&rdquo;</p>}
                  <p className="text-sm font-bold text-[#D97706]">{formatZAR((l.unitPrice + (l.optionDelta || 0)) * l.qty)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => app.updateCartQty(l.id, l.qty - 1)} className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100"><Minus className="h-4 w-4" /></button>
                  <span className="w-5 text-center font-bold">{l.qty}</span>
                  <button onClick={() => app.updateCartQty(l.id, l.qty + 1)} className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100"><Plus className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-900/10">
            <div className="flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-slate-50 px-3 ring-1 ring-slate-200"><Percent className="h-4 w-4 text-[#D97706]" /><input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="Promo: LEKKER10 / MZANSIFREE / HERITAGE25" className="w-full bg-transparent py-2 text-sm outline-none" /></div>
              <button onClick={apply} className="rounded-xl bg-[#0F172A] px-4 text-sm font-bold text-white">Apply</button>
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">Driver tip</p>
            <div className="mt-1.5 flex gap-2">
              {[0, 10, 20, 30].map((t) => <button key={t} onClick={() => setTip(t)} className={`flex-1 rounded-xl py-2 text-sm font-bold ring-1 transition ${tip === t ? "bg-emerald-50 text-emerald-700 ring-emerald-500" : "ring-slate-200 text-slate-600"}`}>{t === 0 ? "No tip" : `R${t}`}</button>)}
            </div>
            <input type="number" value={tip || ""} onChange={(e) => setTip(Math.max(0, +e.target.value))} placeholder="Custom tip (R)" className="mt-2 w-full rounded-xl bg-slate-50 px-3 py-2 text-sm outline-none ring-1 ring-slate-200" />
            <div className="mt-4 space-y-1.5 border-t border-dashed border-slate-200 pt-3 text-sm">
              <Row label="Subtotal" value={formatZAR(totals.subtotal)} />
              {totals.discount > 0 && <Row label={`Discount (${applied})`} value={`-${formatZAR(totals.discount)}`} tone="text-emerald-600" />}
              <Row label="Delivery fee" value={totals.deliveryFee === 0 ? "FREE" : formatZAR(totals.deliveryFee)} />
              <Row label="Service fee" value={formatZAR(totals.serviceFee)} />
              {totals.tip > 0 && <Row label="Driver tip" value={formatZAR(totals.tip)} />}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-black text-slate-800"><span>Total</span><span>{formatZAR(totals.total)}</span></div>
            </div>
            <button onClick={onCheckout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D97706] py-3.5 font-bold text-white shadow-lg shadow-amber-500/30 active:scale-[0.98]"><CreditCard className="h-5 w-5" /> Checkout · {formatZAR(totals.total)}</button>
          </div>
        </>
      )}
    </div>
  );
}

export function CheckoutView({ onDone, onBack }: { onDone: (id: string) => void; onBack: () => void }) {
  const app = useApp();
  const [method, setMethod] = useState("PayFast · Instant EFT");
  const [processing, setProcessing] = useState(false);
  const totals = app.computeTotals(undefined, 0);
  const methods = ["PayFast · Instant EFT", "PayFast · Credit/Debit Card", "PayFast · Masterpass", "PayFast · Zapper QR"];
  const pay = () => {
    setProcessing(true);
    setTimeout(() => {
      const order = app.placeOrder({ tip: 0, paymentMethod: method });
      setProcessing(false);
      if (order) onDone(order.id);
    }, 1500);
  };
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-slate-600"><X className="h-4 w-4" /> Back to basket</button>
      <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-900/10">
        <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-[#D97706]" /><div><p className="text-xs font-bold uppercase text-slate-400">Delivering to</p><p className="font-bold text-slate-800">{app.activeAddress.line1}, {app.activeAddress.suburb}</p></div></div>
      </div>
      <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-900/10">
        <div className="flex items-center justify-between"><h3 className="font-black text-slate-800">Secure PayFast checkout</h3><span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><ShieldCheck className="h-4 w-4" />256-bit</span></div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {methods.map((m) => <button key={m} onClick={() => setMethod(m)} className={`rounded-xl p-3 text-left text-sm ring-1 transition ${method === m ? "bg-amber-50 ring-[#D97706] font-bold" : "ring-slate-200"}`}>{m.replace("PayFast · ", "")}</button>)}
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
          <Row label="Items" value={formatZAR(totals.subtotal)} />
          <Row label="Delivery + service" value={formatZAR(totals.deliveryFee + totals.serviceFee)} />
          <div className="mt-1 flex justify-between border-t border-dashed border-slate-200 pt-1 font-black text-slate-800"><span>Pay now</span><span>{formatZAR(totals.total)}</span></div>
        </div>
        <button onClick={pay} disabled={processing} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#10B981] py-3.5 font-bold text-white shadow-lg shadow-emerald-500/30 active:scale-[0.98] disabled:opacity-70">
          {processing ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Contacting PayFast…</span> : <><CreditCard className="h-5 w-5" /> Pay {formatZAR(totals.total)}</>}
        </button>
        <p className="mt-2 text-center text-[11px] text-slate-400">Simulated gateway · no real charge · all amounts in ZAR (R)</p>
      </div>
    </div>
  );
}

function stageText(s: Order["status"]) {
  return s === "payment_processed" ? "Payment confirmed" : s === "store_received" ? "Store notified" : s === "store_accepted" ? "Store accepted" : s === "store_preparing" ? "Preparing your food" : s === "driver_broadcast" ? "Finding a driver" : s === "driver_assigned" ? "Driver on the way to store" : s === "driver_at_store" ? "Driver at the store" : s === "collection_verified" ? "Order collected" : s === "driver_en_route" ? "Driver coming to you" : s === "driver_arrived_customer" ? "Driver outside!" : s === "delivery_completed" ? "Delivered" : s === "cancelled" ? "Cancelled" : "Placing order";
}

export function TrackView({ order, onBack }: { order: Order; onBack: () => void }) {
  const app = useApp();
  const store = app.stores.find((s) => s.id === order.storeId)!;
  const [cancel, setCancel] = useState(false);
  const [rate, setRate] = useState(false);
  const done = order.status === "delivery_completed" || order.status === "rating_submitted";
  const eta = order.estimatedArrival ? Math.max(0, Math.round((order.estimatedArrival - Date.now()) / 60000)) : undefined;
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-slate-600"><X className="h-4 w-4" /> My orders</button>
      <div className="rounded-3xl bg-gradient-to-br from-[#0F172A] to-[#1e293b] p-5 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div><p className="text-xs uppercase tracking-wider text-amber-300">Order {order.ref}</p><h2 className="text-xl font-black">{store.name}</h2></div>
          <span className="text-3xl">{store.logo}</span>
        </div>
        {!done && order.status !== "cancelled" && (
          <div className="mt-4 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
            <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><Navigation className="h-4 w-4 text-amber-300" /> {stageText(order.status)}</span>{eta !== undefined && <span className="font-bold text-amber-300">ETA {eta} min</span>}</div>
          </div>
        )}
        <div className="mt-4"><StageStepper status={order.status} /></div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-900/10">
        <LiveMap store={store.coords} customer={order.address.coords} driver={order.location} progress={order.routeProgress || 0} />
      </div>

      {order.driverName && (
        <div className="flex items-center gap-3 rounded-3xl bg-white p-4 ring-1 ring-slate-900/10">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-xl">🛵</div>
          <div className="flex-1"><p className="font-bold text-slate-800">{order.driverName}</p><p className="text-xs text-slate-500">{order.vehicle}</p></div>
          <a href={`tel:${order.driverPhone}`} className="flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-white"><Phone className="h-4 w-4" /> Call</a>
        </div>
      )}

      <div className="rounded-3xl bg-white p-4 text-sm ring-1 ring-slate-900/10">
        <p className="font-black text-slate-800">Receipt</p>
        <div className="mt-2 space-y-1.5">
          {order.items.map((it, i) => <div key={i} className="flex justify-between text-slate-600"><span>{it.qty}× {it.name}{it.optionName ? ` (${it.optionName})` : ""}</span><span className="font-semibold">{formatZAR(it.unitPrice * it.qty)}</span></div>)}
          <div className="mt-1 flex justify-between border-t border-dashed border-slate-200 pt-2 font-black text-slate-800"><span>Total paid</span><span>{formatZAR(order.total)}</span></div>
        </div>
        <p className="mt-2 text-xs text-slate-400">Drop-off PIN (share only on arrival): <span className="font-mono font-bold tracking-widest text-slate-600">{order.dropPin}</span></p>
      </div>

      {done && !order.rating && <button onClick={() => setRate(true)} className="w-full rounded-2xl bg-[#D97706] py-3.5 font-bold text-white shadow-lg shadow-amber-500/30">Rate your order ⭐</button>}
      {order.rating && <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-900/10"><p className="font-bold text-slate-800">Your review</p><p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{order.rating.storeRating} store · {order.rating.driverRating} driver</p><p className="mt-1 text-sm italic text-slate-500">&ldquo;{order.rating.comment}&rdquo;</p></div>}
      {!done && order.status !== "cancelled" && <button onClick={() => setCancel(true)} className="w-full rounded-2xl bg-white py-3 text-sm font-bold text-rose-600 ring-1 ring-rose-200">Cancel order</button>}

      <AnimatePresence>{cancel && <CancelModal order={order} onClose={() => setCancel(false)} onCancel={(r) => { app.cancelOrder(order.id, r); setCancel(false); }} />}</AnimatePresence>
      <AnimatePresence>{rate && <RateModal order={order} onClose={() => setRate(false)} onSubmit={(sr, dr, c) => { app.rateOrder(order.id, sr, dr, c); setRate(false); }} />}</AnimatePresence>
    </div>
  );
}

function CancelModal({ order, onClose, onCancel }: { order: Order; onClose: () => void; onCancel: (r: string) => void }) {
  const reasons = ["Changed my mind", "Ordered by mistake", "Taking too long", "Wrong items"];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-white p-5">
        <h3 className="text-lg font-black text-slate-800">Cancel {order.ref}?</h3>
        <p className="mt-1 text-sm text-slate-500">Refunds are processed via PayFast within 24h.</p>
        <div className="mt-3 space-y-2">{reasons.map((r) => <button key={r} onClick={() => onCancel(r)} className="w-full rounded-xl bg-slate-50 px-3 py-2.5 text-left text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-rose-50">{r}</button>)}</div>
        <button onClick={onClose} className="mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-slate-500">Keep my order</button>
      </motion.div>
    </motion.div>
  );
}

function Stars({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="mt-3 flex items-center gap-2">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      {[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => onChange(n)}><Star className={`h-6 w-6 ${n <= value ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} /></button>)}
    </div>
  );
}

function RateModal({ order, onClose, onSubmit }: { order: Order; onClose: () => void; onSubmit: (sr: number, dr: number, c: string) => void }) {
  const [sr, setSr] = useState(5); const [dr, setDr] = useState(5); const [c, setC] = useState("");
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-end bg-black/40 sm:place-items-center" onClick={onClose}>
      <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-white p-5 sm:rounded-3xl">
        <div className="flex items-center justify-between"><h3 className="text-lg font-black text-slate-800">Rate your order</h3><button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button></div>
        <Stars label="Store · " value={sr} onChange={setSr} />
        <Stars label="Driver · " value={dr} onChange={setDr} />
        <textarea value={c} onChange={(e) => setC(e.target.value)} placeholder="How was the food & service?" className="mt-3 h-20 w-full resize-none rounded-xl bg-slate-50 p-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-[#D97706]" />
        <button onClick={() => onSubmit(sr, dr, c || "Lekker!")} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D97706] py-3 font-bold text-white"><CheckCircle className="h-5 w-5" /> Submit review</button>
      </motion.div>
    </motion.div>
  );
}

export function OrdersView({ orders, onTrack }: { orders: Order[]; onTrack: (id: string) => void }) {
  const app = useApp();
  const active = orders.filter((o) => !["rating_submitted", "cancelled"].includes(o.status));
  const history = orders.filter((o) => ["rating_submitted", "cancelled"].includes(o.status));
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-800">My orders</h2>
      {active.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">In progress</p>
          {active.map((o) => <OrderRow key={o.id} o={o} onTrack={onTrack} store={app.stores.find((s) => s.id === o.storeId)!} live />)}
        </div>
      )}
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">History</p>
      {history.map((o) => <OrderRow key={o.id} o={o} onTrack={onTrack} store={app.stores.find((s) => s.id === o.storeId)!} />)}
      {orders.length === 0 && <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-slate-900/10"><p className="text-4xl">🧾</p><p className="mt-2 font-bold text-slate-700">No orders yet</p></div>}
    </div>
  );
}
function OrderRow({ o, onTrack, store, live }: { o: Order; onTrack: (id: string) => void; store: Store; live?: boolean }) {
  return (
    <button onClick={() => onTrack(o.id)} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-slate-900/10 transition hover:shadow-md">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-100 text-xl">{store.logo}</div>
      <div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-800">{o.storeName}</p><p className="text-xs text-slate-500">{o.ref} · {formatZAR(o.total)}</p><div className="mt-1"><StatusBadge status={o.status} /></div></div>
      {live && <ChevronRight className="h-5 w-5 text-slate-300" />}
    </button>
  );
}

export function NotificationsView({ onBack }: { onBack: () => void }) {
  const app = useApp();
  const list = app.notifications.filter((n) => n.audience === "customer");
  return (
    <div className="space-y-3">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-slate-600"><X className="h-4 w-4" /> Back</button>
      <h2 className="text-xl font-black text-slate-800">Notifications</h2>
      {list.length === 0 && <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-slate-900/10"><p className="text-4xl">🔔</p><p className="mt-2 text-slate-500">All caught up!</p></div>}
      {list.map((n) => (
        <div key={n.id} className={`rounded-2xl bg-white p-3 ring-1 ${n.read ? "ring-slate-900/10 opacity-70" : "ring-amber-200"}`}>
          <div className="flex items-center gap-2"><Bell className="h-4 w-4 text-[#D97706]" /><p className="font-bold text-slate-800">{n.title}</p></div>
          <p className="mt-0.5 text-sm text-slate-500">{n.body}</p>
          <p className="mt-1 text-[11px] text-slate-400">{new Date(n.at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      ))}
    </div>
  );
}

export function ProfileView({ onBack }: { onBack: () => void }) {
  const app = useApp();
  const [newSub, setNewSub] = useState(SUBURBS["Cape Town"][0].name);
  const [line1, setLine1] = useState("");
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-slate-600"><X className="h-4 w-4" /> Back</button>
      <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-900/10">
        <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0F172A] text-lg font-black text-amber-300">{app.customer.fullName.charAt(0)}</div><div><p className="font-black text-slate-800">{app.customer.fullName}</p><p className="text-sm text-slate-500">{app.customer.email}</p></div></div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-sm"><span className="flex items-center gap-2"><Phone className="h-4 w-4" />{app.customer.phone}</span>{app.customer.phoneVerified ? <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle className="h-4 w-4" />Verified</span> : <button onClick={app.verifyPhone} className="rounded-lg bg-[#D97706] px-3 py-1 text-xs font-bold text-white">Verify via SMS</button>}</div>
        <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-sm"><span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{app.customer.homeAddress.line1}</span>{app.customer.addressVerified ? <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle className="h-4 w-4" />Verified</span> : <button onClick={app.verifyAddress} className="rounded-lg bg-[#D97706] px-3 py-1 text-xs font-bold text-white">Verify address</button>}</div>
      </div>

      <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-900/10">
        <p className="flex items-center gap-2 font-black text-slate-800"><Utensils className="h-4 w-4 text-[#D97706]" />Delivery location</p>
        <p className="mt-1 text-xs text-slate-500">Order to any GPS pin — not just your home address.</p>
        <div className="mt-3 space-y-2">
          {app.customer.savedAddresses.map((a) => (
            <button key={a.id} onClick={() => app.setActiveAddress(a)} className={`flex w-full items-center gap-2 rounded-xl p-2.5 text-left text-sm ring-1 transition ${app.activeAddress.id === a.id ? "bg-amber-50 ring-[#D97706]" : "ring-slate-200"}`}>
              <MapPin className="h-4 w-4 text-[#D97706]" /><span className="flex-1"><span className="font-bold">{a.label}</span> · {a.line1}, {a.suburb}</span>{app.activeAddress.id === a.id && <CheckCircle className="h-4 w-4 text-emerald-600" />}
            </button>
          ))}
        </div>
        <div className="mt-3 rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-bold uppercase text-slate-400">Drop a new GPS pin</p>
          <select value={newSub} onChange={(e) => setNewSub(e.target.value)} className="mt-2 w-full rounded-lg bg-white px-2 py-2 text-sm ring-1 ring-slate-200">
            {Object.entries(SUBURBS).map(([city, subs]) => subs.map((s) => <option key={city + s.name} value={s.name}>{s.name} · {city}</option>))}
          </select>
          <input value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="Street number & name" className="mt-2 w-full rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200" />
          <button onClick={() => {
            const subs = Object.values(SUBURBS).flat();
            const sub = subs.find((s) => s.name === newSub) || subs[0];
            const city = (Object.entries(SUBURBS).find(([, arr]) => arr.some((x) => x.name === sub.name))?.[0] || "Cape Town") as import("../types").City;
            app.addSavedAddress({ id: "addr-" + Date.now(), label: line1 || "New pin", line1: line1 || `GPS ${sub.name}`, suburb: sub.name, city, postalCode: "0000", coords: { lat: sub.lat, lng: sub.lng }, verified: true });
            setLine1("");
          }} className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-[#10B981] py-2 text-sm font-bold text-white"><Navigation className="h-4 w-4" /> Use this GPS location</button>
        </div>
      </div>
      <button onClick={app.resetAll} className="w-full rounded-2xl bg-white py-3 text-sm font-bold text-rose-600 ring-1 ring-rose-200">Reset demo data</button>
    </div>
  );
}