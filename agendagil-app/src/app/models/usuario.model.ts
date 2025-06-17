export interface Usuario {
  id?: number;
  nome: string;
  email: string;
  senha?: string;
  tipo: 'paciente' | 'medico' | 'administrador';
  especialidade?: string; // apenas para médico
}
