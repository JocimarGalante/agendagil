import { UsuarioBase } from './usuario-base.model';
import { TipoUsuario } from './tipo-usuario.enum';

export interface ProfissionalAutonomo extends UsuarioBase {
  tipo: TipoUsuario.PROFISSIONAL_AUTONOMO;
  crm: string;
  especialidade: string;
}
