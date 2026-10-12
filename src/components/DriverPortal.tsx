import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bike, MapPin, Navigation, Phone, Check, Star, Wallet, TrendingUp,
  ShieldCheck, Power, Package, CheckCircle, ChevronRight, UserPlus, Percent, Clock,
} from "lucide-react";
import { useApp, formatZAR, StatusBadge, LiveMap, distanceKm } from "../context/AppContext";
import type { DriverApplication, Order } from "../types";

type Tab = "offers" | "jobs" | "earnings" | "onboarding";
const payout = (o: Order) => Math.round(o.deliveryFee + 90);

export default function DriverPortal() {
  const app = useApp();
  const [tab, setTab] = useState<Tab>("offers");
  const driver = app.drivers.find((d) => d.id === app.activeDriverId) || app.drivers[0];
  const offers = app.orders.filter((o) => o.status === "driver_broadcast");
  const jobs = app.orders.filter((o) => o.driverId === driver.id && ["driver_assigned", "driver_at_store", "collection_verified", "driver_en_route", "driver_arrived_customer"].includes(o.status));
  const online = driver.status === "online";

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-4">
      <div className="rounded-3xl bg-gradient-to-br from-[#10B981] to-[#0F172A] p-5 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 text-2xl">🛵</div>
            <div>
              <div className="flex items-center gap-2"><h1 className="text-xl font-black">{driver.name}</h1>{driver.verified && <span className="flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold"><ShieldCheck className="h-3 w-3" />Verified</span>}</div>
              <p className="flex items-center gap-2 text-xs text-emerald-100"><Star className="h-3 w-3 fill-amber-300 text-amber-300" />{driver.rating} · {driver.trips} trips · {driver.vehicleMake} {driver.vehicleModel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={driver.id} onChange={(e) => app.setActiveDriverId(e.target.value)} className="rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/15">
              {app.drivers.map((d) => <option key={d.id} value={d.id} className="text-slate-800">{d.name}</option>)}
            </select>
            <button onClick={() => app.driverToggleOnline(driver.id)} className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold ${online ? "bg-white text-emerald-700" : "bg-white/15 text-white"}`}>
              <Power className="h-4 w-4" />{online ? "Online" : driver.status === "on_delivery" ? "On delivery" : "Go online"}
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Today" value={formatZAR(driver.earningsToday)} />
          <MiniStat label="Tips" value={formatZAR(driver.tipsToday)} />
          <MiniStat label="Acceptance" value={`${driver.acceptanceRate}%`} />
        </div>
      </div>

      <div className="mt-4 flex gap-1.5 overflow-x-auto rounded-2xl bg-white p-1.5 ring-1 ring-slate-900/10">
        {([["offers", "Offers", Bike], ["jobs", "My jobs", Package], ["earnings", "Earnings", Wallet], ["onboarding", "Onboard", UserPlus]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)} className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold transition ${tab === id ? "bg-[#0F172A] text-white" : "text-slate-600 hover:bg-slate-50"}`}>
            <Icon className="h-4 w-4" />{label}{id === "offers" && offers.length > 0 && <span className="grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-[10px]">{offers.length}</span>}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "offers" && <Offers offers={offers} driverId={driver.id} />}
        {tab === "jobs" && <Jobs jobs={jobs} />}
        {tab === "earnings" && <Earnings driver={driver} />}
        {tab === "onboarding" && <Onboarding />}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-white/10 py-2 ring-1 ring-white/15"><p className="text-[10px] uppercase tracking-wide text-emerald-100">{label}</p><p className="text-lg font-black">{value}</p></div>;
}

function Offers({ offers, driverId }: { offers: Order[]; driverId: string }) {
  const app = useApp();
  const driver = app.drivers.find((d) => d.id === driverId)!;
  if (offers.length === 0) return <Empty icon="🛵" title="No offers right now" sub="New delivery requests appear here the moment a store marks an order ready." />;
  return (
    <div className="space-y-3">
      <p className="text-xs font-black uppercase tracking-wide text-emerald-600">{offers.length} nearby requests</p>
      {offers.map((o) => {
        const store = app.stores.find((s) => s.id === o.storeId)!;
        const km = distanceKm(driver.coords, store.coords);
        return (
          <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white p-4 ring-1 ring-slate-900/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-black text-slate-800">{store.name}</p>
                <p className="text-xs text-slate-500">{o.ref} · {o.items.reduce((n, i) => n + i.qty, 0)} items</p>
              </div>
              <div className="text-right"><p className="text-lg font-black text-emerald-600">{formatZAR(payout(o))}</p><p className="text-[10px] uppercase text-slate-400">payout</p></div>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[#D97706]" />{km} km to store</span>
              <span className="flex items-center gap-1"><Navigation className="h-3.5 w-3.5 text-emerald-600" />{km + 3} km trip</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{o.prepMins ?? 15} min prep</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => app.driverAcceptOffer(o.id, driverId)} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white"><Check className="h-4 w-4" />Accept job</button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function Jobs({ jobs }: { jobs: Order[] }) {
  const app = useApp();
  if (jobs.length === 0) return <Empty icon="📦" title="No active jobs" sub="Accept an offer to start a delivery." />;
  return (
    <div className="space-y-4">
      {jobs.map((o) => {
        const store = app.stores.find((s) => s.id === o.storeId)!;
        return <JobCard key={o.id} o={o} storeName={store.name} storeCoords={store.coords} />;
      })}
    </div>
  );
}

function JobCard({ o, storeName, storeCoords }: { o: Order; storeName: string; storeCoords: { lat: number; lng: number } }) {
  const app = useApp();
  const [pin, setPin] = useState("");
  const step = o.status;
  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-900/10">
      <div className="p-4">
        <div className="flex items-center justify-between"><p className="font-black text-slate-800">{o.ref} · {o.customerName}</p><StatusBadge status={o.status} /></div>
        <p className="mt-0.5 text-sm text-slate-500">{storeName} → {o.address.line1}, {o.address.suburb}</p>
        <div className="mt-2 flex gap-3 text-xs font-bold">
          <span className="text-emerald-600">Payout {formatZAR(payout(o))}</span>
          <span className="text-amber-600">Tip {formatZAR(o.tip)}</span>
        </div>
      </div>
      <div className="px-4"><LiveMap store={storeCoords} customer={o.address.coords} driver={o.location} progress={o.routeProgress || 0} height={150} /></div>
      <div className="p-4">
        {step === "driver_assigned" && <ActionBtn onClick={() => app.driverArriveStore(o.id)} icon={<Navigation className="h-4 w-4" />} label="I've arrived at the store" />}
        {step === "driver_at_store" && (
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-700">Enter the store&apos;s collection PIN</p>
            <input value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" placeholder="6-digit PIN" className="inp text-center font-mono tracking-widest" />
            <ActionBtn onClick={() => { if (app.driverVerifyCollection(o.id, pin)) setPin(""); }} icon={<CheckCircle className="h-4 w-4" />} label="Verify collection" />
          </div>
        )}
        {step === "collection_verified" && <ActionBtn onClick={() => app.driverEnRoute(o.id)} icon={<Bike className="h-4 w-4" />} label="Start delivery — en route" />}
        {step === "driver_en_route" && (
          <div className="space-y-2">
            <button onClick={() => app.driverMove(o.id, Math.min(1, (o.routeProgress || 0) + 0.25))} className="w-full rounded-xl bg-slate-100 py-2 text-sm font-bold text-slate-700">Simulate GPS move · {Math.round((o.routeProgress || 0) * 100)}%</button>
            <ActionBtn onClick={() => app.driverArrivedCustomer(o.id)} icon={<MapPin className="h-4 w-4" />} label="I've arrived at customer" />
          </div>
        )}
        {step === "driver_arrived_customer" && (
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-700">Ask customer for their 6-digit drop-off PIN</p>
            <input value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" placeholder="6-digit PIN" className="inp text-center font-mono tracking-widest" />
            <ActionBtn tone="emerald" onClick={() => { if (app.driverComplete(o.id, pin)) setPin(""); }} icon={<Check className="h-4 w-4" />} label="Complete delivery" />
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ onClick, icon, label, tone = "slate" }: { onClick: () => void; icon: React.ReactNode; label: string; tone?: "slate" | "emerald" }) {
  return <button onClick={onClick} className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-bold text-white shadow-lg active:scale-[0.98] ${tone === "emerald" ? "bg-emerald-500 shadow-emerald-500/30" : "bg-[#0F172A] shadow-slate-900/20"}`}>{icon}{label}</button>;
}

function Earnings({ driver }: { driver: any }) {
  const app = useApp();
  const completed = app.orders.filter((o) => o.driverId === driver.id && ["delivery_completed", "rating_submitted"].includes(o.status));
  const week = driver.earningsToday * 5;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <EStat icon={<TrendingUp className="h-4 w-4" />} label="Today" value={formatZAR(driver.earningsToday)} />
        <EStat icon={<Wallet className="h-4 w-4" />} label="Tips today" value={formatZAR(driver.tipsToday)} />
        <EStat icon={<Percent className="h-4 w-4" />} label="This week" value={formatZAR(week)} />
        <EStat icon={<CheckCircle className="h-4 w-4" />} label="Trips" value={String(driver.trips)} />
      </div>
      <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-900/10">
        <p className="font-black text-slate-800">Recent deliveries</p>
        <div className="mt-2 space-y-2">
          {completed.map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
              <div><p className="font-bold text-slate-700">{o.ref} · {o.storeName}</p><p className="text-xs text-slate-500">{new Date(o.updatedAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}</p></div>
              <div className="text-right"><p className="font-black text-emerald-600">{formatZAR(payout(o))}</p>{o.tip > 0 && <p className="text-xs text-amber-600">+{formatZAR(o.tip)} tip</p>}</div>
            </div>
          ))}
          {completed.length === 0 && <p className="text-sm text-slate-500">No completed deliveries yet.</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200"><Wallet className="h-4 w-4" />Payouts go to {driver.bank} every Friday.</div>
    </div>
  );
}
function EStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-900/10"><span className="text-[#10B981]">{icon}</span><p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{label}</p><p className="text-lg font-black text-slate-800">{value}</p></div>;
}

function Onboarding() {
  const app = useApp();
  const [f, setF] = useState<Omit<DriverApplication, "id" | "status" | "submittedAt">>({
    name: "", phone: "", email: "", idNumber: "", licenceCode: "Code EB", vehicleMake: "Honda", vehicleModel: "Dio", registration: "", licenceDiscExpiry: "", bank: "Capitec", proofOfAddress: false, emergencyContact: "", city: "Cape Town",
  });
  const set = (patch: Partial<typeof f>) => setF((p) => ({ ...p, ...patch }));
  const valid = f.name && f.phone && f.email && f.idNumber && f.registration;
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-900/10">
        <p className="flex items-center gap-2 font-black text-slate-800"><UserPlus className="h-4 w-4 text-emerald-600" />Become a LekkerDeliver driver</p>
        <p className="mt-1 text-sm text-slate-500">Submit your documents — our compliance team reviews within 24h, then you go online.</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <F label="Full name"><input className="inp" value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="Sipho Dlamini" /></F>
          <F label="Mobile"><input className="inp" value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="082 …" /></F>
          <F label="Email"><input className="inp" value={f.email} onChange={(e) => set({ email: e.target.value })} placeholder="you@mail.co.za" /></F>
          <F label="SA ID number"><input className="inp" value={f.idNumber} onChange={(e) => set({ idNumber: e.target.value })} placeholder="13 digits" /></F>
          <F label="Licence code">
            <select className="inp" value={f.licenceCode} onChange={(e) => set({ licenceCode: e.target.value })}>{["Code 8", "Code 10", "Code EB", "Code A"].map((c) => <option key={c}>{c}</option>)}</select>
          </F>
          <F label="City"><select className="inp" value={f.city} onChange={(e) => set({ city: e.target.value as any })}>{["Cape Town", "Johannesburg", "Durban"].map((c) => <option key={c}>{c}</option>)}</select></F>
          <F label="Vehicle make"><input className="inp" value={f.vehicleMake} onChange={(e) => set({ vehicleMake: e.target.value })} /></F>
          <F label="Vehicle model"><input className="inp" value={f.vehicleModel} onChange={(e) => set({ vehicleModel: e.target.value })} /></F>
          <F label="Registration"><input className="inp" value={f.registration} onChange={(e) => set({ registration: e.target.value })} placeholder="CA 123-456" /></F>
          <F label="Lic. disc expiry"><input className="inp" value={f.licenceDiscExpiry} onChange={(e) => set({ licenceDiscExpiry: e.target.value })} placeholder="2026-01" /></F>
          <F label="Payout bank"><select className="inp" value={f.bank} onChange={(e) => set({ bank: e.target.value })}>{["Capitec", "FNB", "Standard Bank", "Absa", "Nedbank"].map((b) => <option key={b}>{b}</option>)}</select></F>
          <F label="Emergency contact"><input className="inp" value={f.emergencyContact} onChange={(e) => set({ emergencyContact: e.target.value })} placeholder="Name · phone" /></F>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={f.proofOfAddress} onChange={(e) => set({ proofOfAddress: e.target.checked })} className="h-4 w-4 accent-emerald-600" />I have attached proof of residence</label>
        <button disabled={!valid} onClick={() => app.submitApplication(f)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 font-bold text-white shadow-lg shadow-emerald-500/30 disabled:opacity-50"><Check className="h-5 w-5" />Submit application</button>
      </div>
      <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-900/10">
        <p className="font-black text-slate-800">Your application status</p>
        <div className="mt-2 space-y-2">
          {app.applications.slice(0, 4).map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
              <div><p className="font-bold text-slate-700">{a.name}</p><p className="text-xs text-slate-500">{a.vehicleMake} {a.vehicleModel} · {a.city}</p></div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${a.status === "Approved" ? "bg-emerald-100 text-emerald-700" : a.status === "Rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{a.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</span>{children}</label>;
}
function Empty({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-slate-900/10"><p className="text-4xl">{icon}</p><p className="mt-2 font-bold text-slate-700">{title}</p><p className="text-sm text-slate-500">{sub}</p></div>;
}
