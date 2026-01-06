export interface Service {
  // CSV Fields
  webflow_id?: string;
  webflow_slug: string;
  service_name: string;
  bookla_service_id?: string;
  duration_minutes: number;
  price_eur: number;
  category_slug?: string;
  bookla_category_id?: string;
  resource_slug?: string;
  bookla_resource_id?: string;
  capacity_spots?: number;
  visible: boolean;
  option_extra_slug?: string;
  option_extra_price?: number;
  option_extra_duration?: number;
  bookla_updated_at?: string;
  notes_internal?: string;
  service_type?: string;        // Nom du type de service (ex: "Cornrows", "Fulani")
  service_type_id?: string;     // ID Webflow du type de service

  // Calculated / Internal
  final_price?: number;
  final_duration_min?: number;
  rowIndex: number;
}

export interface ServiceType {
  id: string;                   // Webflow ID
  name: string;                 // Nom du type
  slug: string;                 // Slug
  serviceIds: string[];         // IDs des services liés (multi-reference)
  categoryIds: string[];        // IDs des catégories (homme/femme)
}

export interface SyncReport {
  created: number;
  updated: number;
  ignored: number;
  errors: string[];
}

export interface Booking {
  id: string;
  serviceId: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
}

export interface BookingRecord {
  bookingId: string;
  clientEmail: string;
  amount: number;
  status: string;
  createdAt: string;
  checkoutUrl?: string;
  rowIndex?: number;
}
