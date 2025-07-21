import { TipoUsuario } from './tipo-usuario.enum';

export interface UsuarioBase {
  id?: number;
  nome: string;
  email: string;
  senha?: string;
  tipo: TipoUsuario;
}
