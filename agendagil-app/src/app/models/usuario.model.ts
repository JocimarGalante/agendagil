import { TipoUsuario } from "./tipo-usuario.enum";

export interface Usuario {
  id?: number;
  nome: string;
  email: string;
  senha?: string;
  tipo: TipoUsuario;
  especialidade?: string; // apenas para médico
}
