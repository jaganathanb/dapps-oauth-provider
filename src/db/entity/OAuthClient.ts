import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class OAuthClient {
  @PrimaryGeneratedColumn('increment')
  public id!: number;

  @Column('uuid')
  public userId!: string;

  @Column()
  public clientId!: string;

  @Column()
  public clientSecret!: string;

  @Column()
  public callbackUrl!: string;

  @Column()
  public allowedScopes!: string;

  @Column({
    type: 'simple-enum',
    default: 'password',
    enum: ['authorization_code', 'refresh_token', 'password'],
  })
  public grants!: string[];
}
