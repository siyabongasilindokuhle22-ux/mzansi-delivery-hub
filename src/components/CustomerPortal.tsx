import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, ShoppingCart, Star, Clock, Bell, Plus, X,
  ChevronRight, Store as StoreIcon, Tag, Navigation, Flame, ShieldCheck, Percent,
} from "lucide-react";
import { useApp, formatZAR, BusyPill } from "../context/AppContext";
import { CATEGORIES, type Category, type Product, type Store } from "../types";
import { CartView, CheckoutView, TrackView, OrdersView, NotificationsView, ProfileView } from "./CustomerFlow";

type View = "home" | "store" | "cart" | "checkout" | "track" | "orders" | "profile" | "notif";

export default function CustomerPortal() {
  const app = useApp();
  const [view, setView] = useState<View>("home");
  const [openStoreId, setOpenStoreId] = useState<string | null>(null);
  const [trackId, setTrackId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "All">("All");
  const [maxFee, setMaxFee] = useState(60);

  const myOrders = useMemo(() => app.orders.filter((o) => o.customerId === app.customer.id), [app.orders, app.customer.id]);
  const activeOrders = myOrders.filter((o) => !["rating_submitted", "cancelled"].includes(o.status));
  const openStore = app.stores.find((s) => s.id === openStoreId) || null;
  const trackOrder = app.orders.find((o) => o.id === trackId) || null;

  const filtered = app.stores.filter((s) => {
    if (s.city !== app.activeAddress.city) return false;
    if (cat !== "All" && s.category !== cat) return false;
    if (s.deliveryFee > maxFee) return false;
    if (q && !`${s.name} ${s.tagline} ${s.suburb}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const goTrack = (id: string) => { setTrackId(id); setView("track"); };

  return (
    <div className="relative mx-auto max-w-5xl px-4 pb-28 pt-4">
      <AnimatePresence mode="wait">
        <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          {view === "home" && <Home q={q} setQ={setQ} cat={cat} setCat={setCat} maxFee={maxFee} setMaxFee={setMaxFee} stores={filtered} onOpen={(id) => { setOpenStoreId(id); setView("store"); }} />}
          {view === "store" && openStore && <StoreMenu store={openStore} onBack={() => setView("home")} />}
          {view === "cart" && <CartView onCheckout={() => setView("checkout")} onBack={() => setView("home")} />}
          {view === "checkout" && <CheckoutView onDone={(id) => goTrack(id)} onBack={() => setView("cart")} />}
          {view === "track" && trackOrder && <TrackView order={trackOrder} onBack={() => setView("orders")} />}
          {view === "orders" && <OrdersView orders={myOrders} onTrack={goTrack} />}
          {view === "profile" && <ProfileView onBack={() => setView("home")} />}
          {view === "notif" && <NotificationsView onBack={() => setView("home")} />}
        </motion.div>
      </AnimatePresence>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-900/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-around px-2 py-2 text-xs font-semibold">
          <NavBtn active={view === "home"} onClick={() => setView("home")} icon={<StoreIcon className="h-5 w-5" />} label="Discover" />
          <NavBtn active={view === "orders"} onClick={() => setView("orders")} icon={<Navigation className="h-5 w-5" />} label="My Orders" badge={activeOrders.length} />
          <NavBtn active={view === "profile"} onClick={() => setView("profile")} icon={<ShieldCheck className="h-5 w-5" />} label="Profile" />
          <button onClick={() => setView("cart")} className="relative flex flex-col items-center gap-0.5 rounded-xl bg-[#D97706] px-5 py-2 text-white shadow-lg shadow-amber-500/30 transition active:scale-95">
            <ShoppingCart className="h-5 w-5" /><span>Basket</span>
            {app.cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#0F172A] text-[10px]">{app.cartCount}</span>}
          </button>
          <NavBtn active={view === "notif"} onClick={() => setView("notif")} icon={<Bell className="h-5 w-5" />} label="Alerts" badge={app.notifications.filter((n) => n.audience === "customer" && !n.read).length} />
        </div>
      </div>
    </div>
  );
}

function NavBtn({ active, onClick, icon, label, badge }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <button onClick={onClick} className={`relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition ${active ? "text-[#D97706]" : "text-slate-500"}`}>
      {icon}<span>{label}</span>
      {!!badge && <span className="absolute right-1 top-0 grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-[9px] text-white">{badge}</span>}
    </button>
  );
}

function Home({ q, setQ, cat, setCat, maxFee, setMaxFee, stores, onOpen }: {
  q: string; setQ: (v: string) => void; cat: Category | "All"; setCat: (c: Category | "All") => void;
  maxFee: number; setMaxFee: (n: number) => void; stores: Store[]; onOpen: (id: string) => void;
}) {
  const app = useApp();
  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-[#0F172A] to-[#1e293b] p-5 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div><p className="text-xs uppercase tracking-wider text-amber-300">LekkerDeliver · Mzansi</p><h1 className="mt-1 text-2xl font-black">What&apos;s lekker today?</h1></div>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-2xl">🇿🇦</span>
        </div>
        <button onClick={() => app.setRole("customer")} className="mt-4 flex w-full items-center gap-2 rounded-2xl bg-white/10 px-3 py-2.5 text-left text-sm ring-1 ring-white/15">
          <MapPin className="h-4 w-4 text-amber-300" /><span className="flex-1 truncate">{app.activeAddress.line1}, {app.activeAddress.suburb}</span><ChevronRight className="h-4 w-4" />
        </button>
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white p-1 text-slate-500">
          <Search className="ml-2 h-4 w-4" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search stores, bunny chow, snoek…" className="w-full bg-transparent py-2 text-sm text-slate-800 outline-none" />
        </div>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {(["All", ...CATEGORIES] as const).map((c) => (
          <button key={c} onClick={() => setCat(c as Category | "All")} className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${cat === c ? "bg-[#D97706] text-white shadow" : "bg-white text-slate-600 ring-1 ring-slate-900/10"}`}>{c}</button>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-white p-3 text-sm ring-1 ring-slate-900/10">
        <Tag className="h-4 w-4 text-[#D97706]" /><span className="text-slate-600">Max delivery fee</span>
        <input type="range" min={20} max={60} value={maxFee} onChange={(e) => setMaxFee(+e.target.value)} className="accent-[#D97706]" />
        <span className="font-bold text-slate-800">{formatZAR(maxFee)}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {stores.map((s) => <StoreCard key={s.id} store={s} onOpen={() => onOpen(s.id)} />)}
        {stores.length === 0 && (
          <div className="col-span-full rounded-2xl bg-white p-8 text-center ring-1 ring-slate-900/10">
            <p className="text-3xl">🔍</p><p className="mt-2 font-semibold text-slate-700">No stores match your filters</p><p className="text-sm text-slate-500">Try widening your delivery-fee range or category.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StoreCard({ store, onOpen }: { store: Store; onOpen: () => void }) {
  return (
    <motion.button whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} onClick={onOpen} className="group overflow-hidden rounded-3xl bg-white text-left shadow-sm ring-1 ring-slate-900/10">
      <div className="relative h-32 w-full overflow-hidden">
        <img src={store.cover} alt={store.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        <div className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-xl shadow ring-1 ring-black/5">{store.logo}</div>
        {store.badges.includes("20% OFF") && <span className="absolute right-3 top-3 rounded-full bg-rose-600 px-2 py-1 text-[10px] font-black text-white">20% OFF</span>}
        <div className="absolute bottom-2 left-3"><BusyPill level={store.busy} /></div>
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold leading-tight text-slate-800">{store.name}</h3>
          <span className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-700"><Star className="h-3 w-3 fill-emerald-500 text-emerald-500" />{store.rating}</span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{store.tagline}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {store.badges.filter((b) => b !== "20% OFF").map((b) => <span key={b} className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">{b}</span>)}
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{store.prepMins}m</span>
          <span className="flex items-center gap-1"><Navigation className="h-3.5 w-3.5" />{formatZAR(store.deliveryFee)}</span>
          <span className="ml-auto font-semibold text-[#D97706]">{store.open ? "Open now" : "Closed"}</span>
        </div>
      </div>
    </motion.button>
  );
}

function StoreMenu({ store, onBack }: { store: Store; onBack: () => void }) {
  const app = useApp();
  const items = app.products.filter((p) => p.storeId === store.id);
  const [custom, setCustom] = useState<Product | null>(null);
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-slate-600"><X className="h-4 w-4" /> Back to discover</button>
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-900/10">
        <div className="relative h-40"><img src={store.cover} className="h-full w-full object-cover" alt={store.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-4 text-white">
            <div className="flex items-center gap-2"><span className="text-2xl">{store.logo}</span><h2 className="text-xl font-black">{store.name}</h2></div>
            <p className="text-sm opacity-90">{store.tagline} · {store.suburb}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 p-3 text-xs text-slate-600">
          <span className="flex items-center gap-1 font-bold text-emerald-700"><Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />{store.rating} ({store.ratingCount})</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{store.prepMins}m prep</span>
          <span className="flex items-center gap-1"><Navigation className="h-3.5 w-3.5" />{formatZAR(store.deliveryFee)} delivery</span>
          <BusyPill level={store.busy} />
        </div>
      </div>
      <div className="grid gap-3">{items.map((p) => <ProductRow key={p.id} p={p} onPick={() => (p.options?.length ? setCustom(p) : app.addToCart(p))} />)}</div>
      <AnimatePresence>{custom && <CustomiseModal p={custom} onClose={() => setCustom(null)} />}</AnimatePresence>
    </div>
  );
}

function ProductRow({ p, onPick }: { p: Product; onPick: () => void }) {
  const price = p.promoPrice ?? p.price;
  return (
    <div className={`flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-900/10 ${p.soldOut ? "opacity-60" : ""}`}>
      <img src={p.image} alt={p.name} className="h-16 w-16 shrink-0 rounded-xl object-cover" loading="lazy" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2"><h4 className="truncate font-bold text-slate-800">{p.name}</h4>{p.badge && <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">{p.badge}</span>}{!!p.spicy && <Flame className="h-3.5 w-3.5 text-rose-500" />}</div>
        <p className="line-clamp-1 text-xs text-slate-500">{p.description}</p>
        <div className="mt-1 flex items-center gap-2 text-sm"><span className="font-black text-slate-800">{formatZAR(price)}</span>{p.promoPrice && <span className="text-xs text-slate-400 line-through">{formatZAR(p.price)}</span>}</div>
      </div>
      <button disabled={p.soldOut} onClick={onPick} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#D97706] text-white shadow transition active:scale-90 disabled:bg-slate-300">{p.soldOut ? "✕" : <Plus className="h-5 w-5" />}</button>
    </div>
  );
}

function CustomiseModal({ p, onClose }: { p: Product; onClose: () => void }) {
  const app = useApp();
  const [opt, setOpt] = useState(p.options?.[0]);
  const [special, setSpecial] = useState("");
  const price = (p.promoPrice ?? p.price) + (opt?.priceDelta || 0);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-end bg-black/40 sm:place-items-center" onClick={onClose}>
      <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-white p-5 sm:rounded-3xl">
        <div className="flex items-center justify-between"><h3 className="text-lg font-black text-slate-800">{p.name}</h3><button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button></div>
        <p className="text-sm text-slate-500">{p.description}</p>
        {p.options && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Choose size</p>
            {p.options.map((o) => <button key={o.id} onClick={() => setOpt(o)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm ring-1 transition ${opt?.id === o.id ? "bg-amber-50 ring-[#D97706] font-bold" : "ring-slate-200"}`}><span>{o.name}</span><span>{o.priceDelta ? `+${formatZAR(o.priceDelta)}` : "Included"}</span></button>)}
          </div>
        )}
        <textarea value={special} onChange={(e) => setSpecial(e.target.value)} placeholder="Special instructions (e.g. extra chakalaka, no ice)" className="mt-4 h-20 w-full resize-none rounded-xl bg-slate-50 p-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-[#D97706]" />
        <button onClick={() => { app.addToCart(p, opt?.name, opt?.priceDelta, special); onClose(); }} className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#D97706] px-4 py-3 font-bold text-white shadow-lg shadow-amber-500/30 active:scale-[0.98]"><span className="flex items-center gap-2"><Plus className="h-5 w-5" /> Add to basket</span><span>{formatZAR(price)}</span></button>
      </motion.div>
    </motion.div>
  );
}
