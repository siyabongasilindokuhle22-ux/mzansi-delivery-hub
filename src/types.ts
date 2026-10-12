// ===== LekkerDeliver core type system =====

export type PortalRole = "customer" | "store" | "driver" | "admin";

export type OrderStatus =
  | "payment_pending"
  | "payment_processed"
  | "store_received"
  | "store_accepted"
  | "store_preparing"
  | "driver_broadcast"
  | "driver_assigned"
  | "driver_at_store"
  | "collection_verified"
  | "driver_en_route"
  | "driver_arrived_customer"
  | "delivery_completed"
  | "rating_submitted"
  | "cancelled";

export const ORDER_STAGES: OrderStatus[] = [
  "payment_pending",
  "payment_processed",
  "store_received",
  "store_accepted",
  "store_preparing",
  "driver_broadcast",
  "driver_assigned",
  "driver_at_store",
  "collection_verified",
  "driver_en_route",
  "driver_arrived_customer",
  "delivery_completed",
  "rating_submitted",
];

export const STAGE_LABEL: Record<OrderStatus, string> = {
  payment_pending: "Awaiting PayFast payment",
  payment_processed: "Payment verified in ZAR",
  store_received: "Order pinged to store terminal",
  store_accepted: "Store accepted order",
  store_preparing: "Kitchen assembling items",
  driver_broadcast: "Broadcast to nearby drivers",
  driver_assigned: "Driver accepted the offer",
  driver_at_store: "Driver arrived at store",
  collection_verified: "Collection verified via PIN/QR",
  driver_en_route: "Driver en route to you",
  driver_arrived_customer: "Driver outside your location",
  delivery_completed: "Delivery completed",
  rating_submitted: "Review submitted",
  cancelled: "Order cancelled",
};

export type BusyLevel = "Quiet" | "Normal" | "Busy" | "Very Busy";
export const BUSY_LEVELS: BusyLevel[] = ["Quiet", "Normal", "Busy", "Very Busy"];

export type Category =
  | "Fast food"
  | "Burgers"
  | "Chicken"
  | "Pizza"
  | "Groceries"
  | "Drinks"
  | "Desserts"
  | "Local restaurants"
  | "Local businesses";

export const CATEGORIES: Category[] = [
  "Fast food",
  "Burgers",
  "Chicken",
  "Pizza",
  "Groceries",
  "Drinks",
  "Desserts",
  "Local restaurants",
  "Local businesses",
];

export type City = "Cape Town" | "Johannesburg" | "Durban";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  suburb: string;
  city: City;
  postalCode: string;
  coords: LatLng;
  verified: boolean;
  isHome?: boolean;
}

export interface ProductOption {
  id: string;
  name: string;
  priceDelta: number; // ZAR
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number; // ZAR regular
  promoPrice?: number; // ZAR discounted
  image: string;
  category: Category;
  badge?: string; // e.g. "20% OFF", "COMBO SAVER", "HALAL", "PROUDLY SA"
  spicy?: 0 | 1 | 2 | 3;
  options?: ProductOption[]; // sizes / modifiers
  soldOut?: boolean;
  isCombo?: boolean;
}

export interface Store {
  id: string;
  name: string;
  tagline: string;
  logo: string; // emoji-ish letter avatar handled in UI
  cover: string;
  category: Category;
  badges: string[]; // Halal, Proudly SA, Local Spaza, Lekker Deal
  suburb: string;
  city: City;
  coords: LatLng;
  rating: number;
  ratingCount: number;
  prepMins: number;
  deliveryFee: number; // ZAR
  deliveryRadiusKm: number;
  busy: BusyLevel;
  open: boolean;
  openingHours: string;
  verified: boolean;
  registration: string; // SA reg no
  phone: string;
}

export interface CartLine {
  id: string;
  productId: string;
  storeId: string;
  name: string;
  unitPrice: number;
  qty: number;
  optionName?: string;
  optionDelta?: number;
  special?: string;
  image: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  optionName?: string;
  special?: string;
}

export interface Review {
  orderId: string;
  storeRating: number;
  driverRating: number;
  comment: string;
  createdAt: number;
}

export interface Order {
  id: string;
  ref: string;
  customerId: string;
  customerName: string;
  storeId: string;
  storeName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  tip: number;
  total: number;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  address: Address;
  dropPin: string; // 6-digit customer drop-off PIN
  collectionPin: string; // 6-digit store collection PIN
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  vehicle?: string;
  etaMins?: number;
  prepMins?: number;
  estimatedArrival?: number;
  location?: LatLng; // live driver GPS
  routeProgress?: number; // 0..1
  promoCode?: string;
  paymentMethod?: string;
  cancelReason?: string;
  rating?: Review;
  history: { status: OrderStatus; at: number }[];
}

export type DriverStatus = "online" | "offline" | "on_delivery";

export interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  idNumber: string;
  licenceCode: string; // Code 8/10/EB/A
  vehicleMake: string;
  vehicleModel: string;
  registration: string;
  licenceDiscExpiry: string;
  bank: string;
  status: DriverStatus;
  rating: number;
  trips: number;
  earningsToday: number;
  tipsToday: number;
  coords: LatLng;
  city: City;
  verified: boolean;
  acceptanceRate: number;
}

export type ApplicationStatus =
  | "Submitted"
  | "Under Review"
  | "Office Verification Required"
  | "Approved"
  | "Rejected";

export interface DriverApplication {
  id: string;
  name: string;
  phone: string;
  email: string;
  idNumber: string;
  licenceCode: string;
  vehicleMake: string;
  vehicleModel: string;
  registration: string;
  licenceDiscExpiry: string;
  bank: string;
  proofOfAddress: boolean;
  emergencyContact: string;
  status: ApplicationStatus;
  submittedAt: number;
  city: City;
  rejectReason?: string;
}

export interface Notification {
  id: string;
  audience: PortalRole;
  title: string;
  body: string;
  at: number;
  read: boolean;
  orderId?: string;
}

export interface StoreSalesSummary {
  storeId: string;
  grossToday: number;
  grossWeek: number;
  grossMonth: number;
  commission: number;
  netPayout: number;
  ordersToday: number;
  topSellers: { name: string; qty: number; revenue: number }[];
  daily: { day: string; revenue: number }[];
}

export interface AdminStats {
  totalGMV: number;
  commissionEarned: number;
  activeStores: number;
  onlineDrivers: number;
  completedToday: number;
  pendingApplications: number;
  commissionRate: number;
}

export interface CustomerUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  homeAddress: Address;
  savedAddresses: Address[];
  phoneVerified: boolean;
  addressVerified: boolean;
}
