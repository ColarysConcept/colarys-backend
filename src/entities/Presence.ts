// src/entities/Presence.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Agent } from "./Agent";

// src/entities/Presence.ts
@Entity("presence")
export class Presence {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Agent, (agent) => agent.presences)
  @JoinColumn({ name: "agent_id" })
  agent!: Agent;

  @Column({ type: "date", default: () => "CURRENT_DATE" })
  date!: string;

  @Column({ name: "heure_entree", type: "time" })
  heureEntree!: string;

  @Column({ name: "heure_sortie", type: "time", nullable: true })
  heureSortie!: string | null;

  // ✅ AJOUTER CES DEUX COLONNES
  @Column({ 
    name: "signature_entree", 
    type: "text", 
    nullable: true,
    comment: "Signature base64 ou SVG pour l'entrée"
  })
  signatureEntree!: string | null;

  @Column({ 
    name: "signature_sortie", 
    type: "text", 
    nullable: true,
    comment: "Signature base64 ou SVG pour la sortie"
  })
  signatureSortie!: string | null;

  @Column({ default: "JOUR" })
  shift!: string;

  @Column({ name: "heures_travaillees", type: "decimal", precision: 5, scale: 2, nullable: true })
  heuresTravaillees!: number | null;

  @Column({ name: "created_at", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}