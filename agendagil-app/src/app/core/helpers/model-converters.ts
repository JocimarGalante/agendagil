import { UsuarioBase } from '@models/usuario/usuario-base.model';
import { TipoUsuario } from '@models/usuario/tipo-usuario.enum';
import { Consulta } from '@models/consulta.model';
import { Especialidade, Medico, Agendamento } from '@models/agendamento.model';

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
  private static ensureString(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;

    if (typeof value === 'number') {
      console.warn('Número detectado onde era esperado UUID string:', value);
      return value.toString();
    }

    return String(value);
  }

  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  static fromSupabaseUsuario(usuario: UsuarioSupabase): UsuarioBase {
    const base: any = {
      id: this.ensureString(usuario.id),
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
      id: this.ensureString(usuario.id),
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

  static fromSupabaseConsulta(consulta: ConsultaSupabase): Consulta {
    return {
      id: this.ensureString(consulta.id),
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
    let id = consulta.id;
    if (!id || this.isNumber(id)) {
      console.warn('ID inválido ou numérico detectado, gerando UUID:', id);
      id = this.generateUUID();
    }

    return {
      id: this.ensureString(id),
      paciente: consulta.paciente,
      paciente_id: '',
      medico: consulta.medico,
      medico_id: '',
      especialidade: consulta.especialidade,
      especialidade_id: '',
      local: consulta.local,
      data: consulta.data,
      hora: consulta.hora,
      status: consulta.status,
    } as ConsultaSupabase;
  }

  static fromSupabaseAgendamento(consulta: ConsultaSupabase): Agendamento {
    return {
      id: this.ensureString(consulta.id),
      paciente: consulta.paciente,
      pacienteId: this.ensureString(consulta.paciente_id),
      medico: consulta.medico,
      medicoId: this.ensureString(consulta.medico_id),
      especialidade: consulta.especialidade,
      especialidadeId: this.ensureString(consulta.especialidade_id),
      local: consulta.local,
      data: consulta.data,
      hora: consulta.hora,
      status: consulta.status,
    } as Agendamento;
  }

  static fromSupabaseEspecialidade(
    especialidade: EspecialidadeSupabase
  ): Especialidade {
    return {
      id: this.ensureString(especialidade.id), // Garantir que seja string
      nome: especialidade.nome,
    } as Especialidade;
  }

  static fromSupabaseMedico(medico: MedicoSupabase): Medico {
    return {
      id: this.ensureString(medico.id),
      nome: medico.nome,
      especialidadeId: this.ensureString(medico.especialidade_id),
      crm: medico.crm,
      local: medico.local,
    } as Medico;
  }

  private static isNumber(value: any): boolean {
    if (value === null || value === undefined) return false;
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

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

  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static migrateNumericId(numericId: number | string): string {
    if (typeof numericId === 'string' && this.isValidUUID(numericId)) {
      return numericId;
    }

    const num = typeof numericId === 'string' ? parseInt(numericId, 10) : numericId;

    const hex = num.toString(16).padStart(8, '0');
    return `00000000-0000-4000-8000-${hex.padStart(12, '0')}`;
  }
}
