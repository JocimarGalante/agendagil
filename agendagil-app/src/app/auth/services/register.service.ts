// src/app/auth/register.service.ts
import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { TipoUsuario } from '@models/usuario/tipo-usuario.enum';
import { UsuarioBase } from '@models/usuario/usuario-base.model';
import { SupabaseService } from 'core/services/supabase.service';

@Injectable({
  providedIn: 'root',
})
export class RegisterService {

  constructor(private supabaseService: SupabaseService) {}

  registrarUsuario(dados: UsuarioBase, tipoUsuario: TipoUsuario, senha: string): Observable<UsuarioBase> {
    // Primeiro cria o usuário no auth do Supabase
    return from(
      this.supabaseService.getClient().auth.signUp({
        email: dados.email,
        password: senha,
      })
    ).pipe(
      switchMap((result: any) => {
        if (result.error) throw new Error(result.error.message);

        if (result.user) {
          // Depois cria o perfil do usuário na tabela usuarios
          return this.criarPerfilUsuario(result.user.id, dados, tipoUsuario);
        }
        throw new Error('Erro ao criar usuário');
      }),
      catchError((error: any) => {
        throw new Error(error.message || 'Erro no cadastro');
      })
    );
  }

  private criarPerfilUsuario(userId: string, dados: UsuarioBase, tipoUsuario: TipoUsuario): Observable<UsuarioBase> {
    // Converte UUID para número (para manter compatibilidade com seus models)
    const numericId = this.parseId(userId);

    const usuarioCompleto: UsuarioBase = {
      ...dados,
      id: numericId.toString(),
      tipo: tipoUsuario,
      status: 'ativo',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };

    // Converte para o formato do Supabase
    const usuarioSupabase = this.toSupabaseUsuario(usuarioCompleto);
    usuarioSupabase.id = userId; // Mantém o UUID original

    return from(
      this.supabaseService.getClient()
        .from('usuarios')
        .insert([usuarioSupabase])
        .select()
        .single()
    ).pipe(
      map((result: any) => {
        if (result.error) throw new Error(result.error.message);
        return this.fromSupabaseUsuario(result.data);
      })
    );
  }

  // Métodos de conversão
  private fromSupabaseUsuario(usuario: any): UsuarioBase {
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

    // Adiciona campos específicos baseados no tipo
    switch (usuario.tipo) {
      case TipoUsuario.PACIENTE:
        base.cpf = usuario.cpf;
        base.dataNascimento = usuario.data_nascimento;
        base.genero = usuario.genero;
        break;

      case TipoUsuario.PROFISSIONAL_AUTONOMO:
        base.crm = usuario.crm;
        base.especialidade = usuario.especialidade;
        base.cpf = usuario.cpf;
        base.descricao = usuario.descricao;
        base.formacao = usuario.formacao;
        base.experiencia = usuario.experiencia;
        base.siteProfissional = usuario.site_profissional;
        break;

      case TipoUsuario.CLINICA:
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

  private toSupabaseUsuario(usuario: UsuarioBase): any {
    const base: any = {
      id: usuario.id.toString(),
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
      telefone: usuario.telefone,
      foto_perfil_url: usuario.fotoPerfilUrl,
      criado_em: usuario.criadoEm,
      atualizado_em: usuario.atualizadoEm,
      status: usuario.status,
      endereco: usuario.endereco,
      cidade: usuario.cidade,
      estado: usuario.estado,
      cep: usuario.cep
    };

    // Adiciona campos específicos
    const usuarioAny = usuario as any;
    if (usuarioAny.cpf) base.cpf = usuarioAny.cpf;
    if (usuarioAny.dataNascimento) base.data_nascimento = usuarioAny.dataNascimento;
    if (usuarioAny.genero) base.genero = usuarioAny.genero;
    if (usuarioAny.crm) base.crm = usuarioAny.crm;
    if (usuarioAny.especialidade) base.especialidade = usuarioAny.especialidade;
    if (usuarioAny.descricao) base.descricao = usuarioAny.descricao;
    if (usuarioAny.formacao) base.formacao = usuarioAny.formacao;
    if (usuarioAny.experiencia) base.experiencia = usuarioAny.experiencia;
    if (usuarioAny.siteProfissional) base.site_profissional = usuarioAny.siteProfissional;
    if (usuarioAny.cnpj) base.cnpj = usuarioAny.cnpj;
    if (usuarioAny.razaoSocial) base.razao_social = usuarioAny.razaoSocial;
    if (usuarioAny.responsavelTecnico) base.responsavel_tecnico = usuarioAny.responsavelTecnico;
    if (usuarioAny.registroResponsavel) base.registro_responsavel = usuarioAny.registroResponsavel;
    if (usuarioAny.especialidadesAtendidas) base.especialidades_atendidas = usuarioAny.especialidadesAtendidas;
    if (usuarioAny.site) base.site = usuarioAny.site;
    if (usuarioAny.horarioFuncionamento) base.horario_funcionamento = usuarioAny.horarioFuncionamento;

    return base;
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
}
