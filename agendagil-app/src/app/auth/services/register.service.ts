import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TipoUsuario } from '@models/tipo-usuario.enum';
import { Usuario } from '@models/usuario.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RegisterService {
  private readonly API_URL = 'http://localhost:5000/users'; // substitua pela sua URL real

  constructor(private http: HttpClient) {}

  registrarUsuario(dados: Usuario, isMedico: boolean): Observable<Usuario> {
    const payload = {
      ...dados,
      tipo: isMedico ? TipoUsuario.Medico : TipoUsuario.Paciente,
    };
    return this.http.post<Usuario>(this.API_URL, payload);
  }
}
