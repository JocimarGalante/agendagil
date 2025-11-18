import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    if (!environment.supabase?.url || !environment.supabase?.key) {
      throw new Error('Supabase URL e Key são obrigatórios no environment');
    }

    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.key
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  isInitialized(): boolean {
    return !!this.supabase;
  }

  async getCurrentSession() {
    try {
      const session = await this.supabase.auth.session();
      return session;
    } catch (error) {
      console.error('Erro ao obter sessão:', error);
      return null;
    }
  }

  async getCurrentUser() {
    try {
      const session = await this.getCurrentSession();
      return session?.user || null;
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  }

  async getCurrentUserId(): Promise<string | null> {
    const user = await this.getCurrentUser();
    return user?.id || null;
  }

  async checkAuthHealth(): Promise<{ healthy: boolean; error?: string }> {
      const session = await this.getCurrentSession();
      if (!session) {
        return { healthy: false, error: 'Nenhuma sessão encontrada' };
      }

      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        return { healthy: false, error: 'Sessão expirada' };
      }

      return { healthy: true };
  }
}
