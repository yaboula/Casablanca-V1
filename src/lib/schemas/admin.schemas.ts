/**
 * F2.1 — Runtime Zod schemas for admin API responses.
 *
 * These schemas validate the shape of data returned by the NestJS backend
 * at runtime. Use with safeFetch() from @/lib/safe-fetch.
 */
import { z } from "zod";

// ── Admin Stats ────────────────────────────────────────────────

export const AdminStatsKpiSchema = z.object({
  totalRevenueEurCents: z.number(),
  totalBookings: z.number(),
  activeUsers: z.number(),
  activeVehicles: z.number(),
});

export const AdminStatsSchema = z.object({
  kpi: AdminStatsKpiSchema,
  bookingsByStatus: z.array(
    z.object({
      status: z.string(),
      count: z.number(),
    }),
  ),
  weeklyTrend: z.array(
    z.object({
      week: z.string(),
      bookings: z.number(),
      revenueEurCents: z.number(),
    }),
  ),
  topVehicles: z.array(
    z.object({
      id: z.string().uuid(),
      brand: z.string(),
      model: z.string(),
      category: z.string(),
      bookings: z.number(),
    }),
  ),
});

// ── Admin Users (paginated list) ───────────────────────────────

export const AdminUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  phoneNumber: z.string(),
  role: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const AdminUsersResponseSchema = z.object({
  data: z.array(AdminUserSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

// ── Admin Vehicles (paginated list) ───────────────────────────

export const AdminVehicleSchema = z.object({
  id: z.string().uuid(),
  brand: z.string(),
  model: z.string(),
  category: z.string(),
  licensePlate: z.string(),
  status: z.string(),
  pricePerDayEurCents: z.number(),
  imageUrl: z.string().nullable().optional(),
  isActive: z.boolean(),
});

export const AdminVehiclesResponseSchema = z.object({
  data: z.array(AdminVehicleSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

// ── Inferred TypeScript types ──────────────────────────────────

export type AdminStatsFromSchema = z.infer<typeof AdminStatsSchema>;
export type AdminUserFromSchema = z.infer<typeof AdminUserSchema>;
export type AdminVehicleFromSchema = z.infer<typeof AdminVehicleSchema>;
