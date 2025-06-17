export interface Usuario {
  id?: number;
  nome: string;
  email: string;
  senha?: string;
  tipo: 'paciente' | 'medico';
  especialidade?: string; // apenas para médico
}
