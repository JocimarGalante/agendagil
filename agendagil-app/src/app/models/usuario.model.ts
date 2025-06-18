import { TipoUsuario } from "./tipo-usuario.enum";

export interface Usuario {
  id?: number;
  nome: string;
  email: string;
  senha?: string;
  tipo: TipoUsuario;
  crm?: string;
  especialidade?: string; // apenas para médico
}
