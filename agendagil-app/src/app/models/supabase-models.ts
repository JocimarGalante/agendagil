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
