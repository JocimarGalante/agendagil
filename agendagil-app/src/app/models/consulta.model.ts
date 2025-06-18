import { StatusConsulta } from "./status-consulta.model";

export interface Consulta {
  id?: number;
  paciente: string;
  medico: string;
  especialidade: string;
  local: string;
  data: string;   // ISO format: '2025-06-17'
  hora: string;    // formato: '14:30'
  status: StatusConsulta;
}
