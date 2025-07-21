import { UsuarioBase } from './usuario-base.model';
import { TipoUsuario } from './tipo-usuario.enum';

export interface Clinica extends UsuarioBase {
  tipo: TipoUsuario.CLINICA;
  cnpj: string;
  endereco?: string;
}
