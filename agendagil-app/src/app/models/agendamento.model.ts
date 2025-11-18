import { StatusConsulta } from "./status-consulta.model";

export interface Agendamento {
  id?: string;
  paciente: string;
  pacienteId: string;
  medico: string;
  medicoId: string;
  especialidade: string;
  especialidadeId: string;
  local: string;
  data: string;
  hora: string;
  status: StatusConsulta;
}

export interface Especialidade {
  id: string;
  nome: string;
}

export interface Medico {
  id: string;
  nome: string;
  especialidadeId: string;
  crm: string;
  local: string;
}

export interface DisponibilidadeMedico {
  id: string;
  medicoId: string;
  data: string;
  horariosDisponiveis: string[];
  horariosOcupados: string[];
}
