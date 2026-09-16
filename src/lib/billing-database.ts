export type BillingJson =
  | string
  | number
  | boolean
  | null
  | { [key: string]: unknown }
  | unknown[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type BillingOrder = {
  id: string;
  user_id: string;
  plan_id: "monthly" | "three-months" | "yearly" | "lifetime";
  provider: string;
  provider_session_id: string | null;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "expired" | "failed" | "cancelled";
  checkout_url: string | null;
  metadata: BillingJson;
  created_at: string;
  paid_at: string | null;
  updated_at: string;
};

type BillingEntitlement = {
  id: string;
  user_id: string;
  order_id: string | null;
  plan_id: BillingOrder["plan_id"];
  status: "active" | "expired" | "cancelled";
  starts_at: string;
  ends_at: string | null;
  provider_subscription_id: string | null;
  created_at: string;
  updated_at: string;
};

type BillingSubscription = {
  id: string;
  user_id: string;
  order_id: string | null;
  provider_subscription_id: string;
  plan_id: "monthly";
  status: "pending" | "active" | "past_due" | "cancelled" | "expired";
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  metadata: BillingJson;
  created_at: string;
  updated_at: string;
};

type BillingWebhookEvent = {
  id: string;
  provider_event_id: string;
  event_type: string | null;
  payload: BillingJson;
  received_at: string;
  processed_at: string | null;
};

type Profile = { id: string; plan: string | null };
type Optional<T> = { [K in keyof T]?: T[K] };

export type BillingDatabase = {
  public: {
    Tables: {
      billing_orders: Table<BillingOrder, Optional<BillingOrder>, Optional<BillingOrder>>;
      billing_entitlements: Table<BillingEntitlement, Optional<BillingEntitlement>, Optional<BillingEntitlement>>;
      billing_subscriptions: Table<BillingSubscription, Optional<BillingSubscription>, Optional<BillingSubscription>>;
      billing_webhook_events: Table<BillingWebhookEvent, Optional<BillingWebhookEvent>, Optional<BillingWebhookEvent>>;
      profiles: Table<Profile, Optional<Profile>, Optional<Profile>>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
