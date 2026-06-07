import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

export type AuditAction = "APPROVE" | "REJECT";

/**
 * B3.3 — Immutable audit trail for document review decisions.
 *
 * Captures every approve/reject with: who, what, when, why (for rejections).
 * A document can appear multiple times if it was rejected, re-uploaded, then approved.
 *
 * ADR-005: Separate table rather than adding columns to reservation_documents,
 * because documents can be rejected → re-uploaded → approved (full history needed).
 */
@Entity("audit_logs")
@Index("idx_audit_document", ["documentId"])
@Index("idx_audit_operator", ["operatorId"])
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** Action taken by the operator */
  @Column({ type: "varchar" })
  action: AuditAction;

  /** FK → reservation_documents.id */
  @Column({ name: "document_id", type: "uuid" })
  documentId: string;

  /** FK → users.id (the operator who acted) */
  @Column({ name: "operator_id", type: "uuid" })
  operatorId: string;

  /** Populated only for REJECT actions */
  @Column({ type: "text", nullable: true })
  reason: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
