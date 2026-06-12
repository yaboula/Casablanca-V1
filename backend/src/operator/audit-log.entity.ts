import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

export type AuditAction =
  | "APPROVE"
  | "REJECT"
  | "QR_SCAN_SUCCESS"
  | "QR_SCAN_FAILURE"
  | "MANUAL_CHECKIN"
  | "DELIVERY_COMPLETED"
  | "DELIVERY_COMPLETION_FAILED";

export type AuditResourceType = "DOCUMENT" | "RESERVATION";

@Entity("audit_logs")
@Index("idx_audit_document", ["documentId"])
@Index("idx_audit_reservation", ["reservationId"])
@Index("idx_audit_operator", ["operatorId"])
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  action: AuditAction;

  @Column({ name: "resource_type", type: "varchar", default: "DOCUMENT" })
  resourceType: AuditResourceType;

  @Column({ name: "document_id", type: "uuid", nullable: true })
  documentId: string | null;

  @Column({ name: "reservation_id", type: "uuid", nullable: true })
  reservationId: string | null;

  @Column({ name: "operator_id", type: "uuid" })
  operatorId: string;

  @Column({ name: "before_status", type: "varchar", nullable: true })
  beforeStatus: string | null;

  @Column({ name: "after_status", type: "varchar", nullable: true })
  afterStatus: string | null;

  @Column({ type: "text", nullable: true })
  reason: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
