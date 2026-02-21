import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient, {
  type DashboardReservation,
  type DashboardUser,
} from "./DashboardClient";
import type { ReservationStatus, DocumentStatus } from "@/types";

// â”€â”€ Raw API shapes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ApiVehicleEmbed {
  id: string;
  brand: string;
  model: string;
  imageUrl?: string;
  features?: string[];
}

interface ApiDocument {
  type: string;
  status: DocumentStatus;
}

interface ApiReservation {
  id: string;
  vehicleId: string;
  vehicle?: ApiVehicleEmbed;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  status: string;
  /** total_price_eur_cents from DB column */
  totalPriceEurCents: number;
  /** deposit_eur_cents from DB column */
  depositEurCents: number;
  totalDays: number;
  documents?: ApiDocument[];
}

interface ApiUser {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  role: string;
  memberSince?: string;
  createdAt?: string;
}

// â”€â”€ T4-5 â€” Feature flag mapping â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function mapFeatures(features: string[] = []) {
  return {
    includesJawaz: features.some((f) => /jawaz/i.test(f)),
    includesSIM: features.some((f) => /\bsim\b/i.test(f)),
    includesInsurance: features.some((f) =>
      /seguro|insurance|todo.?riesgo/i.test(f)
    ),
  };
}

// â”€â”€ T4-4 â€” Document status mapping â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function mapDocuments(docs: ApiDocument[] = []): {
  passport: DocumentStatus;
  license: DocumentStatus;
} {
  const passport =
    (docs.find((d) => /passport|pasaporte/i.test(d.type))?.status as DocumentStatus) ??
    "PENDING_REVIEW";
  const license =
    (docs.find((d) => /licen|conducir|driving/i.test(d.type))
      ?.status as DocumentStatus) ?? "PENDING_REVIEW";
  return { passport, license };
}

// â”€â”€ T4-2 â€” Authenticated server data fetch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function getDashboardData(page: number): Promise<{
  user: ApiUser;
  rawReservations: ApiReservation[];
  total: number;
  currentPage: number;
  limit: number;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nexus_token")?.value;
  if (!token) redirect("/login?redirect=/dashboard");

  const API = process.env.API_URL!;
  const LIMIT = 20;
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // no-store so dashboard always shows fresh data
  const [userRes, reservationsRes] = await Promise.all([
    fetch(`${API}/auth/me`, { headers, cache: "no-store" }),
    fetch(`${API}/reservations/my?page=${page}&limit=${LIMIT}`, { headers, cache: "no-store" }),
  ]);

  if (userRes.status === 401) {
    redirect("/login?session_expired=true&redirect=/dashboard");
  }

  if (!userRes.ok) {
    redirect("/login?redirect=/dashboard");
  }

  const user = (await userRes.json()) as ApiUser;
  const body = reservationsRes.ok
    ? ((await reservationsRes.json()) as {
        data: ApiReservation[];
        total: number;
        page: number;
        limit: number;
      })
    : { data: [], total: 0, page: 1, limit: LIMIT };

  return {
    user,
    rawReservations: body.data,
    total: body.total,
    currentPage: body.page,
    limit: body.limit,
  };
}

// â”€â”€ T4-1, T4-3, T4-6 â€” Server Component (replaces mock page) â”€

export default async function DashboardPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await props.searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const { user, rawReservations, total, currentPage, limit } = await getDashboardData(page);

  // Map API shape â†’ DashboardReservation (removes MOCK_VEHICLES dependency)
  const reservations: DashboardReservation[] = rawReservations.map((r) => {
    const feats = mapFeatures(r.vehicle?.features);
    const docs = mapDocuments(r.documents);
    return {
      id: r.id,
      vehicleId: r.vehicleId,
      vehicleName: r.vehicle
        ? `${r.vehicle.brand} ${r.vehicle.model}`
        : "Vehículo",
      vehicleImage: r.vehicle?.imageUrl ?? null,
      pickupDate: r.pickupDate,
      returnDate: r.returnDate,
      pickupLocation: r.pickupLocation,
      status: r.status as ReservationStatus,
      totalPriceEUR: r.totalPriceEurCents / 100,
      depositPaidEUR: r.depositEurCents / 100,
      balanceDueEUR: (r.totalPriceEurCents - r.depositEurCents) / 100,
      totalDays: r.totalDays,
      documents: docs,
      ...feats,
    };
  });

  const dashboardUser: DashboardUser = {
    fullName: user.fullName ?? (user.email?.split("@")[0] ?? "Usuario"),
    email: user.email ?? "",
    memberSince: user.memberSince ?? user.createdAt,
    totalTrips: reservations.filter((r) => r.status === "COMPLETED").length,
  };

  return (
    <DashboardClient
      user={dashboardUser}
      reservations={reservations}
      total={total}
      currentPage={currentPage}
      limit={limit}
    />
  );
}

