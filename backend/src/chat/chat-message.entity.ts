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

export type ChatSender = 'user' | 'operator' | 'system';
export type ChatMessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { eager: false, nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ name: 'reservation_id', type: 'uuid', nullable: true })
  reservationId: string | null;

  @ManyToOne(() => Reservation, { eager: false, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation | null;

  @Column({ type: 'text' })
  text: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'user',
  })
  sender: ChatSender;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'sent',
  })
  status: ChatMessageStatus;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;
}
