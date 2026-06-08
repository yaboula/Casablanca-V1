import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "../users/user.entity";
import { Vehicle } from "../vehicles/vehicle.entity";
import { ReservationDocument } from "../documents/reservation-document.entity";

export enum ReservationStatus {
  /** Customer submitted booking, payment intent created but not yet captured */
  PENDING_DEPOSIT = "PENDING_DEPOSIT",

  /**
   * Documents approved by operator — BullMQ capture-stripe job queued.
   * Saga pattern: intermediate state between DB commit and Stripe capture.
   */
  AWAITING_CAPTURE = "AWAITING_CAPTURE",

  /** Stripe deposit captured — booking confirmed, QR generated */
  CONFIRMED = "CONFIRMED",

  /** Vehicle handed over to customer at airport */
  IN_PROGRESS = "IN_PROGRESS",

  /** Vehicle returned — rental complete */
  COMPLETED = "COMPLETED",

  /** Booking cancelled (before or during) */
  CANCELLED = "CANCELLED",
}

export enum PickupLocation {
  CMN_T1 = "CMN_T1",
  CMN_T2 = "CMN_T2",
}

@Entity("reservations")
export class Reservation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // ── Relations ──────────────────────────────────────────────

  @Index()
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @ManyToOne(() => User, {
    eager: false,
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Index()
  @Column({ name: "vehicle_id", type: "uuid" })
  vehicleId: string;

  @ManyToOne(() => Vehicle, {
    eager: true,
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "vehicle_id" })
  vehicle: Vehicle;

  // ── Dates ──────────────────────────────────────────────────

  @Column({ name: "pickup_date", type: "timestamptz" })
  pickupDate: Date;

  @Column({ name: "return_date", type: "timestamptz" })
  returnDate: Date;

  // ── Pricing (server-side — NEVER trusted from client) ─────

  /** Total rental days (computed here, not sent from frontend) */
  @Column({ name: "total_days", type: "integer" })
  totalDays: number;

  /** Total price in EUR cents (pricePerDay × totalDays) */
  @Column({ name: "total_price_eur_cents", type: "integer" })
  totalPriceEurCents: number;

  /** Fixed deposit — always 1000 (10 EUR) */
  @Column({ name: "deposit_eur_cents", type: "integer", default: 1000 })
  depositEurCents: number;

  // ── Pickup ─────────────────────────────────────────────────

  @Column({
    name: "pickup_location",
    type: "enum",
    enum: PickupLocation,
  })
  pickupLocation: PickupLocation;

  // ── Status ─────────────────────────────────────────────────

  @Index()
  @Column({
    type: "enum",
    enum: ReservationStatus,
    default: ReservationStatus.PENDING_DEPOSIT,
  })
  status: ReservationStatus;

  // ── Payment ────────────────────────────────────────────────

  /**
   * Stripe PaymentIntent ID — stored immediately after PI creation
   * so we can cancel/capture it later even if the app restarts.
   */
  @Column({ name: "stripe_payment_intent_id", type: "varchar", nullable: true })
  stripePaymentIntentId: string | null;

  @Column({ name: "stripe_client_secret", type: "varchar", nullable: true })
  stripeClientSecret: string | null;

  // ── QR ─────────────────────────────────────────────────────

  /**
   * HMAC-SHA256 hash — set when status transitions to CONFIRMED.
   * Required for QR code verification at check-in.
   */
  @Column({ name: "qr_code_hash", type: "varchar", nullable: true })
  qrCodeHash: string | null;

  // ── Customer info (optional enrichment) ───────────────────

  @Column({
    name: "customer_name",
    type: "varchar",
    nullable: true,
    length: 120,
  })
  customerName: string | null;

  @Column({
    name: "customer_phone",
    type: "varchar",
    nullable: true,
    length: 30,
  })
  customerPhone: string | null;

  @Column({
    name: "idempotency_key",
    type: "varchar",
    nullable: true,
    length: 100,
    select: false,
  })
  idempotencyKey: string | null;

  // ── Timestamps ─────────────────────────────────────────────

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // ── Documents (lazy — loaded explicitly when needed) ───────

  /** Uploaded documents for this reservation (passport, driving license). */
  @OneToMany(() => ReservationDocument, (doc) => doc.reservation, {
    eager: false,
    cascade: false,
  })
  documents: ReservationDocument[];
}
