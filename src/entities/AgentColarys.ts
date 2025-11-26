import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("agents_colarys")
export class AgentColarys {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 50, unique: true })
  matricule!: string;

  @Column({ type: "varchar", length: 100 })
  nom!: string;

  @Column({ type: "varchar", length: 100 })
  prenom!: string;

  @Column({ type: "varchar", length: 100 })
  role!: string;

  @Column({ type: "varchar", nullable: true })
  image!: string;

  // 🔥 NOUVEAU CHAMP POUR STOCKER L'ID PUBLIC CLOUDINARY
  @Column({ type: "varchar", nullable: true })
  imagePublicId!: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  contact!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  mail!: string;

  @Column({ type: "varchar", length: 100, default: "Colarys Concept" })
  entreprise!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  getNomComplet(): string {
    return `${this.nom} ${this.prenom}`;
  }

  // 🔥 METHODE POUR OBTENIR L'URL DE L'IMAGE (AVEC FALLBACK)
  getDisplayImage(): string {
    if (this.image && !this.image.includes('default-avatar')) {
      return this.image; // URL Cloudinary réelle
    }
    return '/images/default-avatar.svg'; // Image par défaut seulement si pas d'image
  }

   hasDefaultImage(): boolean {
    return !this.image || this.image.includes('default-avatar');
  }
}