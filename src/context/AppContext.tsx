import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type {
  Address,
  CartLine,
  CustomerUser,
  DriverApplication,
  DriverProfile,
  Notification,
  Order,
  OrderStatus,
  PortalRole,
  Product,
  Store,
  LatLng,
} from "../types";
import { STAGE_LABEL, ORDER_STAGES } from "../types";
import {
  SEED_STORES,
  SEED_PRODUCTS,
  SEED_ORDERS,
  SEED_DRIVERS,
  SEED_APPLICATIONS,
  SEED_ADDRESSES,
  PROMOS,
} from "../mockData";

const LS_KEY = "lekkerdeliver_state_v1";

// ---- audio blip for live transitions (Web Audio, no asset) ----
let audioCtx: AudioContext | null = null;
function blip(freq = 660, dur = 0.12) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.value = freq;
    o.type = "sine";
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, audioCtx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + dur);
  } catch {
    /* audio not available */
  }
}

function genPin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function genRef() {
  return "LD-" + Math.floor(2050 + Math.random() * 900);
}

export const distanceKm = (a: LatLng, b: LatLng) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 10) / 10;
};

interface AppState {
  role: PortalRole;
  stores: Store[];
  products: Product[];
  orders: Order[];
  drivers: DriverProfile[];
  applications: DriverApplication[];
  notifications: Notification[];
  customer: CustomerUser;
  cart: CartLine[];
  activeAddress: Address;
  commissionRate: number;
  activeStoreId: string;
  activeDriverId: string;
}

interface Ctx extends AppState {
  setRole: (r: PortalRole) => void;
  setActiveStoreId: (id: string) => void;
  setActiveDriverId: (id: string) => void;
  // customer
  addToCart: (p: Product, optionName?: string, optionDelta?: number, special?: string) => void;
  updateCartQty: (lineId: string, qty: number) => void;
  removeFromCart: (lineId: string) => void;
  clearCart: () => void;
  cartStoreId: string | null;
  cartCount: number;
  cartSubtotal: number;
  setActiveAddress: (a: Address) => void;
  addSavedAddress: (a: Address) => void;
  verifyPhone: () => void;
  verifyAddress: () => void;
  registerCustomer: (data: Partial<CustomerUser>) => void;
  // cart totals w/ promo
  computeTotals: (promo?: string, tip?: number) => { subtotal: number; deliveryFee: number; serviceFee: number; discount: number; tip: number; total: number };
  placeOrder: (opts: { promoCode?: string; tip: number; paymentMethod: string }) => Order | null;
  // engine
  advance: (orderId: string, status: OrderStatus, patch?: Partial<Order>) => void;
  cancelOrder: (orderId: string, reason: string) => void;
  rateOrder: (orderId: string, storeRating: number, driverRating: number, comment: string) => void;
  // store
  storeAccept: (orderId: string, prepMins: number) => void;
  storeReject: (orderId: string) => void;
  storeReady: (orderId: string) => void;
  toggleStoreBusy: (storeId: string, level: Store["busy"]) => void;
  toggleStoreOpen: (storeId: string) => void;
  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  toggleSoldOut: (id: string) => void;
  updateStore: (id: string, patch: Partial<Store>) => void;
  createStore: (s: Partial<Store>) => void;
  verifyStore: (id: string) => void;
  // driver
  driverToggleOnline: (id: string) => void;
  driverAcceptOffer: (orderId: string, driverId: string) => void;
  driverArriveStore: (orderId: string) => void;
  driverVerifyCollection: (orderId: string, pin: string) => boolean;
  driverEnRoute: (orderId: string) => void;
  driverArrivedCustomer: (orderId: string) => void;
  driverComplete: (orderId: string, dropPin: string) => boolean;
  driverMove: (orderId: string, progress: number) => void;
  addTip: (orderId: string, amount: number) => void;
  submitApplication: (app: Omit<DriverApplication, "id" | "status" | "submittedAt">) => void;
  // admin
  reviewApplication: (id: string, action: "approve" | "reject" | "office", reason?: string) => void;
  setCommissionRate: (r: number) => void;
  refundOrder: (orderId: string) => void;
  // notifications
  markNotificationsRead: (audience: PortalRole) => void;
  resetAll: () => void;
  simulateDriverMove: () => void;
}

const AppContext = createContext<Ctx | null>(null);

const defaultCustomer: CustomerUser = {
  id: "cust-1",
  fullName: "Naledi Mokoena",
  email: "naledi@mail.co.za",
  phone: "082 555 0192",
  password: "lekker123",
  homeAddress: SEED_ADDRESSES[0],
  savedAddresses: SEED_ADDRESSES,
  phoneVerified: true,
  addressVerified: true,
};

function loadState(): AppState {
  const base: AppState = {
    role: "customer",
    stores: SEED_STORES,
    products: SEED_PRODUCTS,
    orders: SEED_ORDERS,
    drivers: SEED_DRIVERS,
    applications: SEED_APPLICATIONS,
    notifications: [
      { id: "n1", audience: "store", title: "New order LD-2052", body: "Mama Themba's · R293 · 2 items", at: Date.now() - 120000, read: false },
      { id: "n2", audience: "driver", title: "Order broadcast LD-2053", body: "Mzansi Bun & Burger Bar · payout R148", at: Date.now() - 60000, read: false },
    ],
    customer: defaultCustomer,
    cart: [],
    activeAddress: SEED_ADDRESSES[0],
    commissionRate: 12,
    activeStoreId: "st-themba",
    activeDriverId: "dr-sipho",
  };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      return { ...base, ...parsed };
    }
  } catch {
    /* ignore */
  }
  return base;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {
      /* quota */
    }
  }, [state]);

  const patch = useCallback((fn: (s: AppState) => AppState) => setState(fn), []);

  const pushNotification = useCallback(
    (n: Omit<Notification, "id" | "at" | "read">) => {
      patch((s) => ({
        ...s,
        notifications: [
          { ...n, id: "n" + Date.now() + Math.random().toString(36).slice(2, 6), at: Date.now(), read: false },
          ...s.notifications,
        ].slice(0, 40),
      }));
    },
    [patch]
  );

  // ---------- ENGINE: advance order status ----------
  const advance = useCallback(
    (orderId: string, status: OrderStatus, p?: Partial<Order>) => {
      patch((s) => {
        const orders = s.orders.map((o) => {
          if (o.id !== orderId) return o;
          const next: Order = {
            ...o,
            ...p,
            status,
            updatedAt: Date.now(),
            history: [...o.history, { status, at: Date.now() }],
          };
          return next;
        });
        return { ...s, orders };
      });
      blip(status === "delivery_completed" ? 880 : 620);
      const order = stateRef.current.orders.find((o) => o.id === orderId);
      if (order) {
        const audience: PortalRole =
          status.startsWith("store") || status === "driver_broadcast"
            ? "store"
            : status.startsWith("driver") || status === "collection_verified"
            ? "driver"
            : "customer";
        pushNotification({
          audience,
          title: `${order.ref} · ${STAGE_LABEL[status]}`,
          body: order.storeName,
          orderId,
        });
      }
    },
    [patch, pushNotification]
  );

  // ---------- CUSTOMER / CART ----------
  const addToCart: Ctx["addToCart"] = useCallback(
    (p, optionName, optionDelta = 0, special) => {
      patch((s) => {
        const cart = [...s.cart];
        const key = `${p.id}-${optionName ?? ""}`;
        const existing = cart.find((l) => l.id === key);
        if (existing) {
          existing.qty += 1;
          return { ...s, cart };
        }
        cart.push({
          id: key,
          productId: p.id,
          storeId: p.storeId,
          name: p.name,
          unitPrice: p.promoPrice ?? p.price,
          qty: 1,
          optionName,
          optionDelta,
          special,
          image: p.image,
        });
        return { ...s, cart };
      });
      toast.success(`${p.name} added to basket`, { description: `R${((p.promoPrice ?? p.price) + (optionDelta || 0)).toFixed(0)}` });
    },
    [patch]
  );

  const updateCartQty = useCallback(
    (lineId: string, qty: number) => {
      patch((s) => ({
        ...s,
        cart: qty <= 0 ? s.cart.filter((l) => l.id !== lineId) : s.cart.map((l) => (l.id === lineId ? { ...l, qty } : l)),
      }));
    },
    [patch]
  );
  const removeFromCart = useCallback(
    (lineId: string) => patch((s) => ({ ...s, cart: s.cart.filter((l) => l.id !== lineId) })),
    [patch]
  );
  const clearCart = useCallback(() => patch((s) => ({ ...s, cart: [] })), [patch]);

  const setActiveAddress = useCallback((a: Address) => patch((s) => ({ ...s, activeAddress: a })), [patch]);
  const addSavedAddress = useCallback(
    (a: Address) =>
      patch((s) => ({
        ...s,
        customer: { ...s.customer, savedAddresses: [...s.customer.savedAddresses, a] },
        activeAddress: a,
      })),
    [patch]
  );
  const verifyPhone = useCallback(() => {
    patch((s) => ({ ...s, customer: { ...s.customer, phoneVerified: true } }));
    toast.success("Mobile number verified", { description: "SMS code confirmed" });
  }, [patch]);
  const verifyAddress = useCallback(() => {
    patch((s) => ({ ...s, customer: { ...s.customer, addressVerified: true } }));
    toast.success("Residential address verified");
  }, [patch]);
  const registerCustomer = useCallback(
    (data: Partial<CustomerUser>) => {
      patch((s) => ({ ...s, customer: { ...s.customer, ...data } as CustomerUser }));
      toast.success("Account created", { description: "Welcome to LekkerDeliver" });
    },
    [patch]
  );

  const cartStoreId = useMemo(() => (state.cart.length ? state.cart[0].storeId : null), [state.cart]);
  const cartCount = useMemo(() => state.cart.reduce((n, l) => n + l.qty, 0), [state.cart]);
  const cartSubtotal = useMemo(
    () => state.cart.reduce((n, l) => n + (l.unitPrice + (l.optionDelta || 0)) * l.qty, 0),
    [state.cart]
  );

  const computeTotals: Ctx["computeTotals"] = useCallback(
    (promo, tip = 0) => {
      const subtotal = stateRef.current.cart.reduce((n, l) => n + (l.unitPrice + (l.optionDelta || 0)) * l.qty, 0);
      const store = stateRef.current.stores.find((s) => s.id === stateRef.current.cart[0]?.storeId);
      let deliveryFee = store?.deliveryFee ?? 0;
      const serviceFee = Math.round(subtotal * 0.05);
      let discount = 0;
      if (promo && PROMOS[promo]) {
        const pr = PROMOS[promo];
        if (pr.type === "percent") discount = Math.round((subtotal * pr.value) / 100);
        if (pr.type === "freeDelivery") deliveryFee = 0;
      }
      const total = Math.max(0, subtotal - discount + deliveryFee + serviceFee + tip);
      return { subtotal, deliveryFee, serviceFee, discount, tip, total };
    },
    []
  );

  const placeOrder: Ctx["placeOrder"] = useCallback(
    ({ promoCode, tip, paymentMethod }) => {
      const s = stateRef.current;
      if (!s.cart.length) {
        toast.error("Your basket is empty");
        return null;
      }
      const store = s.stores.find((x) => x.id === s.cart[0].storeId)!;
      const totals = computeTotals(promoCode, tip);
      const id = "ord-" + Date.now();
      const order: Order = {
        id,
        ref: genRef(),
        customerId: s.customer.id,
        customerName: s.customer.fullName,
        storeId: store.id,
        storeName: store.name,
        items: s.cart.map((l) => ({
          productId: l.productId,
          name: l.name,
          qty: l.qty,
          unitPrice: l.unitPrice + (l.optionDelta || 0),
          optionName: l.optionName,
          special: l.special,
        })),
        subtotal: totals.subtotal,
        deliveryFee: totals.deliveryFee,
        serviceFee: totals.serviceFee,
        discount: totals.discount,
        tip: totals.tip,
        total: totals.total,
        status: "payment_processed",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        address: s.activeAddress,
        dropPin: genPin(),
        collectionPin: genPin(),
        prepMins: store.prepMins,
        estimatedArrival: Date.now() + (store.prepMins + 15) * 60000,
        promoCode,
        paymentMethod,
        routeProgress: 0,
        history: [{ status: "payment_processed", at: Date.now() }],
      };
      patch((st) => ({ ...st, orders: [order, ...st.orders], cart: [] }));
      pushNotification({ audience: "store", title: `New order ${order.ref}`, body: `${store.name} · R${order.total}`, orderId: id });
      blip(720);
      // simulate store receiving ping shortly after
      setTimeout(() => advance(id, "store_received"), 1500);
      toast.success(`Payment confirmed · R${order.total}`, { description: `${paymentMethod} · ${order.ref}` });
      return order;
    },
    [advance, computeTotals, patch, pushNotification]
  );

  const cancelOrder = useCallback(
    (orderId: string, reason: string) => {
      advance(orderId, "cancelled", { cancelReason: reason });
      toast.error("Order cancelled", { description: reason });
    },
    [advance]
  );

  const rateOrder = useCallback(
    (orderId: string, storeRating: number, driverRating: number, comment: string) => {
      patch((s) => ({
        ...s,
        orders: s.orders.map((o) =>
          o.id === orderId
            ? { ...o, status: "rating_submitted", rating: { orderId, storeRating, driverRating, comment, createdAt: Date.now() }, updatedAt: Date.now(), history: [...o.history, { status: "rating_submitted", at: Date.now() }] }
            : o
        ),
      }));
      blip(900);
      toast.success("Thanks for the review!", { description: "Enkosi · Dankie · Ngiyabonga" });
    },
    [patch]
  );

  // ---------- STORE ----------
  const storeAccept = useCallback(
    (orderId: string, prepMins: number) => {
      advance(orderId, "store_accepted", { prepMins });
      setTimeout(() => advance(orderId, "store_preparing"), 1200);
      toast.success("Order accepted", { description: `Prep ${prepMins} min` });
    },
    [advance]
  );
  const storeReject = useCallback(
    (orderId: string) => {
      cancelOrder(orderId, "Store declined the order");
    },
    [cancelOrder]
  );
  const storeReady = useCallback(
    (orderId: string) => {
      advance(orderId, "driver_broadcast");
      toast.success("Ready for collection", { description: "Broadcast to nearby drivers" });
    },
    [advance]
  );
  const toggleStoreBusy = useCallback(
    (storeId: string, level: Store["busy"]) => patch((s) => ({ ...s, stores: s.stores.map((x) => (x.id === storeId ? { ...x, busy: level } : x)) })),
    [patch]
  );
  const toggleStoreOpen = useCallback(
    (storeId: string) => patch((s) => ({ ...s, stores: s.stores.map((x) => (x.id === storeId ? { ...x, open: !x.open } : x)) })),
    [patch]
  );
  const upsertProduct = useCallback(
    (p: Product) => {
      patch((s) => {
        const exists = s.products.some((x) => x.id === p.id);
        return { ...s, products: exists ? s.products.map((x) => (x.id === p.id ? p : x)) : [p, ...s.products] };
      });
      toast.success("Menu updated", { description: p.name });
    },
    [patch]
  );
  const deleteProduct = useCallback(
    (id: string) => {
      patch((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));
      toast("Item removed from catalogue");
    },
    [patch]
  );
  const toggleSoldOut = useCallback(
    (id: string) => patch((s) => ({ ...s, products: s.products.map((p) => (p.id === id ? { ...p, soldOut: !p.soldOut } : p)) })),
    [patch]
  );
  const updateStore = useCallback(
    (id: string, p: Partial<Store>) => patch((s) => ({ ...s, stores: s.stores.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
    [patch]
  );
  const createStore = useCallback(
    (data: Partial<Store>) => {
      const id = "st-" + Date.now();
      const store: Store = {
        id,
        name: data.name || "New Store",
        tagline: data.tagline || "New on LekkerDeliver",
        logo: "🏪",
        cover: SEED_STORES[0].cover,
        category: data.category || "Local businesses",
        badges: data.badges || ["Proudly SA"],
        suburb: data.suburb || "TBD",
        city: data.city || "Cape Town",
        coords: data.coords || { lat: -33.9249, lng: 18.4241 },
        rating: 0,
        ratingCount: 0,
        prepMins: data.prepMins || 20,
        deliveryFee: data.deliveryFee || 30,
        deliveryRadiusKm: 10,
        busy: "Quiet",
        open: true,
        openingHours: data.openingHours || "09:00 - 18:00",
        verified: false,
        registration: data.registration || "pending",
        phone: data.phone || "",
      };
      patch((s) => ({ ...s, stores: [store, ...s.stores] }));
      pushNotification({ audience: "admin", title: "New store created", body: store.name });
      toast.success("Store account created", { description: "Login credentials issued" });
    },
    [patch, pushNotification]
  );
  const verifyStore = useCallback(
    (id: string) => {
      patch((s) => ({ ...s, stores: s.stores.map((x) => (x.id === id ? { ...x, verified: true } : x)) }));
      toast.success("Store compliance verified");
    },
    [patch]
  );

  // ---------- DRIVER ----------
  const driverToggleOnline = useCallback(
    (id: string) => {
      patch((s) => ({ ...s, drivers: s.drivers.map((d) => (d.id === id ? { ...d, status: d.status === "online" ? "offline" : "online" } : d)) }));
    },
    [patch]
  );
  const driverAcceptOffer = useCallback(
    (orderId: string, driverId: string) => {
      const drv = stateRef.current.drivers.find((d) => d.id === driverId);
      advance(orderId, "driver_assigned", {
        driverId,
        driverName: drv?.name,
        driverPhone: drv?.phone,
        vehicle: drv ? `${drv.vehicleMake} ${drv.vehicleModel} · ${drv.registration}` : undefined,
      });
      patch((s) => ({ ...s, drivers: s.drivers.map((d) => (d.id === driverId ? { ...d, status: "on_delivery" } : d)) }));
      toast.success("Offer accepted", { description: "Head to the store for collection" });
    },
    [advance, patch]
  );
  const driverArriveStore = useCallback(
    (orderId: string) => advance(orderId, "driver_at_store"),
    [advance]
  );
  const driverVerifyCollection = useCallback(
    (orderId: string, pin: string) => {
      const o = stateRef.current.orders.find((x) => x.id === orderId);
      if (!o) return false;
      if (pin !== o.collectionPin) {
        toast.error("Invalid collection PIN");
        return false;
      }
      advance(orderId, "collection_verified");
      toast.success("Collection verified", { description: "Order handed over" });
      return true;
    },
    [advance]
  );
  const driverEnRoute = useCallback(
    (orderId: string) => advance(orderId, "driver_en_route", { routeProgress: 0 }),
    [advance]
  );
  const driverArrivedCustomer = useCallback(
    (orderId: string) => advance(orderId, "driver_arrived_customer"),
    [advance]
  );
  const driverComplete = useCallback(
    (orderId: string, dropPin: string) => {
      const o = stateRef.current.orders.find((x) => x.id === orderId);
      if (!o) return false;
      if (dropPin !== o.dropPin) {
        toast.error("Invalid drop-off PIN", { description: "Ask the customer for their 6-digit PIN" });
        return false;
      }
      advance(orderId, "delivery_completed", { routeProgress: 1 });
      const drv = stateRef.current.drivers.find((d) => d.id === o.driverId);
      if (drv) {
        const payout = Math.round(o.deliveryFee + 90);
        patch((s) => ({
          ...s,
          drivers: s.drivers.map((d) => (d.id === drv.id ? { ...d, status: "online", trips: d.trips + 1, earningsToday: d.earningsToday + payout } : d)),
        }));
      }
      pushNotification({ audience: "customer", title: `${o.ref} delivered`, body: "Rate your store & driver", orderId });
      blip(980);
      toast.success("Delivery completed", { description: "Drop-off PIN verified" });
      return true;
    },
    [advance, patch, pushNotification]
  );
  const driverMove = useCallback(
    (orderId: string, progress: number) => {
      patch((s) => ({
        ...s,
        orders: s.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                routeProgress: Math.min(1, progress),
                location: o.location
                  ? { lat: o.location.lat + (o.address.coords.lat - o.location.lat) * 0.25, lng: o.location.lng + (o.address.coords.lng - o.location.lng) * 0.25 }
                  : o.location,
              }
            : o
        ),
      }));
    },
    [patch]
  );
  const addTip = useCallback(
    (orderId: string, amount: number) => {
      patch((s) => ({
        ...s,
        orders: s.orders.map((o) => (o.id === orderId ? { ...o, tip: o.tip + amount, total: o.total + amount } : o)),
        drivers: s.drivers.map((d) => {
          const o = s.orders.find((x) => x.id === orderId);
          return o && d.id === o.driverId ? { ...d, tipsToday: d.tipsToday + amount } : d;
        }),
      }));
      toast.success(`Tip added · R${amount}`, { description: "Thank the driver" });
    },
    [patch]
  );
  const submitApplication = useCallback(
    (app: Omit<DriverApplication, "id" | "status" | "submittedAt">) => {
      const id = "app-" + Date.now();
      patch((s) => ({
        ...s,
        applications: [{ ...app, id, status: "Submitted", submittedAt: Date.now() }, ...s.applications],
      }));
      pushNotification({ audience: "admin", title: "New driver application", body: app.name });
      toast.success("Application submitted", { description: "Our team will review your documents" });
    },
    [patch, pushNotification]
  );

  // ---------- ADMIN ----------
  const reviewApplication = useCallback(
    (id: string, action: "approve" | "reject" | "office", reason?: string) => {
      patch((s) => {
        const app = s.applications.find((a) => a.id === id);
        if (!app) return s;
        const status: DriverApplication["status"] =
          action === "approve" ? "Approved" : action === "reject" ? "Rejected" : "Office Verification Required";
        const applications = s.applications.map((a) => (a.id === id ? { ...a, status, rejectReason: reason } : a));
        let drivers = s.drivers;
        if (action === "approve") {
          drivers = [
            ...s.drivers,
            {
              id: "dr-" + Date.now(),
              name: app.name,
              phone: app.phone,
              email: app.email,
              idNumber: app.idNumber,
              licenceCode: app.licenceCode,
              vehicleMake: app.vehicleMake,
              vehicleModel: app.vehicleModel,
              registration: app.registration,
              licenceDiscExpiry: app.licenceDiscExpiry,
              bank: app.bank,
              status: "offline",
              rating: 5,
              trips: 0,
              earningsToday: 0,
              tipsToday: 0,
              coords: { lat: -33.9249, lng: 18.4241 },
              city: app.city,
              verified: true,
              acceptanceRate: 100,
            },
          ];
        }
        return { ...s, applications, drivers };
      });
      toast[action === "reject" ? "error" : "success"](
        action === "approve" ? "Driver approved & onboarded" : action === "office" ? "Sent for office verification" : "Application rejected",
        { description: reason }
      );
    },
    [patch]
  );
  const setCommissionRate = useCallback(
    (r: number) => patch((s) => ({ ...s, commissionRate: r })),
    [patch]
  );
  const refundOrder = useCallback(
    (orderId: string) => {
      cancelOrder(orderId, "Admin refund processed");
      pushNotification({ audience: "customer", title: "Refund processed", body: "Funds returned via PayFast", orderId });
    },
    [cancelOrder, pushNotification]
  );

  const markNotificationsRead = useCallback(
    (audience: PortalRole) => patch((s) => ({ ...s, notifications: s.notifications.map((n) => (n.audience === audience ? { ...n, read: true } : n)) })),
    [patch]
  );

  const resetAll = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    setState(loadState());
    toast("Demo data reset");
  }, []);

  const simulateDriverMove = useCallback(() => {
    const active = stateRef.current.orders.find((o) => o.status === "driver_en_route");
    if (!active) {
      toast.info("No order currently en route to simulate");
      return;
    }
    const np = Math.min(1, (active.routeProgress || 0) + 0.2);
    driverMove(active.id, np);
    if (np >= 1) advance(active.id, "driver_arrived_customer");
    toast("Driver position updated", { description: `${active.ref} · ${Math.round(np * 100)}% to destination` });
  }, [advance, driverMove]);

  const value: Ctx = {
    ...state,
    setRole: (r) => patch((s) => ({ ...s, role: r })),
    setActiveStoreId: (id) => patch((s) => ({ ...s, activeStoreId: id })),
    setActiveDriverId: (id) => patch((s) => ({ ...s, activeDriverId: id })),
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    cartStoreId,
    cartCount,
    cartSubtotal,
    setActiveAddress,
    addSavedAddress,
    verifyPhone,
    verifyAddress,
    registerCustomer,
    computeTotals,
    placeOrder,
    advance,
    cancelOrder,
    rateOrder,
    storeAccept,
    storeReject,
    storeReady,
    toggleStoreBusy,
    toggleStoreOpen,
    upsertProduct,
    deleteProduct,
    toggleSoldOut,
    updateStore,
    createStore,
    verifyStore,
    driverToggleOnline,
    driverAcceptOffer,
    driverArriveStore,
    driverVerifyCollection,
    driverEnRoute,
    driverArrivedCustomer,
    driverComplete,
    driverMove,
    addTip,
    submitApplication,
    reviewApplication,
    setCommissionRate,
    refundOrder,
    markNotificationsRead,
    resetAll,
    simulateDriverMove,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export const stageIndex = (s: OrderStatus) => ORDER_STAGES.indexOf(s);
export { STAGE_LABEL, ORDER_STAGES };

/* ============================ SHARED UI PRIMITIVES ============================ */
import { motion } from "framer-motion";
import type { BusyLevel } from "../types";

export const formatZAR = (n: number) =>
  "R" + (Math.round(n * 100) / 100).toLocaleString("en-ZA", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

export const STATUS_TONE: Record<OrderStatus, string> = {
  payment_pending: "bg-amber-100 text-amber-700 ring-amber-200",
  payment_processed: "bg-amber-100 text-amber-700 ring-amber-200",
  store_received: "bg-orange-100 text-orange-700 ring-orange-200",
  store_accepted: "bg-orange-100 text-orange-700 ring-orange-200",
  store_preparing: "bg-orange-100 text-orange-700 ring-orange-200",
  driver_broadcast: "bg-sky-100 text-sky-700 ring-sky-200",
  driver_assigned: "bg-sky-100 text-sky-700 ring-sky-200",
  driver_at_store: "bg-sky-100 text-sky-700 ring-sky-200",
  collection_verified: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  driver_en_route: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  driver_arrived_customer: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  delivery_completed: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  rating_submitted: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  cancelled: "bg-rose-100 text-rose-700 ring-rose-200",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${STATUS_TONE[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {STAGE_LABEL[status]}
    </span>
  );
}

export const BUSY_TONE: Record<BusyLevel, string> = {
  Quiet: "bg-emerald-500",
  Normal: "bg-lime-500",
  Busy: "bg-amber-500",
  "Very Busy": "bg-rose-500",
};

export function BusyPill({ level }: { level: BusyLevel }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/5 px-2 py-0.5 text-[11px] font-medium text-slate-600">
      <span className={`h-2 w-2 rounded-full ${BUSY_TONE[level]} ${level === "Very Busy" ? "animate-pulse" : ""}`} />
      {level}
    </span>
  );
}

/* 13-stage progress stepper */
export function StageStepper({ status }: { status: OrderStatus }) {
  const idx = stageIndex(status);
  const cancelled = status === "cancelled";
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        {ORDER_STAGES.map((s, i) => {
          const done = !cancelled && i <= idx;
          const active = i === idx;
          return (
            <div key={s} className="flex-1">
              <motion.div
                initial={{ opacity: 0.25 }}
                animate={{ opacity: done ? 1 : 0.25 }}
                className={`h-1.5 rounded-full ${done ? "bg-[#D97706]" : "bg-slate-200"}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[11px] font-medium text-slate-500">
        <span>Payment</span>
        <span>Kitchen</span>
        <span>Driver</span>
        <span>On the way</span>
        <span>Delivered</span>
      </div>
    </div>
  );
}

/* Lightweight stylised live map with pulsing pins (no external tiles) */
export function LiveMap({
  store,
  customer,
  driver,
  progress = 0,
  height = 220,
}: {
  store: LatLng;
  customer: LatLng;
  driver?: LatLng;
  progress?: number;
  height?: number;
}) {
  const pts = [store, customer, ...(driver ? [driver] : [])];
  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const pad = 0.02;
  const nx = (lng: number) => ((lng - minLng + pad) / (maxLng - minLng + pad * 2 || 1)) * 100;
  const ny = (lat: number) => (1 - (lat - minLat + pad) / (maxLat - minLat + pad * 2 || 1)) * 100;
  const sx = nx(store.lng), sy = ny(store.lat);
  const cx = nx(customer.lng), cy = ny(customer.lat);
  const dp = driver ? { x: nx(driver.lng), y: ny(driver.lat) } : null;
  // if no live driver, interpolate along route by progress
  const marker = dp ?? { x: sx + (cx - sx) * progress, y: sy + (cy - sy) * progress };
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl ring-1 ring-slate-900/10"
      style={{ height, background: "linear-gradient(135deg,#eef7f0 0%,#fdfbf7 45%,#eaf3fb 100%)" }}
    >
      {/* faux roads */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        {[20, 42, 66, 84].map((y) => (
          <line key={`h${y}`} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#cbd5e1" strokeWidth="2" opacity="0.5" />
        ))}
        {[18, 38, 60, 82].map((x) => (
          <line key={`v${x}`} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="#cbd5e1" strokeWidth="2" opacity="0.5" />
        ))}
        <path d={`M ${sx}% ${sy}% Q ${(sx + cx) / 2 + 6}% ${(sy + cy) / 2 - 10}%, ${cx}% ${cy}%`} fill="none" stroke="#D97706" strokeWidth="3" strokeDasharray="6 5" opacity="0.85" />
      </svg>
      {/* store pin */}
      <MapPin x={sx} y={sy} color="#0F172A" label="Store" />
      {/* customer pin */}
      <MapPin x={cx} y={cy} color="#10B981" label="You" />
      {/* driver marker */}
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        animate={{ left: `${marker.x}%`, top: `${marker.y}%` }}
        transition={{ type: "spring", stiffness: 60, damping: 15 }}
      >
        <div className="relative">
          <span className="absolute inset-0 -m-2 animate-ping rounded-full bg-[#E5A823] opacity-60" />
          <div className="grid h-8 w-8 place-items-center rounded-full bg-[#E5A823] text-sm shadow-lg ring-2 ring-white">🛵</div>
        </div>
      </motion.div>
    </div>
  );
}

function MapPin({ x, y, color, label }: { x: number; y: number; color: string; label: string }) {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-full" style={{ left: `${x}%`, top: `${y}%` }}>
      <div className="flex flex-col items-center">
        <span className="mb-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white shadow" style={{ background: color }}>
          {label}
        </span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
          <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" fill="#fff" />
        </svg>
      </div>
    </div>
  );
}