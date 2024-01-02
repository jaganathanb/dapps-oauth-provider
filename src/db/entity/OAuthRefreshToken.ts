import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { OAuthClient } from './OAuthClient';
import { User } from './User';

@Entity()
export class OAuthRefreshToken {
  @PrimaryGeneratedColumn('increment')
  public id!: number;

  @Column('uuid')
  public userId!: string;

  @Column()
  public clientId!: string;

  @Column()
  public refreshToken!: string;

  @Column({ type: 'datetime' })
  public refreshTokenExpiresAt!: string;

  @Column()
  public scope!: string;

  @OneToOne(() => User)
  @JoinColumn()
  public user!: User;

  @OneToOne(() => OAuthClient)
  public client!: OAuthClient;
}
