import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth/auth.service';
import { Usuario } from '@models/usuario.model';

@Component({
  selector: 'app-dashboard-paciente',
  templateUrl: './dashboard-paciente.component.html',
  styleUrls: ['./dashboard-paciente.component.scss'],
})
export class DashboardPacienteComponent implements OnInit {
  usuario: Usuario | null = null;
  isCollapsed = false;
  isMobile = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuarioLogado();
    this.isMobile = window.innerWidth <= 768;
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
      if (this.isMobile) this.isCollapsed = true;
    });
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  get primeiroNome(): string {
    if (!this.usuario?.nome) return '';
    return this.usuario.nome.split(' ')[0];
  }
}
