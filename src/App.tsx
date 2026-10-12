import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import {
  ShieldCheck, Store as StoreIcon, Bike, Bell, Lock,
} from "lucide-react";
import { AppProvider, useApp } from "./context/AppContext";
import CustomerPortal from "./components/CustomerPortal";
import StorePortal from "./components/StorePortal";
import DriverPortal from "./components/DriverPortal";
import AdminPortal from "./components/AdminPortal";
import type { PortalRole } from "./types";

const PUBLIC_ROLES: { id: PortalRole; label: string; icon: any; tone: string }[] = [
  { id: "customer", label: "Customer", icon: Bell, tone: "text-[#D97706]" },
  { id: "store", label: "Store", icon: StoreIcon, tone: "text-orange-600" },
  { id: "driver", label: "Driver", icon: Bike, tone: "text-emerald-600" },
];

export default function App() {
  return (
    <AppProvider>
      <Shell />
      <Toaster position="top-center" richColors toastOptions={{ style: { fontWeight: 600 } }} />
    </AppProvider>
  );
}

function Shell() {
  const app = useApp();
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("role") === "admin") {
      app.setRole("admin");
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-900/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#E5A823] to-[#D97706] text-lg shadow-md shadow-amber-500/30">🛵</div>
            <div className="leading-none">
              <p className="text-lg font-black tracking-tight">Lekker<span className="text-[#D97706]">Deliver</span></p>
              <p className="text-[10px] font-medium text-slate-400">Mzansi community delivery</p>
            </div>
          </div>
          <NotifBell />
        </div>
        {app.role !== "admin" && (
          <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 pb-2">
            {PUBLIC_ROLES.map((r) => {
              const Icon = r.icon;
              const active = app.role === r.id;
              return (
                <button key={r.id} onClick={() => app.setRole(r.id)} className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold transition ${active ? "bg-[#0F172A] text-white shadow" : "text-slate-500 hover:bg-slate-100"}`}>
                  <Icon className={`h-4 w-4 ${active ? "" : r.tone}`} />{r.label}
                </button>
              );
            })}
          </nav>
        )}
      </header>
      <AnimatePresence mode="wait">
        <motion.main key={app.role} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {app.role === "customer" && <CustomerPortal />}
          {app.role === "store" && <StorePortal />}
          {app.role === "driver" && <DriverPortal />}
          {app.role === "admin" && <AdminPortal />}
        </motion.main>
      </AnimatePresence>
      <footer className="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-slate-400">
        <p>LekkerDeliver · all prices in South African Rand (ZAR) · PayFast secured · demo state persists locally</p>
        {app.role !== "admin" && (
          <button onClick={() => setAdminDialogOpen(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-200 hover:text-slate-700">
            <Lock className="h-3.5 w-3.5" />Staff Portal
          </button>
        )}
      </footer>

      <AnimatePresence>
        {adminDialogOpen && <AdminAccessDialog onClose={() => setAdminDialogOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

function AdminAccessDialog({ onClose }: { onClose: () => void }) {
  const app = useApp();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleAccess = () => {
    if (pin === "2024") {
      app.setRole("admin");
      onClose();
      setPin("");
      setError("");
    } else {
      setError("Incorrect passcode. Try again.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0F172A]">
            <ShieldCheck className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <p className="font-black text-slate-800">Admin Access</p>
            <p className="text-xs text-slate-500">Enter staff passcode to continue</p>
          </div>
        </div>
        <input
          type="password"
          value={pin}
          onChange={(e) => { setPin(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleAccess(); }}
          placeholder="Passcode"
          className="inp mt-4 w-full text-center text-lg font-black tracking-widest"
          autoFocus
        />
        {error && <p className="mt-2 text-center text-xs font-bold text-rose-500">{error}</p>}
        <button onClick={handleAccess} disabled={!pin} className="mt-4 w-full rounded-2xl bg-[#0F172A] py-2.5 font-bold text-white transition hover:bg-[#1e293b] disabled:opacity-40">
          Access Portal
        </button>
        <button onClick={onClose} className="mt-2 w-full rounded-2xl bg-slate-100 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-200">Cancel</button>
        <p className="mt-3 text-center text-[10px] text-slate-400">Demo passcode: 2024</p>
      </motion.div>
    </motion.div>
  );
}

function NotifBell() {
  const app = useApp();
  const [open, setOpen] = useState(false);
  const list = app.notifications.filter((n) => n.audience === app.role);
  const unread = list.filter((n) => !n.read).length;
  return (
    <div className="relative">
      <button onClick={() => { setOpen((o) => !o); if (!open) app.markNotificationsRead(app.role); }} className="relative grid h-9 w-9 place-items-center rounded-xl bg-slate-100">
        <Bell className="h-4 w-4 text-slate-600" />
        {unread > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-11 z-50 w-72 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-900/10">
            <p className="px-2 py-1 text-xs font-black uppercase tracking-wide text-slate-400">Notifications</p>
            <div className="max-h-72 overflow-y-auto">
              {list.length === 0 && <p className="px-2 py-4 text-center text-sm text-slate-400">Nothing here yet.</p>}
              {list.map((n) => (
                <div key={n.id} className="rounded-xl px-2 py-2 hover:bg-slate-50">
                  <p className="text-sm font-bold text-slate-700">{n.title}</p>
                  <p className="text-xs text-slate-500">{n.body}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
