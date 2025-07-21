import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth/auth.service';
import { TipoUsuario } from '@models/usuario/tipo-usuario.enum';
import { UsuarioBase } from '@models/usuario/usuario-base.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  usuario: UsuarioBase | null = null;
  TipoUsuario = TipoUsuario;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuarioLogado();
  }

}
