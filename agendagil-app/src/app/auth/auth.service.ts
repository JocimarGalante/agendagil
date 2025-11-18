import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SupabaseService } from '../core/services/supabase.service';
import { UsuarioBase } from '@models/usuario/usuario-base.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UsuarioBase | null>(
    JSON.parse(localStorage.getItem('usuarioLogado') || 'null')
  );
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.carregarUsuario();
  }

  private async carregarUsuario() {
    try {
      const session = await this.supabaseService.getClient().auth.session();

      if (session?.user) {
        const usuario = await this.buscarUsuarioPorId(session.user.id);
        if (usuario) {
          this.currentUserSubject.next(usuario);
          localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    }
  }

  login(email: string, senha: string): Observable<UsuarioBase> {
    const loginPromise = this.supabaseService.getClient().auth.signIn({
      email,
      password: senha
    });

    return from(loginPromise).pipe(
      switchMap((result: any) => {
        if (result.error) {
          throw new Error(this.tratarErroLogin(result.error));
        }

        if (result.data.user) {
          return from(this.buscarUsuarioPorId(result.data.user.id));
        }
        throw new Error('Erro ao fazer login - usuário não retornado');
      }),
      map((usuario: UsuarioBase | null) => {
        if (!usuario) {
          throw new Error('Perfil de usuário não encontrado na base de dados');
        }

        const expirationTime = new Date().getTime() + 60 * 60 * 1000;
        localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
        localStorage.setItem('tokenExpiration', expirationTime.toString());
        this.currentUserSubject.next(usuario);

        return usuario;
      }),
      catchError((error: any) => {
        console.error('Erro completo no login:', error);
        return throwError(() => new Error(error.message || 'Erro desconhecido no login'));
      })
    );
  }

  private tratarErroLogin(error: any): string {
    if (error.message?.includes('Invalid login credentials')) {
      return 'Email ou senha inválidos';
    }
    if (error.message?.includes('Email not confirmed')) {
      return 'Email não confirmado. Verifique sua caixa de entrada.';
    }
    if (error.message?.includes('Too many requests')) {
      return 'Muitas tentativas de login. Tente novamente em alguns minutos.';
    }
    if (error.message?.includes('User not found')) {
      return 'Usuário não encontrado. Verifique o email digitado.';
    }
    return error.message || 'Erro ao fazer login. Tente novamente.';
  }

  // MÉTODOS DE RESET DE SENHA
  resetPassword(email: string): Observable<any> {
    return from(
      this.supabaseService.getClient().auth.api.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
    ).pipe(
      map((result: any) => {
        if (result.error) {
          throw result.error;
        }
        return result;
      }),
      catchError((error) => {
        console.error('Erro ao enviar email de recuperação:', error);
        throw error;
      })
    );
  }

  updatePassword(newPassword: string): Observable<any> {
    return from(
      this.supabaseService.getClient().auth.update({
        password: newPassword
      })
    ).pipe(
      map((result) => {
        if (result.error) {
          throw result.error;
        }
        return result;
      }),
      catchError((error) => {
        console.error('Erro ao atualizar senha:', error);
        throw error;
      })
    );
  }

  hasPasswordRecoverySession(): Observable<boolean> {
    return from(Promise.resolve(this.supabaseService.getClient().auth.session())).pipe(
      map((session: any) => {
        return !!session;
      })
    );
  }

  // Método para verificar se o usuário está autenticado via Supabase
  async isAuthenticated(): Promise<boolean> {
    try {
      const session = await this.supabaseService.getClient().auth.session();
      return !!session;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
  }

  logout(): void {
    this.supabaseService.getClient().auth.signOut();
    this.currentUserSubject.next(null);
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('tokenExpiration');
    this.router.navigate(['/login']);
  }

  getUsuarioLogado(): UsuarioBase | null {
    const expiration = localStorage.getItem('tokenExpiration');
    const now = new Date().getTime();

    if (expiration && now > parseInt(expiration)) {
      this.logout();
      return null;
    }

    return this.currentUserSubject.value;
  }

  isLogado(): boolean {
    return !!this.currentUserSubject.value;
  }

  private async buscarUsuarioPorId(id: string): Promise<UsuarioBase | null> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar usuário no Supabase:', error);
        return null;
      }

      if (!data) {
        console.error('Usuário não encontrado na tabela usuarios');
        return null;
      }

      return this.fromSupabaseUsuario(data);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  }

  // Método para debug - verificar todos os usuários
  async debugUsuarios(): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('usuarios')
        .select('*');

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        return;
      }

      console.log('Usuários no banco:', data);
    } catch (error) {
      console.error('Erro no debug:', error);
    }
  }

  async verificarSessao(): Promise<void> {
    try {
      const session = await this.supabaseService.getClient().auth.session();
      console.log('Sessão atual:', session);
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
    }
  }

  private fromSupabaseUsuario(usuario: any): UsuarioBase {
    if (!usuario) return null as any;

    const base: any = {
      id: this.parseId(usuario.id),
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
      telefone: usuario.telefone,
      fotoPerfilUrl: usuario.foto_perfil_url,
      criadoEm: usuario.criado_em,
      atualizadoEm: usuario.atualizado_em,
      status: usuario.status,
      endereco: usuario.endereco,
      cidade: usuario.cidade,
      estado: usuario.estado,
      cep: usuario.cep
    };

    switch (usuario.tipo) {
      case 'PACIENTE':
        base.cpf = usuario.cpf;
        base.dataNascimento = usuario.data_nascimento;
        base.genero = usuario.genero;
        break;

      case 'PROFISSIONAL_AUTONOMO':
        base.crm = usuario.crm;
        base.especialidade = usuario.especialidade;
        base.cpf = usuario.cpf;
        base.descricao = usuario.descricao;
        base.formacao = usuario.formacao;
        base.experiencia = usuario.experiencia;
        base.siteProfissional = usuario.site_profissional;
        break;

      case 'CLINICA':
        base.cnpj = usuario.cnpj;
        base.razaoSocial = usuario.razao_social;
        base.responsavelTecnico = usuario.responsavel_tecnico;
        base.registroResponsavel = usuario.registro_responsavel;
        base.especialidadesAtendidas = usuario.especialidades_atendidas;
        base.site = usuario.site;
        base.descricao = usuario.descricao;
        base.horarioFuncionamento = usuario.horario_funcionamento;
        break;
    }

    return base as UsuarioBase;
  }

  private parseId(id: string): number {
    if (!id) return 0;
    if (!isNaN(Number(id))) return Number(id);

    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Método para obter o usuário atual do Supabase (útil para componentes)
  async getCurrentSupabaseUser() {
    const session = this.supabaseService.getClient().auth.session();
    return session?.user || null;
  }

  // Método para verificar se há uma sessão ativa
  async getCurrentSession() {
    const session = await this.supabaseService.getClient().auth.session();

    return session;
  }
}
