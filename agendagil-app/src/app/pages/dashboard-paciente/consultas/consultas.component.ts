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

  cancelarConsulta(id: string) { // MUDANÇA: number → string
    const consulta = this.consultas.find((c) => c.id === id); // MUDANÇA: Agora funciona
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

        this.consultaService.atualizarConsulta(id, consulta).subscribe({ // MUDANÇA: id é string
          next: (consultaAtualizada) => {
            // Atualiza a lista local para refletir a mudança
            const index = this.consultas.findIndex((c) => c.id === id); // MUDANÇA: Agora funciona
            if (index !== -1) {
              this.consultas[index] = consultaAtualizada;
            }

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
          },
          error: (err) => {
            console.error('Erro ao cancelar consulta', err);
            Swal.fire({
              title: 'Erro',
              text: 'Não foi possível cancelar a consulta. Tente novamente.',
              icon: 'error',
              confirmButtonText: 'OK',
              buttonsStyling: true,
              customClass: {
                confirmButton: 'btn btn-danger swal2-confirm-custom',
                popup: 'swal2-border-radius',
              },
            });
          },
        });
      }
    });
  }

  reagendarConsulta(consulta: Consulta): void {
    Swal.fire({
      title: 'Reagendar Consulta',
      html:
        `<input id="novaData" type="date" class="swal2-input" value="${consulta.data}">` +
        `<input id="novaHora" type="time" class="swal2-input" value="${consulta.hora}">`,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      preConfirm: () => {
        const novaData = (
          document.getElementById('novaData') as HTMLInputElement
        ).value;
        const novaHora = (
          document.getElementById('novaHora') as HTMLInputElement
        ).value;

        if (!novaData || !novaHora) {
          Swal.showValidationMessage('Por favor, informe data e hora.');
          return;
        }

        return { novaData, novaHora };
      },
      customClass: {
        confirmButton: 'btn btn-primary swal2-confirm-custom',
        cancelButton: 'btn btn-outline-secondary swal2-cancel-custom',
        popup: 'swal2-border-radius',
      },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        // Atualiza localmente
        consulta.data = result.value.novaData;
        consulta.hora = result.value.novaHora;

        // Chama serviço para atualizar no backend
        this.consultaService
          .atualizarConsulta(consulta.id!, consulta) // MUDANÇA: id é string
          .subscribe({
            next: (consultaAtualizada) => {
              Swal.fire({
                title: 'Reagendada!',
                text: 'A consulta foi atualizada com sucesso.',
                icon: 'success',
                confirmButtonText: 'OK',
                customClass: {
                  confirmButton: 'btn btn-success swal2-confirm-custom',
                  popup: 'swal2-border-radius',
                },
                buttonsStyling: false,
              });
            },
            error: (err) => {
              console.error('Erro ao atualizar consulta:', err);
              Swal.fire({
                title: 'Erro',
                text: 'Não foi possível atualizar a consulta. Tente novamente.',
                icon: 'error',
                confirmButtonText: 'OK',
                customClass: {
                  confirmButton: 'btn btn-danger swal2-confirm-custom',
                  popup: 'swal2-border-radius',
                },
                buttonsStyling: false,
              });
            },
          });
      }
    });
  }

  // Método auxiliar para obter classe CSS baseada no status
  getStatusClass(status: number): string {
    switch (status) {
      case StatusConsulta.Agendada:
        return 'status-agendada';
      case StatusConsulta.Confirmada:
        return 'status-confirmada';
      case StatusConsulta.Cancelada:
        return 'status-cancelada';
      case StatusConsulta.Concluida:
        return 'status-realizada';
      default:
        return 'status-desconhecida';
    }
  }

  // Método auxiliar para obter texto do status
  getStatusText(status: number): string {
    switch (status) {
      case StatusConsulta.Agendada:
        return 'Agendada';
      case StatusConsulta.Confirmada:
        return 'Confirmada';
      case StatusConsulta.Cancelada:
        return 'Cancelada';
      case StatusConsulta.Concluida:
        return 'Realizada';
      default:
        return 'Desconhecido';
    }
  }
}
