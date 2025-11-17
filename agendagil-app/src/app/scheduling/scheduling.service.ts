import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Agendamento, Especialidade, Medico } from '@models/agendamento.model';

@Injectable({
  providedIn: 'root'
})
export class SchedulingService {
  private readonly API_URL = 'https://agendagil-api.vercel.app';

  constructor(private http: HttpClient) {}

  getEspecialidades(): Observable<Especialidade[]> {
    return this.http.get<Especialidade[]>(`${this.API_URL}/especialidades`);
  }

  getMedicos(): Observable<Medico[]> {
    return this.http.get<Medico[]>(`${this.API_URL}/medicos`);
  }

  getMedicosPorEspecialidade(especialidadeId: number): Observable<Medico[]> {
    return this.http.get<Medico[]>(`${this.API_URL}/medicos?especialidadeId=${especialidadeId}`);
  }

  criarAgendamento(agendamento: Agendamento): Observable<Agendamento> {
    return this.http.post<Agendamento>(`${this.API_URL}/consultas`, agendamento);
  }

  getHorariosDisponiveis(medicoId: number, data: string): Observable<string[]> {
    // Simulando horários disponíveis
    const horarios = ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'];
    return new Observable(observer => {
      observer.next(horarios);
      observer.complete();
    });
  }
}
