// src/app/core/helpers/model-converters.ts
import { UsuarioBase } from '@models/usuario/usuario-base.model';
import { TipoUsuario } from '@models/usuario/tipo-usuario.enum';
import { Consulta } from '@models/consulta.model';
import { Especialidade, Medico, Agendamento } from '@models/agendamento.model';

// Interfaces para o Supabase
export interface UsuarioSupabase {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  tipo: string;
  telefone?: string;
  foto_perfil_url?: string;
  criado_em?: string;
  atualizado_em?: string;
  status?: 'ativo' | 'inativo' | 'pendente';
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;

  // Campos específicos
  cpf?: string;
  data_nascimento?: string;
  genero?: string;
  crm?: string;
  especialidade?: string;
  descricao?: string;
  formacao?: string;
  experiencia?: string;
  site_profissional?: string;
  cnpj?: string;
  razao_social?: string;
  responsavel_tecnico?: string;
  registro_responsavel?: string;
  especialidades_atendidas?: string[];
  site?: string;
  horario_funcionamento?: string;
}

export interface ConsultaSupabase {
  id: string;
  paciente: string;
  paciente_id: string;
  medico: string;
  medico_id: string;
  especialidade: string;
  especialidade_id: string;
  local: string;
  data: string;
  hora: string;
  status: number;
  criado_em?: string;
  atualizado_em?: string;
}

export interface EspecialidadeSupabase {
  id: string;
  nome: string;
  criado_em?: string;
}

export interface MedicoSupabase {
  id: string;
  nome: string;
  especialidade_id: string;
  crm: string;
  local: string;
  criado_em?: string;
}

export class ModelConverter {
  // Conversão de Usuário
  static fromSupabaseUsuario(usuario: UsuarioSupabase): UsuarioBase {
    const base: any = {
      id: usuario.id, // Manter como string
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

  static toSupabaseUsuario(usuario: UsuarioBase): UsuarioSupabase {
    const base: any = {
      id: usuario.id,
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
      cep: usuario.cep,
    };

    // Adiciona campos específicos
    const usuarioAny = usuario as any;
    if (usuarioAny.cpf) base.cpf = usuarioAny.cpf;
    if (usuarioAny.dataNascimento)
      base.data_nascimento = usuarioAny.dataNascimento;
    if (usuarioAny.genero) base.genero = usuarioAny.genero;
    if (usuarioAny.crm) base.crm = usuarioAny.crm;
    if (usuarioAny.especialidade) base.especialidade = usuarioAny.especialidade;
    if (usuarioAny.descricao) base.descricao = usuarioAny.descricao;
    if (usuarioAny.formacao) base.formacao = usuarioAny.formacao;
    if (usuarioAny.experiencia) base.experiencia = usuarioAny.experiencia;
    if (usuarioAny.siteProfissional)
      base.site_profissional = usuarioAny.siteProfissional;
    if (usuarioAny.cnpj) base.cnpj = usuarioAny.cnpj;
    if (usuarioAny.razaoSocial) base.razao_social = usuarioAny.razaoSocial;
    if (usuarioAny.responsavelTecnico)
      base.responsavel_tecnico = usuarioAny.responsavelTecnico;
    if (usuarioAny.registroResponsavel)
      base.registro_responsavel = usuarioAny.registroResponsavel;
    if (usuarioAny.especialidadesAtendidas)
      base.especialidades_atendidas = usuarioAny.especialidadesAtendidas;
    if (usuarioAny.site) base.site = usuarioAny.site;
    if (usuarioAny.horarioFuncionamento)
      base.horario_funcionamento = usuarioAny.horarioFuncionamento;

    return base as UsuarioSupabase;
  }

  // Conversão de Consulta - AGORA COM STRINGS
  static fromSupabaseConsulta(consulta: ConsultaSupabase): Consulta {
    return {
      id: consulta.id, // Já é string
      paciente: consulta.paciente,
      medico: consulta.medico,
      especialidade: consulta.especialidade,
      local: consulta.local,
      data: consulta.data,
      hora: consulta.hora,
      status: consulta.status,
    } as Consulta;
  }

  static toSupabaseConsulta(consulta: Consulta): ConsultaSupabase {
    return {
      id: consulta.id || '',
      paciente: consulta.paciente,
      paciente_id: '', // Será preenchido pelo service
      medico: consulta.medico,
      medico_id: '', // Será preenchido pelo service
      especialidade: consulta.especialidade,
      especialidade_id: '', // Será preenchido pelo service
      local: consulta.local,
      data: consulta.data,
      hora: consulta.hora,
      status: consulta.status,
    } as ConsultaSupabase;
  }

  // Conversão de Agendamento - AGORA COM STRINGS
  static fromSupabaseAgendamento(consulta: ConsultaSupabase): Agendamento {
    return {
      id: consulta.id, // Manter como string
      paciente: consulta.paciente,
      pacienteId: consulta.paciente_id, // Manter como string
      medico: consulta.medico,
      medicoId: consulta.medico_id, // Manter como string
      especialidade: consulta.especialidade,
      especialidadeId: consulta.especialidade_id, // Manter como string
      local: consulta.local,
      data: consulta.data,
      hora: consulta.hora,
      status: consulta.status,
    } as Agendamento;
  }

  // Conversão de Especialidade - AGORA COM STRINGS
  static fromSupabaseEspecialidade(
    especialidade: EspecialidadeSupabase
  ): Especialidade {
    return {
      id: especialidade.id, // Manter como string
      nome: especialidade.nome,
    } as Especialidade;
  }

  // Conversão de Médico - AGORA COM STRINGS
  static fromSupabaseMedico(medico: MedicoSupabase): Medico {
    return {
      id: medico.id, // Manter como string
      nome: medico.nome,
      especialidadeId: medico.especialidade_id, // Manter como string
      crm: medico.crm,
      local: medico.local,
    } as Medico;
  }

  // Método para compatibilidade (se ainda precisar em algum lugar)
  static parseId(id: string): number {
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
}
