import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    // Validação das variáveis de ambiente
    if (!environment.supabase?.url || !environment.supabase?.key) {
      throw new Error('Supabase URL e Key são obrigatórios no environment');
    }

    // Para versões mais antigas do Supabase, usar configuração básica
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.key
    );

    // Log para debug (opcional)
    console.log('Supabase Client inicializado:', {
      url: environment.supabase.url,
      hasKey: !!environment.supabase.key
    });
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  // Método para verificar se o cliente está inicializado corretamente
  isInitialized(): boolean {
    return !!this.supabase;
  }

  // Método para obter a sessão atual (compatível com versões antigas)
  async getCurrentSession() {
    try {
      // Para versões antigas, session() retorna a sessão diretamente
      const session = await this.supabase.auth.session();
      return session;
    } catch (error) {
      console.error('Erro ao obter sessão:', error);
      return null;
    }
  }

  // Método para obter o usuário atual (compatível com versões antigas)
  async getCurrentUser() {
    try {
      const session = await this.getCurrentSession();
      return session?.user || null;
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      return null;
    }
  }

  // Método para verificar autenticação
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }

  // Método para fazer logout
  async signOut(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  }

  // Método para obter o ID do usuário atual (útil para agendamentos)
  async getCurrentUserId(): Promise<string | null> {
    const user = await this.getCurrentUser();
    return user?.id || null;
  }

  // Método para verificar se há erro na sessão
  async checkAuthHealth(): Promise<{ healthy: boolean; error?: string }> {
      const session = await this.getCurrentSession();
      if (!session) {
        return { healthy: false, error: 'Nenhuma sessão encontrada' };
      }

      // Verificar se o token está expirado
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        return { healthy: false, error: 'Sessão expirada' };
      }

      return { healthy: true };
  }
}
