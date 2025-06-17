import { HttpClient } from '@angular/common/http';
import { Usuario } from './../models/usuario.model';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://agendagil-api.vercel.app/users'; // endereço do json-server

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<Usuario> {
    return this.http.get<Usuario[]>(`${this.apiUrl}?email=${email}&password=${password}`)
      .pipe(
        map(users => {
          if (users.length > 0) {
            return users[0];
          } else {
            throw new Error('Email ou senha inválidos');
          }
        }),
        catchError(err => {
          // Aqui você pode tratar erros HTTP, etc
          return throwError(() => new Error(err.message || 'Erro desconhecido'));
        })
      );
  }
}
