import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TipoUsuario } from '@models/tipo-usuario.enum';
import { Usuario } from '@models/usuario.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  private readonly API_URL = 'https://agendagil-api.vercel.app/users'; // substitua pela sua URL real

  constructor(private http: HttpClient) {}

  registrarUsuario(dados: Usuario): Observable<Usuario> {
    // Força o tipo padrão como "Paciente"
    const payload = { ...dados, tipo: TipoUsuario.Paciente };
    return this.http.post<Usuario>(this.API_URL, payload);
  }
}
