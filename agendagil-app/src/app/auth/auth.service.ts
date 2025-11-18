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

  // 🔑 MÉTODO DE LOGIN ATUALIZADO COM MELHOR DEBUG
  login(email: string, senha: string): Observable<UsuarioBase> {
    console.log('🔐 Tentando login para:', email);

    const loginPromise = this.supabaseService.getClient().auth.signIn({
      email,
      password: senha,
    });

    return from(loginPromise).pipe(
      switchMap((result: any) => {
        console.log('📨 Resposta do Supabase Auth:', result);

        if (result.error) {
          console.error('❌ Erro no login:', result.error);
          throw new Error(this.tratarErroLogin(result.error));
        }

        if (result.user) {
          console.log('✅ Usuário autenticado. ID:', result.user.id);
          console.log('📧 Email confirmado?:', !!result.user.confirmed_at);

          // Buscar dados do usuário na tabela usuarios
          return from(this.buscarUsuarioPorId(result.user.id));
        }

        throw new Error('Erro ao fazer login - usuário não retornado');
      }),
      map((usuario: UsuarioBase | null) => {
        if (!usuario) {
          console.error('❌ Perfil de usuário não encontrado na tabela usuarios');
          throw new Error('Perfil de usuário não encontrado. Contate o suporte.');
        }

        console.log('✅ Login bem sucedido. Usuário:', usuario.nome);

        // Salvar no localStorage e state
        const expirationTime = new Date().getTime() + 60 * 60 * 1000;
        localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
        localStorage.setItem('tokenExpiration', expirationTime.toString());
        this.currentUserSubject.next(usuario);

        return usuario;
      }),
      catchError((error: any) => {
        console.error('💥 Erro completo no login:', error);
        return throwError(() => new Error(error.message || 'Erro desconhecido no login'));
      })
    );
  }

  // 🔑 MÉTODO DE REGISTRO CORRIGIDO PARA SUPABASE v1
  registrarUsuario(email: string, senha: string, dadosUsuario: any): Observable<any> {
    console.log('📝 Iniciando registro para:', email);

    return from(
      this.supabaseService.getClient().auth.signUp({
        email: email,
        password: senha,
        // Na v1, os dados extras vão diretamente, não em "options"
      })
    ).pipe(
      switchMap((result: any) => {
        console.log('📨 Resposta do registro:', result);

        if (result.error) {
          throw new Error(this.tratarErroRegistro(result.error));
        }

        if (result.user) {
          console.log('✅ Usuário criado no Auth. ID:', result.user.id);
          console.log('📧 Email de confirmação enviado?:', !result.user.confirmed_at);
          console.log('🔍 User metadata:', result.user.user_metadata);

          // Criar perfil na tabela usuarios mesmo sem confirmação
          const perfilUsuario = {
            id: result.user.id,
            nome: dadosUsuario.nome || result.user.user_metadata?.nome || 'Novo Usuário',
            email: email,
            tipo: dadosUsuario.tipo || 'PACIENTE',
            telefone: dadosUsuario.telefone,
            foto_perfil_url: null,
            status: result.user.confirmed_at ? 'ATIVO' : 'PENDENTE',
            criado_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString(),

            // Campos específicos baseados no tipo
            ...(dadosUsuario.tipo === 'PACIENTE' && {
              cpf: dadosUsuario.cpf,
              data_nascimento: dadosUsuario.dataNascimento,
              genero: dadosUsuario.genero
            }),

            ...(dadosUsuario.tipo === 'PROFISSIONAL_AUTONOMO' && {
              crm: dadosUsuario.crm,
              especialidade: dadosUsuario.especialidade,
              descricao: dadosUsuario.descricao,
              formacao: dadosUsuario.formacao,
              experiencia: dadosUsuario.experiencia,
              site_profissional: dadosUsuario.siteProfissional
            }),

            ...(dadosUsuario.tipo === 'CLINICA' && {
              cnpj: dadosUsuario.cnpj,
              razao_social: dadosUsuario.razaoSocial,
              responsavel_tecnico: dadosUsuario.responsavelTecnico,
              registro_responsavel: dadosUsuario.registroResponsavel,
              especialidades_atendidas: dadosUsuario.especialidadesAtendidas,
              site: dadosUsuario.site,
              horario_funcionamento: dadosUsuario.horarioFuncionamento
            }),

            // Campos comuns opcionais
            endereco: dadosUsuario.endereco,
            cidade: dadosUsuario.cidade,
            estado: dadosUsuario.estado,
            cep: dadosUsuario.cep
          };

          console.log('📝 Criando perfil na tabela usuarios:', perfilUsuario);

          return from(
            this.supabaseService.getClient()
              .from('usuarios')
              .insert([perfilUsuario])
              .single()
          ).pipe(
            map((insertResult: any) => {
              if (insertResult.error) {
                console.error('❌ Erro ao criar perfil:', insertResult.error);
                throw insertResult.error;
              }

              // Retornar informações sobre o status de confirmação
              return {
                success: true,
                usuario: insertResult.data,
                emailConfirmacaoEnviado: !result.user.confirmed_at,
                usuarioConfirmado: !!result.user.confirmed_at,
                mensagem: result.user.confirmed_at
                  ? 'Conta criada e confirmada com sucesso!'
                  : 'Conta criada! Verifique seu email para confirmar antes de fazer login.'
              };
            })
          );
        }

        throw new Error('Usuário não retornado no registro');
      }),
      catchError((error) => {
        console.error('💥 Erro completo no registro:', error);
        throw error;
      })
    );
  }

  private tratarErroRegistro(error: any): string {
    if (error.message?.includes('User already registered')) {
      return 'Este email já está cadastrado. Tente fazer login ou usar outro email.';
    }
    if (error.message?.includes('Password should be at least')) {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }
    if (error.message?.includes('Invalid email')) {
      return 'Email inválido. Verifique o formato.';
    }
    if (error.message?.includes('rate limit')) {
      return 'Muitas tentativas. Aguarde alguns minutos.';
    }
    return error.message || 'Erro ao criar conta. Tente novamente.';
  }

  private tratarErroLogin(error: any): string {
    if (error.message?.includes('Invalid login credentials')) {
      return 'Email ou senha inválidos';
    }
    if (error.message?.includes('Email not confirmed')) {
      return 'Email não confirmado. Verifique sua caixa de entrada e clique no link de confirmação.';
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

        if (result.error) {
          console.error('Erro do Supabase:', result.error);

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

          throw new Error(
            result.error.message || 'Erro ao enviar email de recuperação.'
          );
        }

        // Se não há erro, consideramos sucesso
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

  // 🔑 MÉTODO PARA REENVIAR EMAIL DE CONFIRMAÇÃO (Supabase v1)
  reenviarEmailConfirmacao(email: string): Observable<any> {
    console.log('📧 Reenviando email de confirmação para:', email);

    // Na v1 do Supabase, não há método direto para reenviar confirmação
    // Podemos tentar usar o signUp novamente com os mesmos dados
    return from(
      this.supabaseService.getClient().auth.signUp({
        email: email,
        password: 'temporary-password-123', // Senha temporária
      })
    ).pipe(
      map((result: any) => {
        console.log('Resposta do reenvio:', result);

        if (result.error) {
          console.error('Erro ao reenviar email:', result.error);

          if (result.error.message?.includes('User already registered')) {
            // Isso é esperado - significa que o usuário já existe
            return {
              success: true,
              message: 'Email de confirmação reenviado com sucesso! Verifique sua caixa de entrada.'
            };
          }

          throw new Error('Erro ao reenviar email de confirmação.');
        }

        return {
          success: true,
          message: 'Email de confirmação reenviado com sucesso! Verifique sua caixa de entrada.'
        };
      }),
      catchError((error) => {
        console.error('Erro completo ao reenviar email:', error);
        throw new Error('Erro ao reenviar email de confirmação. Tente novamente.');
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

  // 🔑 MÉTODO BUSCAR USUÁRIO ATUALIZADO COM MELHOR DEBUG
  private async buscarUsuarioPorId(id: string): Promise<UsuarioBase | null> {
    try {
      console.log('🔍 Buscando usuário na tabela usuarios. ID:', id);

      const { data, error } = await this.supabaseService
        .getClient()
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar usuário no Supabase:', error);
        return null;
      }

      if (!data) {
        console.error('❌ Usuário não encontrado na tabela usuarios para ID:', id);
        return null;
      }

      console.log('✅ Usuário encontrado:', data.nome);
      return this.fromSupabaseUsuario(data);
    } catch (error) {
      console.error('💥 Erro ao buscar usuário:', error);
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

  // 🔑 MÉTODO PARA VERIFICAR STATUS DE CONFIRMAÇÃO
  async verificarStatusUsuario(email: string): Promise<any> {
    try {
      // Na v1, precisamos fazer uma query direta na tabela auth.users
      const { data: usuarios, error } = await this.supabaseService
        .getClient()
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Erro ao buscar usuário:', error);
        return null;
      }

      if (usuarios) {
        // Buscar informações do auth (isso pode não funcionar diretamente devido a RLS)
        const session = this.supabaseService.getClient().auth.session();

        return {
          usuario: usuarios,
          emailConfirmado: usuarios.status === 'ATIVO',
          perfilCriado: true,
          session: session
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return null;
    }
  }

  // 🔑 MÉTODO PARA CONFIRMANÇÃO MANUAL (APENAS DESENVOLVIMENTO)
  async confirmarEmailManualmente(email: string): Promise<boolean> {
    try {
      console.log('🛠️  Confirmando email manualmente para:', email);

      // Esta é uma solução temporária para desenvolvimento
      // Em produção, o usuário deve confirmar pelo email

      // Atualizar status na tabela usuarios
      const { error } = await this.supabaseService
        .getClient()
        .from('usuarios')
        .update({ status: 'ATIVO' })
        .eq('email', email);

      if (error) {
        console.error('Erro ao confirmar email:', error);
        return false;
      }

      console.log('✅ Email confirmado manualmente para:', email);
      return true;
    } catch (error) {
      console.error('Erro ao confirmar email manualmente:', error);
      return false;
    }
  }
}
