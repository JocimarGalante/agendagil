import { Component, OnInit } from '@angular/core';
import { Consulta } from '@models/consulta.model';
import { StatusConsulta } from '@models/status-consulta.model';
import { ConsultaService } from './consulta.service';

@Component({
  selector: 'app-consultas',
  templateUrl: './consultas.component.html',
  styleUrls: ['./consultas.component.scss'],
})
export class ConsultasComponent implements OnInit {
  StatusConsulta = StatusConsulta;
  consultas: Consulta[] = [];
  constructor(private consultaService: ConsultaService) {}

  ngOnInit(): void {
    this.consultaService.getConsultas().subscribe({
      next: (dados) => (this.consultas = dados),
      error: (erro) => console.error('Erro ao buscar consultas', erro),
    });
  }
  formatarDataHora(data: string, hora: string): string {
    const dateTime = new Date(`${data}T${hora}`);
    return dateTime.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  cancelarConsulta(id: number) {
    const consulta = this.consultas.find((c) => c.id === id);
    if (consulta) {
      consulta.status = StatusConsulta.Cancelada;
    }
  }
}
