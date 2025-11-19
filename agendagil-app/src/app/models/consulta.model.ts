import { StatusConsulta } from "./status-consulta.model";

export interface Consulta {
  id?: string;
  paciente: string;
  medico: string;
  especialidade: string;
  local: string;
  data: string;
  hora: string;
  status: StatusConsulta;
}
