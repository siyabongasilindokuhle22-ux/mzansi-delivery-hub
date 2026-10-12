import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell, Check, X, Plus, Trash2, Tag, Settings,
  TrendingUp, BarChart3, ShieldCheck, ChefHat, Percent, Receipt, Bike,
} from "lucide-react";
import { useApp, formatZAR, StatusBadge } from "../context/AppContext";
import { BUSY_LEVELS, type Product, type Store } from "../types";

type Tab = "orders" | "menu" | "insights" | "settings";

export default function StorePortal() {
  const app = useApp();
  const [tab, setTab] = useState<Tab>("orders");
  const store = app.stores.find((s) => s.id === app.activeStoreId) || app.stores[0];
  const storeOrders = app.orders.filter((o) => o.storeId === store.id);
  const unread = app.notifications.filter((n) => n.audience === "store" && !n.read).length;

  const incoming = storeOrders.filter((o) => ["store_received"].includes(o.status));
  const preparing = storeOrders.filter((o) => ["store_accepted", "store_preparing"].includes(o.status));
  const awaiting = storeOrders.filter((o) => o.status === "driver_broadcast");
  const done = storeOrders.filter((o) => ["collection_verified", "driver_en_route", "driver_arrived_customer", "delivery_completed", "rating_submitted"].includes(o.status));

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-4">
      <div className="rounded-3xl bg-gradient-to-br from-[#0F172A] to-[#1e293b] p-5 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-2xl">{store.logo}</div>
            <div>
              <div className="flex items-center gap-2"><h1 className="text-xl font-black">{store.name}</h1>{store.verified && <span className="flex items-center gap-0.5 rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300"><ShieldCheck className="h-3 w-3" />Verified</span>}</div>
              <p className="text-xs text-amber-200">{store.suburb} · {store.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={store.id} onChange={(e) => app.setActiveStoreId(e.target.value)} className="rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/15">
              {app.stores.map((s) => <option key={s.id} value={s.id} className="text-slate-800">{s.name}</option>)}
            </select>
            <button onClick={() => app.toggleStoreOpen(store.id)} className={`rounded-xl px-3 py-2 text-sm font-bold ${store.open ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>{store.open ? "Open" : "Closed"}</button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-300">Kitchen load</span>
          {BUSY_LEVELS.map((b) => <button key={b} onClick={() => app.toggleStoreBusy(store.id, b)} className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${store.busy === b ? "bg-[#D97706] text-white" : "bg-white/10 text-slate-200"}`}>{b}</button>)}
          <span className="ml-auto flex items-center gap-1 text-xs text-slate-300"><Bell className="h-4 w-4 text-amber-300" />{unread} new</span>
        </div>
      </div>

      <div className="mt-4 flex gap-1.5 overflow-x-auto rounded-2xl bg-white p-1.5 ring-1 ring-slate-900/10">
        {([["orders", "Order terminal", Receipt], ["menu", "Menu", ChefHat], ["insights", "Insights", BarChart3], ["settings", "Settings", Settings]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)} className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold transition ${tab === id ? "bg-[#0F172A] text-white" : "text-slate-600 hover:bg-slate-50"}`}>
            <Icon className="h-4 w-4" />{label}{id === "orders" && incoming.length > 0 && <span className="grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-[10px]">{incoming.length}</span>}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "orders" && <Orders incoming={incoming} preparing={preparing} awaiting={awaiting} done={done} />}
        {tab === "menu" && <Menu storeId={store.id} />}
        {tab === "insights" && <Insights store={store} orders={storeOrders} />}
        {tab === "settings" && <SettingsTab store={store} />}
      </div>
    </div>
  );
}

function Orders({ incoming, preparing, awaiting, done }: { incoming: any[]; preparing: any[]; awaiting: any[]; done: any[] }) {
  const app = useApp();
  const [prep, setPrep] = useState<Record<string, number>>({});
  return (
    <div className="space-y-5">
      {incoming.length === 0 && preparing.length === 0 && awaiting.length === 0 && (
        <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-slate-900/10"><p className="text-4xl">🔔</p><p className="mt-2 font-bold text-slate-700">No orders right now</p><p className="text-sm text-slate-500">New orders appear here in real time.</p></div>
      )}
      {incoming.length > 0 && (
        <Section title="New orders" tone="text-rose-600">
          {incoming.map((o) => (
            <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white p-4 ring-1 ring-rose-200">
              <div className="flex items-center justify-between"><p className="font-black text-slate-800">{o.ref} · {o.customerName}</p><StatusBadge status={o.status} /></div>
              <ItemList items={o.items} />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">Prep</span>
                <select value={prep[o.id] ?? o.prepMins ?? 15} onChange={(e) => setPrep((p) => ({ ...p, [o.id]: +e.target.value }))} className="rounded-lg bg-slate-50 px-2 py-1 text-sm ring-1 ring-slate-200">{[10, 15, 20, 25, 30].map((m) => <option key={m} value={m}>{m} min</option>)}</select>
                <button onClick={() => app.storeAccept(o.id, prep[o.id] ?? 15)} className="flex items-center gap-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white"><Check className="h-4 w-4" />Accept</button>
                <button onClick={() => app.storeReject(o.id)} className="flex items-center gap-1 rounded-xl bg-white px-4 py-2 text-sm font-bold text-rose-600 ring-1 ring-rose-200"><X className="h-4 w-4" />Decline</button>
              </div>
            </motion.div>
          ))}
        </Section>
      )}
      {preparing.length > 0 && (
        <Section title="In the kitchen" tone="text-amber-600">
          {preparing.map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-2xl bg-white p-4 ring-1 ring-slate-900/10">
              <div><p className="font-bold text-slate-800">{o.ref} · {o.customerName}</p><p className="text-xs text-slate-500">Collection PIN <span className="font-mono font-bold">{o.collectionPin}</span></p></div>
              <button onClick={() => app.storeReady(o.id)} className="flex items-center gap-1 rounded-xl bg-[#D97706] px-4 py-2 text-sm font-bold text-white"><Bike className="h-4 w-4" />Ready for pickup</button>
            </div>
          ))}
        </Section>
      )}
      {awaiting.length > 0 && (
        <Section title="Awaiting driver" tone="text-sky-600">
          {awaiting.map((o) => <div key={o.id} className="flex items-center justify-between rounded-2xl bg-white p-3 ring-1 ring-slate-900/10 text-sm"><span className="font-bold text-slate-700">{o.ref}</span><StatusBadge status={o.status} /></div>)}
        </Section>
      )}
      {done.length > 0 && (
        <Section title="Completed" tone="text-emerald-600">
          {done.slice(0, 6).map((o) => <div key={o.id} className="flex items-center justify-between rounded-2xl bg-white p-3 ring-1 ring-slate-900/10 text-sm"><span className="font-semibold text-slate-600">{o.ref} · {formatZAR(o.total)}</span><StatusBadge status={o.status} /></div>)}
        </Section>
      )}
    </div>
  );
}

function Section({ title, tone, children }: { title: string; tone: string; children: React.ReactNode }) {
  return <div><p className={`mb-2 text-xs font-black uppercase tracking-wide ${tone}`}>{title}</p><div className="space-y-2">{children}</div></div>;
}
function ItemList({ items }: { items: { name: string; qty: number; optionName?: string; special?: string }[] }) {
  return (
    <div className="mt-2 space-y-1 rounded-xl bg-slate-50 p-3 text-sm">
      {items.map((it, i) => (
        <div key={i} className="flex justify-between"><span className="text-slate-700">{it.qty}× {it.name}{it.optionName ? ` · ${it.optionName}` : ""}</span></div>
      ))}
      {items.some((i) => i.special) && <p className="mt-1 rounded-lg bg-amber-50 px-2 py-1 text-xs italic text-amber-800">⚠ {items.filter((i) => i.special).map((i) => i.special).join(" · ")}</p>}
    </div>
  );
}

function Menu({ storeId }: { storeId: string }) {
  const app = useApp();
  const [editing, setEditing] = useState<Product | null>(null);
  const [adding, setAdding] = useState(false);
  const items = app.products.filter((p) => p.storeId === storeId);
  const blank: Product = { id: "p-" + Date.now(), storeId, name: "", description: "", price: 60, image: "https://placehold.co/160x160/F97316/white?text=New", category: "Fast food" };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-black text-slate-800">{items.length} items on menu</p>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 rounded-xl bg-[#D97706] px-3 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" />Add item</button>
      </div>
      {items.map((p) => (
        <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-900/10">
          <img src={p.image} className="h-12 w-12 rounded-lg object-cover" alt={p.name} />
          <div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-800">{p.name}</p><p className="text-sm font-semibold text-[#D97706]">{formatZAR(p.promoPrice ?? p.price)}</p></div>
          <button onClick={() => app.toggleSoldOut(p.id)} className={`rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ${p.soldOut ? "bg-rose-50 text-rose-600 ring-rose-200" : "bg-emerald-50 text-emerald-600 ring-emerald-200"}`}>{p.soldOut ? "Sold out" : "Available"}</button>
          <button onClick={() => setEditing(p)} className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100"><Tag className="h-4 w-4" /></button>
          <button onClick={() => app.deleteProduct(p.id)} className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      {(editing || adding) && <ProductForm initial={editing || blank} onClose={() => { setEditing(null); setAdding(false); }} onSave={(p) => { app.upsertProduct(p); setEditing(null); setAdding(false); }} />}
    </div>
  );
}

function ProductForm({ initial, onClose, onSave }: { initial: Product; onClose: () => void; onSave: (p: Product) => void }) {
  const [p, setP] = useState<Product>(initial);
  const set = (patch: Partial<Product>) => setP((prev) => ({ ...prev, ...patch }));
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-end bg-black/40 sm:place-items-center" onClick={onClose}>
      <motion.div initial={{ y: 40 }} animate={{ y: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-white p-5 sm:rounded-3xl">
        <div className="flex items-center justify-between"><h3 className="text-lg font-black text-slate-800">{initial.name ? "Edit item" : "New item"}</h3><button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button></div>
        <div className="mt-3 space-y-3">
          <Field label="Name"><input value={p.name} onChange={(e) => set({ name: e.target.value })} className="inp" placeholder="Signature beef burger" /></Field>
          <Field label="Description"><input value={p.description} onChange={(e) => set({ description: e.target.value })} className="inp" placeholder="Toasted bun, chips & sauce" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (R)"><input type="number" value={p.price} onChange={(e) => set({ price: +e.target.value })} className="inp" /></Field>
            <Field label="Promo (R)"><input type="number" value={p.promoPrice ?? ""} onChange={(e) => set({ promoPrice: e.target.value ? +e.target.value : undefined })} className="inp" placeholder="—" /></Field>
          </div>
          <Field label="Image URL"><input value={p.image} onChange={(e) => set({ image: e.target.value })} className="inp" /></Field>
          <button onClick={() => p.name && onSave(p)} className="w-full rounded-2xl bg-[#D97706] py-3 font-bold text-white shadow-lg shadow-amber-500/30">Save to menu</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>{children}</label>;
}

function Insights({ store, orders }: { store: Store; orders: any[] }) {
  const app = useApp();
  const grossToday = orders.filter((o) => !["cancelled"].includes(o.status)).reduce((n, o) => n + o.subtotal, 0);
  const commission = Math.round((grossToday * app.commissionRate) / 100);
  const topMap: Record<string, { qty: number; revenue: number }> = {};
  orders.forEach((o) => o.items.forEach((it: any) => { topMap[it.name] = topMap[it.name] || { qty: 0, revenue: 0 }; topMap[it.name].qty += it.qty; topMap[it.name].revenue += it.unitPrice * it.qty; }));
  const top = Object.entries(topMap).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);
  const max = Math.max(1, ...top.map((t) => t[1].revenue));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<TrendingUp className="h-4 w-4" />} label="Gross today" value={formatZAR(grossToday)} />
        <Stat icon={<Receipt className="h-4 w-4" />} label="Orders" value={String(orders.length)} />
        <Stat icon={<Percent className="h-4 w-4" />} label="Commission" value={`-${formatZAR(commission)}`} tone="text-rose-600" />
        <Stat icon={<Check className="h-4 w-4" />} label="Net payout" value={formatZAR(grossToday - commission)} tone="text-emerald-700" />
      </div>
      <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-900/10">
        <p className="flex items-center gap-2 font-black text-slate-800"><BarChart3 className="h-4 w-4 text-[#D97706]" />Top sellers</p>
        <div className="mt-3 space-y-2">
          {top.map(([name, v]) => (
            <div key={name}>
              <div className="flex justify-between text-sm"><span className="font-semibold text-slate-700">{name}</span><span className="text-slate-500">{v.qty} sold · {formatZAR(v.revenue)}</span></div>
              <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-[#D97706]" style={{ width: `${(v.revenue / max) * 100}%` }} /></div>
            </div>
          ))}
          {top.length === 0 && <p className="text-sm text-slate-500">No sales yet.</p>}
        </div>
      </div>
      <p className="text-center text-xs text-slate-400">Payouts settle weekly to {store.phone ? "linked bank" : "your bank"} · all figures in ZAR</p>
    </div>
  );
}
function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: string }) {
  return <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-900/10"><span className="text-[#D97706]">{icon}</span><p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{label}</p><p className={`text-lg font-black ${tone || "text-slate-800"}`}>{value}</p></div>;
}

function SettingsTab({ store }: { store: Store }) {
  const app = useApp();
  const [d, setD] = useState({ name: store.name, tagline: store.tagline, prepMins: store.prepMins, deliveryFee: store.deliveryFee, openingHours: store.openingHours });
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-900/10">
        <p className="font-black text-slate-800">Store profile</p>
        <div className="mt-3 space-y-3">
          <Field label="Name"><input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} className="inp" /></Field>
          <Field label="Tagline"><input value={d.tagline} onChange={(e) => setD({ ...d, tagline: e.target.value })} className="inp" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prep (min)"><input type="number" value={d.prepMins} onChange={(e) => setD({ ...d, prepMins: +e.target.value })} className="inp" /></Field>
            <Field label="Delivery fee (R)"><input type="number" value={d.deliveryFee} onChange={(e) => setD({ ...d, deliveryFee: +e.target.value })} className="inp" /></Field>
          </div>
          <Field label="Opening hours"><input value={d.openingHours} onChange={(e) => setD({ ...d, openingHours: e.target.value })} className="inp" /></Field>
          <button onClick={() => app.updateStore(store.id, d)} className="w-full rounded-2xl bg-[#0F172A] py-3 font-bold text-white">Save changes</button>
        </div>
      </div>
      <div className="rounded-3xl bg-white p-4 text-sm ring-1 ring-slate-900/10">
        <p className="font-black text-slate-800">Compliance</p>
        <div className="mt-2 space-y-1.5 text-slate-600"><Row label="Registration" value={store.registration} /><Row label="Category" value={store.category} /><Row label="Status" value={store.verified ? "Verified" : "Pending admin review"} tone={store.verified ? "text-emerald-600" : "text-amber-600"} /></div>
      </div>
    </div>
  );
}
function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return <div className="flex justify-between"><span>{label}</span><span className={`font-semibold ${tone || "text-slate-800"}`}>{value}</span></div>;
}