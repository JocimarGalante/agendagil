import { StatusConsulta } from "./status-consulta.model";

// src/app/models/agendamento.model.ts
export interface Agendamento {
  id?: string; // Mudado para string
  paciente: string;
  pacienteId: string; // Mudado para string
  medico: string;
  medicoId: string; // Mudado para string
  especialidade: string;
  especialidadeId: string; // Mudado para string
  local: string;
  data: string;
  hora: string;
  status: StatusConsulta;
}

export interface Especialidade {
  id: string; // Mudado para string
  nome: string;
}

export interface Medico {
  id: string; // Mudado para string
  nome: string;
  especialidadeId: string; // Mudado para string
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
