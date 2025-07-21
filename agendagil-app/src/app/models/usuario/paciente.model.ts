import { UsuarioBase } from './usuario-base.model';
import { TipoUsuario } from './tipo-usuario.enum';

export interface Paciente extends UsuarioBase {
  cpf: string;
  dataNascimento: string;
  genero?: string;
  tipo: TipoUsuario.PACIENTE;
}
