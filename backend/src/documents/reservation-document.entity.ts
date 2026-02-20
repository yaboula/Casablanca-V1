import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Reservation } from '../reservations/reservation.entity';

export enum DocumentType {
  PASSPORT = 'PASSPORT',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
}

export enum DocumentStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('reservation_documents')
export class ReservationDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { eager: false, nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ name: 'reservation_id', type: 'uuid' })
  reservationId: string;

  @ManyToOne(() => Reservation, { eager: false, nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @Column({ type: 'enum', enum: DocumentType })
  type: DocumentType;

  /**
   * S3 object key — NEVER the full URL.
   * URLs are generated as presigned on every read (expire in 5 min).
   * e.g. "docs/userId/reservationId/PASSPORT-1708300000000.jpg"
   */
  @Column({ name: 'file_key', length: 500 })
  fileKey: string;

  @Index()
  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING_REVIEW,
  })
  status: DocumentStatus;

  @Column({ name: 'rejection_reason', type: 'varchar', length: 300, nullable: true })
  rejectionReason: string | null;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
