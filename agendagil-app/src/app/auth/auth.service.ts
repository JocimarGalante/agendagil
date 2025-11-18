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
      password: senha,
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
        return throwError(
          () => new Error(error.message || 'Erro desconhecido no login')
        );
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
    const redirectTo = 'https://agendagil.vercel.app/reset-senha';

    console.log('Enviando email de recuperação para:', email);
    console.log('URL de redirecionamento:', redirectTo);

    return from(
      this.supabaseService.getClient().auth.api.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      })
    ).pipe(
      map((result: any) => {
        console.log('Resposta completa do reset password:', result);

        // Na v1 do Supabase, o comportamento pode variar
        // Vamos verificar diferentes cenários de resposta

        if (result.error) {
          console.error('Erro do Supabase:', result.error);

          // Tratamento específico de erros
          if (
            result.error.message?.includes('rate limit') ||
            result.error.code === 'rate_limit_exceeded'
          ) {
            throw new Error('Muitas tentativas. Aguarde alguns minutos.');
          }
          if (
            result.error.message?.includes('email not found') ||
            result.error.message?.includes('user not found') ||
            result.error.code === 'user_not_found'
          ) {
            throw new Error('Email não encontrado.');
          }
          if (
            result.error.message?.includes('email not confirmed') ||
            result.error.code === 'email_not_confirmed'
          ) {
            throw new Error(
              'Email não confirmado. Verifique sua caixa de entrada.'
            );
          }

          // Erro genérico
          throw new Error(
            result.error.message || 'Erro ao enviar email de recuperação.'
          );
        }

        // Se não há erro, consideramos sucesso
        // Na v1, pode retornar data nula ou vazia em caso de sucesso
        if (result.data === null || result.data === undefined) {
          return {
            success: true,
            message:
              'Email de recuperação enviado com sucesso. Verifique sua caixa de entrada.',
          };
        }

        return {
          success: true,
          message: 'Email de recuperação enviado com sucesso.',
          data: result.data,
        };
      }),
      catchError((error) => {
        console.error('Erro completo ao enviar email:', error);

        // Tratamento de erros de rede ou outros
        let errorMessage =
          'Erro ao enviar email de recuperação. Tente novamente.';

        if (
          error.message?.includes('JSON') ||
          error.message?.includes('Network Error')
        ) {
          errorMessage =
            'Erro de conexão. Verifique sua internet e tente novamente.';
        } else if (error.message?.includes('Failed to fetch')) {
          errorMessage =
            'Erro de servidor. Tente novamente em alguns instantes.';
        }

        throw new Error(errorMessage);
      })
    );
  }

  // Método para atualizar senha quando o usuário recebe o link
  updatePassword(newPassword: string): Observable<any> {
    return from(
      this.supabaseService.getClient().auth.update({
        password: newPassword,
      })
    ).pipe(
      map((result: any) => {
        if (result.error) {
          throw result.error;
        }

        // Logout após alterar senha para forçar novo login
        this.supabaseService.getClient().auth.signOut();

        return { success: true, message: 'Senha atualizada com sucesso' };
      }),
      catchError((error) => {
        console.error('Erro ao atualizar senha:', error);
        throw error;
      })
    );
  }

  // Método melhorado para verificar sessão de recuperação
  hasPasswordRecoverySession(): Observable<boolean> {
    return new Observable((observer) => {
      try {
        const session = this.supabaseService.getClient().auth.session();

        // Verificar se há uma sessão válida
        const hasValidSession = !!session && !!session.access_token;

        observer.next(hasValidSession);
        observer.complete();
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        observer.next(false);
        observer.complete();
      }
    });
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
      const { data, error } = await this.supabaseService
        .getClient()
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
      const { data, error } = await this.supabaseService
        .getClient()
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
      cep: usuario.cep,
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
      hash = (hash << 5) - hash + char;
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
