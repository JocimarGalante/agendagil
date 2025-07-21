import { UsuarioBase } from './usuario-base.model';
import { TipoUsuario } from './tipo-usuario.enum';

export interface ProfissionalAutonomo extends UsuarioBase {
  crm: string;
  especialidade: string;
  cpf: string;
  descricao?: string;
  formacao?: string;
  experiencia?: string;
  siteProfissional?: string;
  tipo: TipoUsuario.PROFISSIONAL_AUTONOMO;
}
