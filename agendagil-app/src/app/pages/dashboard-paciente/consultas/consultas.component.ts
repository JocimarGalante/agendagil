import { Component, OnInit } from '@angular/core';
import { Consulta } from '@models/consulta.model';
import { StatusConsulta } from '@models/status-consulta.model';
import { ConsultaService } from './consulta.service';
import Swal from 'sweetalert2';

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
    if (!consulta) return;

    Swal.fire({
      title: 'Cancelar consulta?',
      text: `Deseja realmente cancelar a consulta com ${consulta.medico}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '<strong>Sim</strong>',
      cancelButtonText: 'Não',
      buttonsStyling: true,
      customClass: {
        confirmButton: 'btn btn-danger swal2-confirm-custom',
        cancelButton: 'btn btn-outline-secondary swal2-cancel-custom',
        popup: 'swal2-border-radius',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        consulta.status = StatusConsulta.Cancelada;

        Swal.fire({
          title: 'Cancelada!',
          text: 'A consulta foi cancelada com sucesso.',
          icon: 'success',
          confirmButtonText: 'OK',
          buttonsStyling: true,
          customClass: {
            confirmButton: 'btn btn-success swal2-confirm-custom',
            popup: 'swal2-border-radius',
          },
        });
      }
    });
  }

  reagendarConsulta(consulta: Consulta): void {
    console.log('Reagendando consulta:', consulta);
    // Exemplo: this.router.navigate(['/reagendar', consulta.id]);
  }
}
