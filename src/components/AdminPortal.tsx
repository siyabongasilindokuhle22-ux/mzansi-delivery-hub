import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, Users, Building2, Percent, TrendingUp, Activity, RefreshCw,
  Check, X, ClipboardCheck, Bike, Wallet, LogOut,
} from "lucide-react";
import { useApp, formatZAR, StatusBadge } from "../context/AppContext";

type AdminTab = "overview" | "drivers" | "stores" | "settings";

export default function AdminPortal() {
  const app = useApp();
  const [tab, setTab] = useState<AdminTab>("overview");

  const stats = useMemo(() => {
    const live = app.orders.filter((o) => o.status !== "cancelled");
    const gmv = live.reduce((n, o) => n + o.total, 0);
    const commission = Math.round(live.reduce((n, o) => n + o.subtotal, 0) * (app.commissionRate / 100));
    const completedToday = live.filter((o) => ["delivery_completed", "rating_submitted"].includes(o.status)).length;
    const onlineDrivers = app.drivers.filter((d) => d.status !== "offline").length;
    const pendingApps = app.applications.filter((a) => !["Approved", "Rejected"].includes(a.status)).length;
    return { gmv, commission, activeStores: app.stores.length, onlineDrivers, completedToday, pendingApps };
  }, [app.orders, app.stores, app.drivers, app.applications, app.commissionRate]);

  const tabs: [AdminTab, string, any][] = [["overview", "Overview", Activity], ["drivers", "Drivers", Users], ["stores", "Stores", Building2], ["settings", "Platform", Percent]];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-4">
      <div className="rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1e293b] to-[#334155] p-5 text-white shadow-xl">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-amber-300" />
          <h1 className="text-xl font-black">Platform Control</h1>
          <span className="ml-auto rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-amber-200">Commission {app.commissionRate}%</span>
          <button onClick={() => app.setRole("customer")} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white transition hover:bg-white/20">
            <LogOut className="h-3.5 w-3.5" />Exit Admin
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Kpi label="Gross volume" value={formatZAR(stats.gmv)} icon={<TrendingUp className="h-4 w-4" />} />
          <Kpi label="Commission" value={formatZAR(stats.commission)} icon={<Wallet className="h-4 w-4" />} tone="text-amber-300" />
          <Kpi label="Active stores" value={String(stats.activeStores)} icon={<Building2 className="h-4 w-4" />} />
          <Kpi label="Drivers online" value={String(stats.onlineDrivers)} icon={<Bike className="h-4 w-4" />} tone="text-emerald-300" />
          <Kpi label="Delivered today" value={String(stats.completedToday)} icon={<Check className="h-4 w-4" />} />
          <Kpi label="Pending apps" value={String(stats.pendingApps)} icon={<ClipboardCheck className="h-4 w-4" />} tone={stats.pendingApps ? "text-rose-300" : ""} />
        </div>
      </div>

      <div className="mt-4 flex gap-1.5 overflow-x-auto rounded-2xl bg-white p-1.5 ring-1 ring-slate-900/10">
        {tabs.map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)} className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold transition ${tab === id ? "bg-[#0F172A] text-white" : "text-slate-600 hover:bg-slate-50"}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "overview" && <Overview />}
        {tab === "drivers" && <Drivers />}
        {tab === "stores" && <Stores />}
        {tab === "settings" && <Settings />}
      </div>
    </div>
  );
}

function Kpi({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
      <span className="text-amber-200">{icon}</span>
      <p className={`mt-1 text-xl font-black ${tone || "text-white"}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-slate-300">{label}</p>
    </div>
  );
}

function Overview() {
  const app = useApp();
  const feed = [...app.orders].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 10);
  const maxTotal = Math.max(1, ...feed.map((o) => o.total));
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-900/10">
          <p className="flex items-center gap-2 font-black text-slate-800"><Activity className="h-4 w-4 text-[#D97706]" />Live order feed</p>
          <div className="mt-3 space-y-2">
            {feed.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-2.5 text-sm">
                <div className="min-w-0"><p className="truncate font-bold text-slate-700">{o.ref} · {o.storeName}</p><p className="truncate text-xs text-slate-500">{o.customerName}</p></div>
                <div className="shrink-0 text-right"><StatusBadge status={o.status} /><p className="mt-0.5 text-xs font-bold text-slate-600">{formatZAR(o.total)}</p></div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-900/10">
          <p className="flex items-center gap-2 font-black text-slate-800"><TrendingUp className="h-4 w-4 text-emerald-600" />Order value (last {feed.length})</p>
          <div className="mt-4 flex h-48 items-end gap-1.5">
            {feed.map((o) => (
              <motion.div key={o.id} initial={{ height: 0 }} animate={{ height: `${(o.total / maxTotal) * 100}%` }} transition={{ duration: 0.5 }} className="flex-1 rounded-t-md bg-gradient-to-t from-[#D97706] to-[#E5A823]" title={`${o.ref} · ${formatZAR(o.total)}`} />
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">Bars show each order total in ZAR.</p>
        </div>
      </div>
    </div>
  );
}

function Drivers() {
  const app = useApp();
  const [reason, setReason] = useState<Record<string, string>>({});
  const queue = app.applications.filter((a) => !["Approved", "Rejected"].includes(a.status));
  const decided = app.applications.filter((a) => ["Approved", "Rejected"].includes(a.status));
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-wide text-amber-600">Awaiting review · {queue.length}</p>
        {queue.length === 0 && <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 ring-1 ring-slate-900/10">No applications in the queue.</p>}
        <div className="space-y-3">
          {queue.map((a) => (
            <div key={a.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-900/10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-black text-slate-800">{a.name}</p>
                  <p className="text-xs text-slate-500">{a.phone} · {a.email}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">{a.status}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 sm:grid-cols-3">
                <Row k="ID" v={a.idNumber} /><Row k="Licence" v={a.licenceCode} /><Row k="Vehicle" v={`${a.vehicleMake} ${a.vehicleModel}`} />
                <Row k="Reg" v={a.registration} /><Row k="Disc exp" v={a.licenceDiscExpiry} /><Row k="Bank" v={a.bank} />
                <Row k="City" v={a.city} /><Row k="Proof addr" v={a.proofOfAddress ? "Yes" : "No"} /><Row k="Emergency" v={a.emergencyContact || "—"} />
              </div>
              <input value={reason[a.id] || ""} onChange={(e) => setReason((r) => ({ ...r, [a.id]: e.target.value }))} placeholder="Reason (for reject / office note)" className="inp mt-3" />
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => app.reviewApplication(a.id, "approve")} className="flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-white"><Check className="h-4 w-4" />Approve & onboard</button>
                <button onClick={() => app.reviewApplication(a.id, "office", reason[a.id] || "Bring documents to office")} className="flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold text-white"><ClipboardCheck className="h-4 w-4" />Office verification</button>
                <button onClick={() => app.reviewApplication(a.id, "reject", reason[a.id] || "Documents incomplete")} className="flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm font-bold text-rose-600 ring-1 ring-rose-200"><X className="h-4 w-4" />Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {decided.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">Decided</p>
          <div className="space-y-2">
            {decided.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl bg-white p-3 text-sm ring-1 ring-slate-900/10">
                <span className="font-semibold text-slate-700">{a.name} · {a.vehicleMake} {a.vehicleModel}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${a.status === "Approved" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div><span className="text-slate-400">{k}: </span><span className="font-semibold">{v}</span></div>;
}

function Stores() {
  const app = useApp();
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: "", tagline: "", suburb: "", phone: "", category: "Local businesses", deliveryFee: 30, prepMins: 20 });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-black text-slate-800">{app.stores.length} stores on platform</p>
        <button onClick={() => setAdding((v) => !v)} className="flex items-center gap-1 rounded-xl bg-[#0F172A] px-3 py-2 text-sm font-bold text-white"><Building2 className="h-4 w-4" />{adding ? "Close" : "Register store"}</button>
      </div>
      {adding && (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-900/10">
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="lbl">Store name</span><input className="inp" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label className="block"><span className="lbl">Suburb</span><input className="inp" value={f.suburb} onChange={(e) => setF({ ...f, suburb: e.target.value })} /></label>
            <label className="block"><span className="lbl">Phone</span><input className="inp" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
            <label className="block"><span className="lbl">Category</span><select className="inp" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{["Fast food", "Burgers", "Chicken", "Pizza", "Groceries", "Drinks", "Desserts", "Local restaurants", "Local businesses"].map((c) => <option key={c}>{c}</option>)}</select></label>
          </div>
          <button disabled={!f.name} onClick={() => { app.createStore(f as any); setAdding(false); setF({ name: "", tagline: "", suburb: "", phone: "", category: "Local businesses", deliveryFee: 30, prepMins: 20 }); }} className="mt-3 w-full rounded-2xl bg-emerald-500 py-2.5 font-bold text-white disabled:opacity-50">Create store account</button>
        </div>
      )}
      <div className="space-y-2">
        {app.stores.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-900/10">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-xl">{s.logo}</div>
            <div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-800">{s.name}</p><p className="truncate text-xs text-slate-500">{s.suburb} · {s.category} · {formatZAR(s.deliveryFee)} delivery</p></div>
            {s.verified ? <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" />Verified</span> : <button onClick={() => app.verifyStore(s.id)} className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">Verify</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Settings() {
  const app = useApp();
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-900/10">
        <p className="flex items-center gap-2 font-black text-slate-800"><Percent className="h-4 w-4 text-[#D97706]" />Store commission rate</p>
        <p className="mt-1 text-sm text-slate-500">Platform fee applied to every store order subtotal.</p>
        <div className="mt-4 flex items-center gap-4">
          <input type="range" min={5} max={25} value={app.commissionRate} onChange={(e) => app.setCommissionRate(+e.target.value)} className="h-2 flex-1 cursor-pointer accent-[#D97706]" />
          <span className="w-16 rounded-xl bg-[#0F172A] py-2 text-center text-lg font-black text-white">{app.commissionRate}%</span>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-900/10">
          <p className="font-black text-slate-800">Real-time simulation</p>
          <p className="mt-1 text-sm text-slate-500">Advance the live driver GPS along the active route.</p>
          <button onClick={() => app.simulateDriverMove()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-2.5 font-bold text-white"><Activity className="h-4 w-4" />Move active driver</button>
        </div>
        <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-900/10">
          <p className="font-black text-slate-800">Demo data</p>
          <p className="mt-1 text-sm text-slate-500">Reset all orders, stores, drivers & carts to seed state.</p>
          <button onClick={() => app.resetAll()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 py-2.5 font-bold text-white"><RefreshCw className="h-4 w-4" />Reset demo</button>
        </div>
      </div>
      <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-900/10">
        <p className="font-black text-slate-800">Fleet & store health</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Mini label="Stores" value={String(app.stores.length)} /><Mini label="Drivers" value={String(app.drivers.length)} />
          <Mini label="Products" value={String(app.products.length)} /><Mini label="Orders" value={String(app.orders.length)} />
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-3 text-center"><p className="text-xl font-black text-slate-800">{value}</p><p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p></div>;
}
