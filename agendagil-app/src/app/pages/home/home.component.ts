import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth/auth.service';
import { TipoUsuario } from '@models/tipo-usuario.enum';
import { Usuario } from '@models/usuario.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  usuario: Usuario | null = null;
  TipoUsuario = TipoUsuario;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuarioLogado();
  }

}
