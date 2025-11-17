import { StatusConsulta } from "./status-consulta.model";

// models/agendamento.model.ts
export interface Agendamento {
  id?: number;
  paciente: string;
  pacienteId: number;
  medico: string;
  medicoId: number;
  especialidade: string;
  especialidadeId: number;
  local: string;
  data: string;
  hora: string;
  status: StatusConsulta;
}

export interface Especialidade {
  id: number;
  nome: string;
}

export interface Medico {
  id: number;
  nome: string;
  especialidadeId: number;
  crm: string;
  local: string;
}
