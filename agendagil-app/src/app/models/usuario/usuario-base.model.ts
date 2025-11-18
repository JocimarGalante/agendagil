import { TipoUsuario } from './tipo-usuario.enum';

export interface UsuarioBase {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  tipo: TipoUsuario;
  telefone?: string;
  fotoPerfilUrl?: string;
  criadoEm?: string;     // ISO 8601
  atualizadoEm?: string; // ISO 8601
  status?: 'ativo' | 'inativo' | 'pendente';
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}
