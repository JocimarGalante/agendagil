// src/app/scheduling/agenda-form/agenda-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SchedulingService } from '../scheduling.service';
import { Especialidade, Medico, Agendamento } from '@models/agendamento.model';
import { StatusConsulta } from '@models/status-consulta.model';
import { AuthService } from '@auth/auth.service';
import { UsuarioBase } from '@models/usuario/usuario-base.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agenda-form',
  templateUrl: './agenda-form.component.html',
  styleUrls: ['./agenda-form.component.scss'],
})
export class AgendaFormComponent implements OnInit {
  agendamentoForm: FormGroup;
  especialidades: Especialidade[] = [];
  medicosFiltrados: Medico[] = [];
  horariosDisponiveis: string[] = [];
  usuario: UsuarioBase | null = null;
  carregandoMedicos = false;
  carregandoHorarios = false;
  consultasAtivas: any[] = []; // NOVO: Para mostrar consultas existentes

  constructor(
    private fb: FormBuilder,
    private schedulingService: SchedulingService,
    private authService: AuthService,
    private router: Router
  ) {
    this.agendamentoForm = this.criarForm();
  }

  ngOnInit(): void {
    this.usuario = this.authService.getUsuarioLogado();
    this.carregarEspecialidades();
    this.observarMudancasForm();

    // Debug inicial
    this.debugDados();
  }

  // NOVO MÉTODO: Carregar consultas ativas do usuário
  carregarConsultasAtivas(): void {
    this.schedulingService.getConsultasAtivasDoUsuario().subscribe({
      next: (consultas) => {
        this.consultasAtivas = consultas;
        console.log('Consultas ativas do usuário:', this.consultasAtivas);
      },
      error: (erro) => {
        console.error('Erro ao carregar consultas ativas:', erro);
      },
    });
  }

  // NOVO MÉTODO: Verificar se já existe consulta para a especialidade selecionada
  verificarConsultaExistente(especialidadeId: string): boolean {
    if (!especialidadeId || this.consultasAtivas.length === 0) {
      return false;
    }

    const especialidadeSelecionada = this.especialidades.find(
      (e) => e.id === especialidadeId
    );
    const jaExisteConsulta = this.consultasAtivas.some(
      (consulta) =>
        consulta.especialidade_id === especialidadeId &&
        [1, 2].includes(consulta.status)
    );

    if (jaExisteConsulta && especialidadeSelecionada) {
      Swal.fire({
        title: 'Consulta já agendada',
        html: `
          <div class="text-start">
            <p>Você já possui uma consulta agendada para <strong>${especialidadeSelecionada.nome}</strong>.</p>
            <p>Por favor, cancele a consulta existente antes de agendar uma nova.</p>
          </div>
        `,
        icon: 'warning',
        confirmButtonText: 'Entendi',
        customClass: {
          confirmButton: 'btn btn-warning',
          popup: 'swal2-border-radius',
        },
      });
      return true;
    }

    return false;
  }

  debugDados(): void {
    this.schedulingService.debugEspecialidades().subscribe();
    this.schedulingService.debugMedicos().subscribe();
  }

  criarForm(): FormGroup {
    return this.fb.group({
      especialidadeId: ['', Validators.required],
      medicoId: ['', Validators.required],
      data: ['', [Validators.required, this.validarData]],
      hora: ['', Validators.required],
    });
  }

  carregarEspecialidades(): void {
    this.schedulingService.getEspecialidades().subscribe({
      next: (especialidades) => {
        this.especialidades = especialidades;
        console.log(
          'Especialidades carregadas no componente:',
          this.especialidades
        );
      },
      error: (erro) => {
        console.error('Erro ao carregar especialidades', erro);
        Swal.fire(
          'Erro',
          'Não foi possível carregar as especialidades',
          'error'
        );
      },
    });
  }

  carregarMedicos(especialidadeId: string): void {
    console.log('Carregando médicos para especialidade UUID:', especialidadeId);
    this.carregandoMedicos = true;
    this.medicosFiltrados = [];

    this.schedulingService
      .getMedicosPorEspecialidade(especialidadeId)
      .subscribe({
        next: (medicos) => {
          this.medicosFiltrados = medicos;
          this.carregandoMedicos = false;
          this.agendamentoForm.patchValue({ medicoId: '' });
          console.log(
            'Médicos carregados no componente:',
            this.medicosFiltrados
          );
        },
        error: (erro) => {
          console.error('Erro ao carregar médicos', erro);
          this.carregandoMedicos = false;
          this.medicosFiltrados = [];
          Swal.fire('Erro', 'Não foi possível carregar os médicos', 'error');
        },
      });
  }

  observarMudancasForm(): void {
    // Observar mudanças na especialidade
    this.agendamentoForm
      .get('especialidadeId')
      ?.valueChanges.subscribe((especialidadeId) => {
        console.log('Especialidade alterada (UUID):', especialidadeId);

        // NOVO: Verificar se já existe consulta para esta especialidade
        if (especialidadeId) {
          const existeConsulta =
            this.verificarConsultaExistente(especialidadeId);
          if (existeConsulta) {
            this.agendamentoForm.patchValue({ especialidadeId: '' });
            return;
          }
          this.carregarMedicos(especialidadeId);
        } else {
          this.medicosFiltrados = [];
          this.agendamentoForm.patchValue({ medicoId: '' });
        }
      });

    // Observar mudanças no médico e data para carregar horários
    this.agendamentoForm.get('medicoId')?.valueChanges.subscribe((medicoId) => {
      const data = this.agendamentoForm.get('data')?.value;
      if (medicoId && data) {
        this.carregarHorarios(medicoId, data);
      }
    });

    this.agendamentoForm.get('data')?.valueChanges.subscribe((data) => {
      const medicoId = this.agendamentoForm.get('medicoId')?.value;
      if (medicoId && data) {
        this.carregarHorarios(medicoId, data);
      }
    });
  }

  carregarHorarios(medicoId: string, data: string): void {
    this.carregandoHorarios = true;
    this.schedulingService.getHorariosDisponiveis(medicoId, data).subscribe({
      next: (horarios) => {
        this.horariosDisponiveis = horarios;
        this.carregandoHorarios = false;
        this.agendamentoForm.patchValue({ hora: '' });

        if (horarios.length === 0) {
          Swal.fire(
            'Info',
            'Não há horários disponíveis para esta data.',
            'info'
          );
        }
      },
      error: (erro) => {
        console.error('Erro ao carregar horários', erro);
        this.carregandoHorarios = false;
        this.horariosDisponiveis = [];
      },
    });
  }

  validarData(control: any) {
    if (!control.value) return null;

    const dataSelecionada = new Date(control.value);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (dataSelecionada < hoje) {
      return { dataInvalida: true };
    }
    return null;
  }

  getMedicoSelecionado(): Medico | undefined {
    const medicoId = this.agendamentoForm.get('medicoId')?.value;
    console.log('Buscando médico com UUID:', medicoId);

    if (!medicoId) return undefined;

    const medico = this.medicosFiltrados.find((m) => m.id === medicoId);
    console.log('Médico encontrado:', medico);
    return medico;
  }

  getEspecialidadeSelecionada(): Especialidade | undefined {
    const especialidadeId = this.agendamentoForm.get('especialidadeId')?.value;
    return this.especialidades.find((e) => e.id === especialidadeId);
  }

  getDataMinima(): string {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  }

  isCampoInvalido(campo: string): boolean {
    const formControl = this.agendamentoForm.get(campo);
    return !!(
      formControl &&
      formControl.invalid &&
      (formControl.dirty || formControl.touched)
    );
  }

  onSubmit(): void {
    console.log('=== INICIANDO SUBMIT ===');
    console.log('Form Value:', this.agendamentoForm.value);

    if (this.agendamentoForm.valid && this.usuario) {
      const formValue = this.agendamentoForm.value;
      const medico = this.getMedicoSelecionado();
      const especialidade = this.getEspecialidadeSelecionada();

      console.log('Médico selecionado:', medico);
      console.log('Especialidade selecionada:', especialidade);

      if (!medico || !especialidade) {
        Swal.fire('Erro', 'Dados incompletos para o agendamento.', 'error');
        return;
      }

      const existeConsulta = this.verificarConsultaExistente(especialidade.id);
      if (existeConsulta) {
        return;
      }

      const agendamento: Agendamento = {
        paciente: this.usuario.nome,
        pacienteId: this.usuario.id.toString(),
        medico: medico.nome,
        medicoId: medico.id,
        especialidade: especialidade.nome,
        especialidadeId: especialidade.id,
        local: medico.local,
        data: formValue.data,
        hora: formValue.hora,
        status: StatusConsulta.Agendada,
      };

      console.log('Agendamento a ser criado:', agendamento);
      this.confirmarAgendamento(agendamento);
    } else {
      this.marcarCamposComoSujos();
      Swal.fire('Atenção', 'Preencha todos os campos obrigatórios.', 'warning');
    }
  }

  // Método para gerar UUID determinístico baseado no ID numérico
  private generateDeterministicUUID(numericId: number): string {
    const hex = numericId.toString(16).padStart(8, '0');
    return `00000000-0000-4000-8000-${hex.padStart(12, '0')}`;
  }

  private confirmarAgendamento(agendamento: Agendamento): void {
    let htmlContent = `
      <div class="text-start">
        <p><strong>Paciente:</strong> ${agendamento.paciente}</p>
        <p><strong>Médico:</strong> ${agendamento.medico}</p>
        <p><strong>Especialidade:</strong> ${agendamento.especialidade}</p>
        <p><strong>Local:</strong> ${agendamento.local}</p>
        <p><strong>Data:</strong> ${this.formatarDataExibicao(
          agendamento.data
        )}</p>
        <p><strong>Horário:</strong> ${agendamento.hora}</p>
    `;

    // NOVO: Mostrar consultas existentes se houver
    if (this.consultasAtivas.length > 0) {
      htmlContent += `
        <div class="mt-3 p-2 border border-warning rounded">
          <p class="text-warning mb-1"><strong>Suas consultas ativas:</strong></p>
          ${this.consultasAtivas
            .map(
              (consulta) =>
                `<p class="mb-0 small">• ${
                  consulta.especialidade
                } - ${this.formatarDataExibicao(consulta.data)} ${
                  consulta.hora
                }</p>`
            )
            .join('')}
        </div>
      `;
    }

    htmlContent += `</div>`;

    Swal.fire({
      title: 'Confirmar Agendamento',
      html: htmlContent,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-outline-secondary',
        popup: 'swal2-border-radius',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.schedulingService.criarAgendamento(agendamento).subscribe({
          next: (agendamentoCriado) => {
            Swal.fire({
              title: 'Agendamento Confirmado!',
              text: 'Sua consulta foi agendada com sucesso.',
              icon: 'success',
              confirmButtonText: 'OK',
            }).then(() => {
              this.router.navigate(['/paciente/consultas']);
            });
          },
          error: (err) => {
            console.error('Erro ao criar agendamento', err);

            let mensagemErro =
              'Não foi possível agendar a consulta. Tente novamente.';

            if (err.message?.includes('já possui uma consulta agendada')) {
              mensagemErro = err.message;
              // Recarregar consultas ativas para atualizar a lista
              this.carregarConsultasAtivas();
            }

            Swal.fire('Erro', mensagemErro, 'error');
          },
        });
      }
    });
  }

  private marcarCamposComoSujos(): void {
    Object.keys(this.agendamentoForm.controls).forEach((key) => {
      const control = this.agendamentoForm.get(key);
      control?.markAsDirty();
      control?.markAsTouched();
    });
  }

  formatarDataExibicao(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR');
  }

  getErroData(): string {
    const dataControl = this.agendamentoForm.get('data');
    if (dataControl?.errors?.['required']) {
      return 'Por favor, selecione uma data.';
    }
    if (dataControl?.errors?.['dataInvalida']) {
      return 'A data não pode ser anterior ao dia de hoje.';
    }
    return '';
  }
}
