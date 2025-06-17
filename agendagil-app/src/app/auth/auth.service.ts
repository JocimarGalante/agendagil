import { HttpClient } from '@angular/common/http';
import { Usuario } from './../models/usuario.model';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://agendagil-api.vercel.app/users'; // JSON Server na Vercel

  private currentUserSubject = new BehaviorSubject<Usuario | null>(
    JSON.parse(localStorage.getItem('usuarioLogado') || 'null')
  );
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado') || 'null');
    const expiration = localStorage.getItem('tokenExpiration');
    const now = new Date().getTime();

    if (usuario && expiration && now < parseInt(expiration)) {
      this.currentUserSubject.next(usuario);
    } else {
      this.logout();
    }
  }

  login(email: string, senha: string): Observable<Usuario> {
    return this.http.get<Usuario[]>(`${this.apiUrl}?email=${email}&senha=${senha}`)
      .pipe(
        map(users => {
          if (users.length > 0) {
            return users[0];
          } else {
            throw new Error('Email ou senha inválidos');
          }
        }),
        tap(user => {
          const expirationTime = new Date().getTime() + 60 * 60 * 1000; // 1 hora
          localStorage.setItem('usuarioLogado', JSON.stringify(user));
          localStorage.setItem('tokenExpiration', expirationTime.toString());
          this.currentUserSubject.next(user);
        }),
        catchError(err => {
          return throwError(() => new Error(err.message || 'Erro no login'));
        })
      );
  }

  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('tokenExpiration');
  }

  getUsuarioLogado(): Usuario | null {
    const expiration = localStorage.getItem('tokenExpiration');
    const now = new Date().getTime();

    if (expiration && now > parseInt(expiration)) {
      this.logout(); // expira
      return null;
    }

    return this.currentUserSubject.value;
  }

  isLogado(): boolean {
    return !!this.currentUserSubject.value;
  }
}
