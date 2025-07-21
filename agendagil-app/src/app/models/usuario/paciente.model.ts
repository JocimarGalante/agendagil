import { UsuarioBase } from './usuario-base.model';
import { TipoUsuario } from './tipo-usuario.enum';

export interface Paciente extends UsuarioBase {
  tipo: TipoUsuario.PACIENTE;
  dataNascimento?: string;
  cpf: string;
}
