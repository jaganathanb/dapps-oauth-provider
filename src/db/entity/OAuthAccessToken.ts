import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from './User';
import { OAuthClient } from './OAuthClient';

@Entity()
export class OAuthAccessToken {
  @PrimaryGeneratedColumn('increment')
  public id!: number;

  @Column('uuid')
  public userId!: string;

  @Column()
  public clientId!: string;

  @Column()
  public accessToken!: string;

  @Column({ type: 'datetime' })
  public accessTokenExpiresAt!: string;

  @Column()
  public scope!: string;

  @OneToOne(() => User)
  @JoinColumn()
  public user!: User;

  @OneToOne(() => OAuthClient)
  public client!: OAuthClient;
}
