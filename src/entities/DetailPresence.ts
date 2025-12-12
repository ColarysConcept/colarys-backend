import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { Presence } from "./Presence";

@Entity("detail_presence")
export class DetailPresence {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", nullable: true })
  observations!: string;

  @OneToOne(() => Presence, (presence) => presence.details, { onDelete: "CASCADE" })
  @JoinColumn({ name: "presence_id" })
  presence!: Presence;
}