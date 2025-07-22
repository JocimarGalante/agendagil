import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TipoUsuario } from '@models/usuario/tipo-usuario.enum';
import { Observable } from 'rxjs';
import { UsuarioBase } from '@models/usuario/usuario-base.model';

@Injectable({
  providedIn: 'root',
})
export class RegisterService {
  //private readonly API_URL = 'http://localhost:5000/users';
  private readonly API_URL = 'https://agendagil-api.vercel.app/users';

  constructor(private http: HttpClient) {}

  registrarUsuario(dados: UsuarioBase, tipoUsuario: TipoUsuario): Observable<UsuarioBase> {
    const payload = {
      ...dados,
      tipo: tipoUsuario,
    };
    return this.http.post<UsuarioBase>(this.API_URL, payload);
  }
}
