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

  formatarData(data: string): string {
    try {
      const date = new Date(data);
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return data;
    }
  }

  cancelarConsulta(id: string) {
    const consulta = this.consultas.find((c) => c.id === id);
    if (!consulta) return;

    Swal.fire({
      title: 'Cancelar consulta?',
      html: `
        <div class="text-start">
          <p>Deseja realmente cancelar a consulta com <strong>${consulta.medico}</strong>?</p>
          <p><strong>Especialidade:</strong> ${consulta.especialidade}</p>
          <p><strong>Data:</strong> ${this.formatarDataHora(consulta.data, consulta.hora)}</p>
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
        this.consultaService.cancelarConsulta(id).subscribe({
          next: (consultaCancelada) => {
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
            this.mostrarErro('Não foi possível cancelar a consulta. Tente novamente.');
          },
        });
      }
    });
  }

  reagendarConsulta(consulta: Consulta): void {
    if (consulta.status === StatusConsulta.Cancelada || consulta.status === StatusConsulta.Concluida) {
      this.mostrarErro('Esta consulta não pode ser reagendada.');
      return;
    }

    const dataAtual = new Date();
    const dataMinima = dataAtual.toISOString().split('T')[0];

    // Calcular data máxima (3 meses a partir de hoje)
    const dataMaxima = new Date();
    dataMaxima.setMonth(dataMaxima.getMonth() + 3);
    const dataMaximaStr = dataMaxima.toISOString().split('T')[0];

    Swal.fire({
      title: 'Reagendar Consulta',
      html: `
        <div class="reagendamento-container">
          <!-- Informações da Consulta Atual -->
          <div class="consulta-atual card border-warning mb-4">
            <div class="card-header bg-warning text-dark">
              <i class="bi bi-info-circle me-2"></i>
              <strong>Consulta Atual</strong>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <p class="mb-1"><strong>Médico:</strong> ${consulta.medico}</p>
                  <p class="mb-1"><strong>Especialidade:</strong> ${consulta.especialidade}</p>
                  <p class="mb-1"><strong>Local:</strong> ${consulta.local}</p>
                </div>
                <div class="col-md-6">
                  <p class="mb-1"><strong>Data Atual:</strong></p>
                  <p class="mb-1 text-primary fw-bold">${this.formatarDataHora(consulta.data, consulta.hora)}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Novo Agendamento -->
          <div class="novo-agendamento card border-primary">
            <div class="card-header bg-primary text-white">
              <i class="bi bi-calendar-plus me-2"></i>
              <strong>Novo Agendamento</strong>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label for="novaData" class="form-label fw-semibold">Nova Data</label>
                  <input
                    id="novaData"
                    type="date"
                    class="form-control"
                    value="${consulta.data}"
                    min="${dataMinima}"
                    max="${dataMaximaStr}"
                  >
                  <div class="form-text">Selecione uma data dentro dos próximos 3 meses</div>
                </div>
                <div class="col-md-6">
                  <label for="novaHora" class="form-label fw-semibold">Novo Horário</label>
                  <input
                    id="novaHora"
                    type="time"
                    class="form-control"
                    value="${consulta.hora}"
                  >
                  <div class="form-text">Horário de funcionamento: 08:00 às 18:00</div>
                </div>
              </div>

              <!-- Preview da Nova Data -->
              <div class="mt-3 p-3 bg-light rounded" id="previewNovaData">
                <small class="text-muted">
                  <i class="bi bi-eye me-1"></i>
                  <strong>Prévia:</strong>
                  <span id="textoPreview">${this.formatarDataHora(consulta.data, consulta.hora)}</span>
                </small>
              </div>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-check-circle me-1"></i> Confirmar Reagendamento',
      cancelButtonText: '<i class="bi bi-x-circle me-1"></i> Cancelar',
      focusConfirm: false,
      didOpen: () => {
        // Adicionar evento para atualizar o preview em tempo real
        const dataInput = document.getElementById('novaData') as HTMLInputElement;
        const horaInput = document.getElementById('novaHora') as HTMLInputElement;
        const previewText = document.getElementById('textoPreview') as HTMLSpanElement;

        const atualizarPreview = () => {
          if (dataInput.value && horaInput.value) {
            const novaDataFormatada = this.formatarDataHora(dataInput.value, horaInput.value);
            previewText.textContent = novaDataFormatada;
          }
        };

        dataInput.addEventListener('change', atualizarPreview);
        horaInput.addEventListener('change', atualizarPreview);
      },
      preConfirm: () => {
        const novaData = (document.getElementById('novaData') as HTMLInputElement).value;
        const novaHora = (document.getElementById('novaHora') as HTMLInputElement).value;

        if (!novaData || !novaHora) {
          Swal.showValidationMessage('Por favor, informe data e hora.');
          return;
        }

        // Validar data não pode ser no passado
        const dataSelecionada = new Date(novaData);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        if (dataSelecionada < hoje) {
          Swal.showValidationMessage('A data não pode ser anterior ao dia de hoje.');
          return;
        }

        // Validar horário comercial (08:00 - 18:00)
        const horaNumero = parseInt(novaHora.split(':')[0]);
        if (horaNumero < 8 || horaNumero > 18) {
          Swal.showValidationMessage('Horário fora do expediente. Selecione entre 08:00 e 18:00.');
          return;
        }

        // Validar se não é o mesmo horário atual
        if (novaData === consulta.data && novaHora === consulta.hora) {
          Swal.showValidationMessage('Selecione uma data ou horário diferente do atual.');
          return;
        }

        return { novaData, novaHora };
      },
      customClass: {
        confirmButton: 'btn btn-success swal2-confirm-custom',
        cancelButton: 'btn btn-outline-secondary swal2-cancel-custom',
        popup: 'swal2-border-radius swal2-wide',
        htmlContainer: 'swal2-html-container-custom'
      },
      buttonsStyling: false,
      width: '600px'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.consultaService
          .reagendarConsulta(consulta.id!, result.value.novaData, result.value.novaHora)
          .subscribe({
            next: (consultaReagendada) => {
              const index = this.consultas.findIndex((c) => c.id === consulta.id);
              if (index !== -1) {
                this.consultas[index] = consultaReagendada;
              }

              Swal.fire({
                title: 'Consulta Reagendada!',
                html: `
                  <div class="text-center">
                    <i class="bi bi-check-circle-fill text-success display-4 mb-3"></i>
                    <div class="text-start">
                      <p class="mb-2">Sua consulta foi reagendada com sucesso.</p>
                      <div class="alert alert-success">
                        <strong>Novo Agendamento:</strong><br>
                        ${this.formatarDataHora(consultaReagendada.data, consultaReagendada.hora)}<br>
                        <strong>Local:</strong> ${consultaReagendada.local}
                      </div>
                    </div>
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
              this.mostrarErro('Não foi possível reagendar a consulta. Tente novamente.');
            },
          });
      }
    });
  }

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

  private getDataMinima(): string {
    return new Date().toISOString().split('T')[0];
  }

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

  getTotalPorStatus(status: number): number {
    return this.consultas.filter((consulta) => consulta.status === status).length;
  }

  podeCancelar(consulta: Consulta): boolean {
    return (
      consulta.status === StatusConsulta.Agendada ||
      consulta.status === StatusConsulta.Confirmada
    );
  }

  podeReagendar(consulta: Consulta): boolean {
    return (
      consulta.status === StatusConsulta.Agendada ||
      consulta.status === StatusConsulta.Confirmada
    );
  }
}
