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
  medicos: Medico[] = [];
  medicosFiltrados: Medico[] = [];
  horariosDisponiveis: string[] = [];
  usuario: UsuarioBase | null = null;
  carregandoMedicos = false;
  carregandoHorarios = false;

  constructor(
    private fb: FormBuilder,
    private agendamentoService: SchedulingService,
    private authService: AuthService,
    private router: Router
  ) {
    this.agendamentoForm = this.criarForm();
  }

  ngOnInit(): void {
    this.usuario = this.authService.getUsuarioLogado();
    this.carregarEspecialidades();
    this.observarMudancasForm();
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
    this.agendamentoService.getEspecialidades().subscribe({
      next: (especialidades) => {
        this.especialidades = especialidades;
      },
      error: (erro) => {
        console.error('Erro ao carregar especialidades', erro);
        this.mostrarErro('Não foi possível carregar as especialidades');
      },
    });
  }

  carregarMedicos(especialidadeId: number): void {
    this.carregandoMedicos = true;
    this.agendamentoService
      .getMedicosPorEspecialidade(especialidadeId)
      .subscribe({
        next: (medicos) => {
          this.medicosFiltrados = medicos;
          this.carregandoMedicos = false;
          this.agendamentoForm.patchValue({ medicoId: '' });
        },
        error: (erro) => {
          console.error('Erro ao carregar médicos', erro);
          this.carregandoMedicos = false;
          this.mostrarErro('Não foi possível carregar os médicos');
        },
      });
  }

  carregarHorarios(medicoId: number, data: string): void {
    this.carregandoHorarios = true;
    this.agendamentoService.getHorariosDisponiveis(medicoId, data).subscribe({
      next: (horarios) => {
        this.horariosDisponiveis = horarios;
        this.carregandoHorarios = false;
        this.agendamentoForm.patchValue({ hora: '' });
      },
      error: (erro) => {
        console.error('Erro ao carregar horários', erro);
        this.carregandoHorarios = false;
        this.horariosDisponiveis = [];
      },
    });
  }

  observarMudancasForm(): void {
    this.agendamentoForm
      .get('especialidadeId')
      ?.valueChanges.subscribe((especialidadeId) => {
        if (especialidadeId) {
          this.carregarMedicos(especialidadeId);
        } else {
          this.medicosFiltrados = [];
          this.agendamentoForm.patchValue({ medicoId: '' });
        }
      });

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

  // scheduling/agenda-form/agenda-form.component.ts

  getMedicoSelecionado(): Medico | undefined {
    const medicoId = this.agendamentoForm.get('medicoId')?.value;
    console.log('Buscando médico com ID:', medicoId, 'Tipo:', typeof medicoId);

    if (!medicoId) return undefined;

    // Converte o ID do form para número para comparar com os IDs dos médicos
    const medicoIdNumber = Number(medicoId);
    const medico = this.medicosFiltrados.find((m) => m.id === medicoIdNumber);

    console.log('Médico encontrado:', medico);
    return medico;
  }

  getEspecialidadeSelecionada(): Especialidade | undefined {
    const especialidadeId = this.agendamentoForm.get('especialidadeId')?.value;
    console.log(
      'Buscando especialidade com ID:',
      especialidadeId,
      'Tipo:',
      typeof especialidadeId
    );

    if (!especialidadeId) return undefined;

    // Converte o ID do form para número para comparar com os IDs das especialidades
    const especialidadeIdNumber = Number(especialidadeId);
    const especialidade = this.especialidades.find(
      (e) => e.id === especialidadeIdNumber
    );

    console.log('Especialidade encontrada:', especialidade);
    return especialidade;
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

  onSubmit(): void {
    console.log('Form Value:', this.agendamentoForm.value);
    console.log('Form Valid:', this.agendamentoForm.valid);
    console.log('Usuário:', this.usuario);
    if (this.agendamentoForm.valid && this.usuario) {
      const formValue = this.agendamentoForm.value;
      const medico = this.getMedicoSelecionado();
      const especialidade = this.getEspecialidadeSelecionada();

      console.log('Médico selecionado:', medico);
      console.log('Especialidade selecionada:', especialidade);
      console.log('Médico ID do form:', formValue.medicoId);
      console.log('Especialidade ID do form:', formValue.especialidadeId);
      console.log('Médicos filtrados:', this.medicosFiltrados);
      console.log('Especialidades:', this.especialidades);

      if (!medico || !especialidade) {
        this.mostrarErro('Dados incompletos para o agendamento');
        return;
      }

      const agendamento: Agendamento = {
        paciente: this.usuario.nome,
        pacienteId: this.usuario.id,
        medico: medico.nome,
        medicoId: medico.id,
        especialidade: especialidade.nome,
        especialidadeId: especialidade.id,
        local: medico.local,
        data: formValue.data,
        hora: formValue.hora,
        status: StatusConsulta.Agendada,
      };

      this.confirmarAgendamento(agendamento);
    } else {
      this.marcarCamposComoSujos();
    }
  }

  private confirmarAgendamento(agendamento: Agendamento): void {
    Swal.fire({
      title: 'Confirmar Agendamento',
      html: `
        <div class="text-start">
          <p><strong>Paciente:</strong> ${agendamento.paciente}</p>
          <p><strong>Médico:</strong> ${agendamento.medico}</p>
          <p><strong>Especialidade:</strong> ${agendamento.especialidade}</p>
          <p><strong>Local:</strong> ${agendamento.local}</p>
          <p><strong>Data:</strong> ${this.formatarDataExibicao(
            agendamento.data
          )}</p>
          <p><strong>Horário:</strong> ${agendamento.hora}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.agendamentoService.criarAgendamento(agendamento).subscribe({
          next: () => {
            Swal.fire({
              title: 'Agendamento Confirmado!',
              text: 'Sua consulta foi agendada com sucesso.',
              icon: 'success',
              confirmButtonText: 'OK',
            }).then(() => {
              this.router.navigate(['/paciente/consultas']);
            });
          },
          error: (erro) => {
            console.error('Erro ao criar agendamento', erro);
            this.mostrarErro(
              'Não foi possível agendar a consulta. Tente novamente.'
            );
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

  private mostrarErro(mensagem: string): void {
    Swal.fire('Erro', mensagem, 'error');
  }

  formatarDataExibicao(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR');
  }
}
