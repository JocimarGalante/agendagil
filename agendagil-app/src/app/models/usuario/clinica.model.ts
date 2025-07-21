import { UsuarioBase } from './usuario-base.model';
import { TipoUsuario } from './tipo-usuario.enum';

export interface Clinica extends UsuarioBase {
  cnpj: string;
  razaoSocial: string;
  responsavelTecnico?: string;
  registroResponsavel?: string;
  especialidadesAtendidas?: string[];
  site?: string;
  descricao?: string;
  horarioFuncionamento?: string;
  tipo: TipoUsuario.CLINICA;
}
