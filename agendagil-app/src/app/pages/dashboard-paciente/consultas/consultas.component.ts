// src/app/consultas/consultas.component.ts
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
    this.carregarConsultas();
  }

  carregarConsultas(): void {
    this.consultaService.getConsultas().subscribe({
      next: (dados) => {
        this.consultas = dados;
        console.log('Consultas carregadas:', this.consultas);
      },
      error: (erro) => {
        console.error('Erro ao buscar consultas', erro);
        this.mostrarErro('Erro ao carregar consultas');
      },
    });
  }

  formatarDataHora(data: string, hora: string): string {
    try {
      const dateTime = new Date(`${data}T${hora}`);
      return dateTime.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return `${data} ${hora}`;
    }
  }

  cancelarConsulta(id: string) {
    const consulta = this.consultas.find((c) => c.id === id);
    if (!consulta) return;

    Swal.fire({
      title: 'Cancelar consulta?',
      html: `
        <div class="text-start">
          <p>Deseja realmente cancelar a consulta com <strong>${
            consulta.medico
          }</strong>?</p>
          <p><strong>Especialidade:</strong> ${consulta.especialidade}</p>
          <p><strong>Data:</strong> ${this.formatarDataHora(
            consulta.data,
            consulta.hora
          )}</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '<strong>Sim, cancelar</strong>',
      cancelButtonText: 'Manter consulta',
      buttonsStyling: true,
      customClass: {
        confirmButton: 'btn btn-danger swal2-confirm-custom',
        cancelButton: 'btn btn-outline-secondary swal2-cancel-custom',
        popup: 'swal2-border-radius',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        // Usar o método específico para cancelar
        this.consultaService.cancelarConsulta(id).subscribe({
          next: (consultaCancelada) => {
            // Atualiza a lista local para refletir a mudança
            const index = this.consultas.findIndex((c) => c.id === id);
            if (index !== -1) {
              this.consultas[index] = consultaCancelada;
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
            this.mostrarErro(
              'Não foi possível cancelar a consulta. Tente novamente.'
            );
          },
        });
      }
    });
  }

  reagendarConsulta(consulta: Consulta): void {
    // Validar se a consulta pode ser reagendada
    if (
      consulta.status === StatusConsulta.Cancelada ||
      consulta.status === StatusConsulta.Concluida
    ) {
      this.mostrarErro('Esta consulta não pode ser reagendada.');
      return;
    }

    Swal.fire({
      title: 'Reagendar Consulta',
      html: `
        <div class="text-start mb-3">
          <p><strong>Médico:</strong> ${consulta.medico}</p>
          <p><strong>Especialidade:</strong> ${consulta.especialidade}</p>
          <p><strong>Data atual:</strong> ${this.formatarDataHora(
            consulta.data,
            consulta.hora
          )}</p>
        </div>
        <input id="novaData" type="date" class="swal2-input" value="${
          consulta.data
        }" min="${this.getDataMinima()}">
        <input id="novaHora" type="time" class="swal2-input" value="${
          consulta.hora
        }">
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirmar reagendamento',
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

        // Validar se a data não é no passado
        const dataSelecionada = new Date(novaData);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        if (dataSelecionada < hoje) {
          Swal.showValidationMessage(
            'A data não pode ser anterior ao dia de hoje.'
          );
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
        // Usar o método específico para reagendar
        this.consultaService
          .reagendarConsulta(
            consulta.id!,
            result.value.novaData,
            result.value.novaHora
          )
          .subscribe({
            next: (consultaReagendada) => {
              // Atualiza a lista local
              const index = this.consultas.findIndex(
                (c) => c.id === consulta.id
              );
              if (index !== -1) {
                this.consultas[index] = consultaReagendada;
              }

              Swal.fire({
                title: 'Reagendada!',
                html: `
                <div class="text-start">
                  <p>A consulta foi reagendada com sucesso.</p>
                  <p><strong>Nova data:</strong> ${this.formatarDataHora(
                    consultaReagendada.data,
                    consultaReagendada.hora
                  )}</p>
                </div>
              `,
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
              console.error('Erro ao reagendar consulta:', err);
              this.mostrarErro(
                'Não foi possível reagendar a consulta. Tente novamente.'
              );
            },
          });
      }
    });
  }

  // Método auxiliar para mostrar erros
  private mostrarErro(mensagem: string): void {
    Swal.fire({
      title: 'Erro',
      text: mensagem,
      icon: 'error',
      confirmButtonText: 'OK',
      customClass: {
        confirmButton: 'btn btn-danger swal2-confirm-custom',
        popup: 'swal2-border-radius',
      },
      buttonsStyling: false,
    });
  }

  // Método para obter data mínima (hoje)
  private getDataMinima(): string {
    return new Date().toISOString().split('T')[0];
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

  // Adicione estes métodos no seu ConsultasComponent

  // Método para contar consultas por status
  getTotalPorStatus(status: number): number {
    return this.consultas.filter((consulta) => consulta.status === status)
      .length;
  }

  // Método para verificar se a consulta pode ser cancelada
  podeCancelar(consulta: Consulta): boolean {
    return (
      consulta.status === StatusConsulta.Agendada ||
      consulta.status === StatusConsulta.Confirmada
    );
  }

  // Método para verificar se a consulta pode ser reagendada
  podeReagendar(consulta: Consulta): boolean {
    return (
      consulta.status === StatusConsulta.Agendada ||
      consulta.status === StatusConsulta.Confirmada
    );
  }
}
