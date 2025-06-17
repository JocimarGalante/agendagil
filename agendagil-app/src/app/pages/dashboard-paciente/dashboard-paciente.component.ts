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
  cards = [
    {
      titulo: 'Minhas Consultas',
      descricao: 'Veja, reagende ou cancele suas consultas agendadas.',
      link: '/consultas',
      icone: 'bi bi-calendar-check',
    },
    {
      titulo: 'Buscar Especialistas',
      descricao: 'Filtre por especialidades e encontre o profissional ideal.',
      link: '/buscar-especialista',
      icone: 'bi bi-search-heart',
    },
    {
      titulo: 'Lembretes e Notificações',
      descricao: 'Receba alertas e confirme presença automaticamente.',
      link: '/notificacoes',
      icone: 'bi bi-bell',
    },
    {
      titulo: 'Histórico Médico',
      descricao: 'Consulte seu histórico de comparecimento.',
      link: '/historico',
      icone: 'bi bi-clock-history',
    },
    {
      titulo: 'Mensagens',
      descricao: 'Receba recados e avisos dos profissionais.',
      link: '/mensagens',
      icone: 'bi bi-chat-left-dots',
    },
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuarioLogado();
  }
}
