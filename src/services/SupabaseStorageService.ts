// src/services/SupabaseStorageService.ts
import { createClient } from '@supabase/supabase-js';

export class SupabaseStorageService {
  private supabase;
  private supabaseAdmin; // Pour les opérations serveur

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Client admin pour les uploads/suppressions
    this.supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  // Uploader une image
  async uploadAgentImage(fileBuffer: Buffer, matricule: string, contentType: string = 'image/jpeg') {
    try {
      const fileName = `${matricule}-${Date.now()}.jpg`;
      const filePath = `agent-photos/${fileName}`;

      console.log(`📤 Uploading image for agent ${matricule}...`);

      const { data, error } = await this.supabaseAdmin.storage
        .from('agents') // Le bucket doit s'appeler "agents"
        .upload(filePath, fileBuffer, {
          contentType,
          upsert: true
        });

      if (error) {
        console.error('❌ Supabase upload error:', error);
        throw new Error(`Erreur upload: ${error.message}`);
      }

      // Obtenir l'URL publique
      const { data: urlData } = this.supabase.storage
        .from('agents')
        .getPublicUrl(filePath);

      console.log(`✅ Image uploaded successfully: ${urlData.publicUrl}`);

      return {
        url: urlData.publicUrl,
        filePath: filePath
      };

    } catch (error) {
      console.error('❌ SupabaseStorageService upload error:', error);
      throw error;
    }
  }

  // Supprimer une image
  async deleteAgentImage(filePath: string) {
    try {
      if (!filePath) return;

      const { error } = await this.supabaseAdmin.storage
        .from('agents')
        .remove([filePath]);

      if (error) {
        console.warn('⚠️ Could not delete image:', error);
      } else {
        console.log(`✅ Image deleted: ${filePath}`);
      }
    } catch (error) {
      console.warn('⚠️ Error deleting image:', error);
    }
  }

  // Obtenir l'URL d'une image
  getAgentImageUrl(filePath: string) {
    if (!filePath) return null;
    
    const { data } = this.supabase.storage
      .from('agents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
}