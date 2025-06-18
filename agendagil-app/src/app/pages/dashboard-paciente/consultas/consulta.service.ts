import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Consulta } from '@models/consulta.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ConsultaService {
  //private readonly API_URL = 'http://localhost:5000/consultas';
  private readonly API_URL = 'https://agendagil-api.vercel.app/consultas';

  constructor(private http: HttpClient) {}

  getConsultas(): Observable<Consulta[]> {
    return this.http.get<Consulta[]>(this.API_URL);
  }

  getConsultaPorId(id: number): Observable<Consulta> {
    return this.http.get<Consulta>(`${this.API_URL}/${id}`);
  }

  criarConsulta(consulta: Consulta): Observable<Consulta> {
    return this.http.post<Consulta>(this.API_URL, consulta);
  }

  atualizarConsulta(id: number, consulta: Consulta): Observable<Consulta> {
    return this.http.put<Consulta>(`${this.API_URL}/${id}`, consulta);
  }

  deletarConsulta(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }
}
