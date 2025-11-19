import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SupabaseService } from '../core/services/supabase.service';
import { Agendamento, Especialidade, Medico } from '@models/agendamento.model';
import { AuthService } from '@auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class SchedulingService {
  private readonly API_URL = 'https://agendagil-api.vercel.app';

  constructor(
    private http: HttpClient,
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {}

  getEspecialidades(): Observable<Especialidade[]> {
    return from(
      this.supabaseService
        .getClient()
        .from('especialidades')
        .select('*')
        .order('nome')
    ).pipe(
      map((result: any) => {
        if (result.error) {
          console.error('Erro ao carregar especialidades:', result.error);
          throw result.error;
        }

        const especialidades = result.data.map((especialidade: any) => ({
          id: especialidade.id,
          nome: especialidade.nome,
        }));

        return especialidades;
      }),
      catchError((error) => {
        console.error('Erro completo ao carregar especialidades:', error);
        return this.http.get<Especialidade[]>(`${this.API_URL}/especialidades`);
      })
    );
  }

  getMedicosPorEspecialidade(especialidadeId: string): Observable<Medico[]> {
    return from(
      this.supabaseService
        .getClient()
        .from('medicos')
        .select('*')
        .eq('especialidade_id', especialidadeId)
        .order('nome')
    ).pipe(
      map((result: any) => {
        if (result.error) {
          console.error('Erro ao buscar médicos:', result.error);
          throw result.error;
        }

        const medicos = result.data.map((medico: any) => ({
          id: medico.id,
          nome: medico.nome,
          especialidadeId: medico.especialidade_id,
          crm: medico.crm,
          local: medico.local,
        }));

        return medicos;
      }),
      catchError((error) => {
        console.error('Erro completo ao carregar médicos:', error);
        return this.http.get<Medico[]>(`${this.API_URL}/medicos`);
      })
    );
  }

  criarAgendamento(agendamento: Agendamento): Observable<Agendamento> {
    return from(this.supabaseService.getCurrentUserId()).pipe(
      switchMap((pacienteId) => {
        if (!pacienteId) {
          throw new Error('Usuário não autenticado');
        }

        return forkJoin({
          existeAgendamento: this.verificarAgendamentoExistente(
            pacienteId,
            agendamento.especialidadeId
          ),
          existeConflitoHorario: this.verificarConflitoHorario(
            agendamento.medicoId,
            agendamento.data,
            agendamento.hora
          )
        }).pipe(
          switchMap(({ existeAgendamento, existeConflitoHorario }) => {
            if (existeAgendamento) {
              throw new Error(
                `Você já possui uma consulta agendada para ${agendamento.especialidade}. Cancele a consulta existente antes de agendar uma nova.`
              );
            }

            if (existeConflitoHorario) {
              throw new Error(
                `O médico ${agendamento.medico} já possui uma consulta agendada para ${this.formatarData(
                  agendamento.data
                )} às ${agendamento.hora}. Por favor, escolha outro horário.`
              );
            }

            return this.tentarAgendamentoAtomico(agendamento, pacienteId);
          })
        );
      }),
      catchError((error) => {
        console.error('Erro completo ao criar agendamento:', error);
        throw error;
      })
    );
  }

  private verificarConflitoHorario(
    medicoId: string,
    data: string,
    hora: string
  ): Observable<boolean> {
    const medicoUUID = this.ensureUUID(medicoId);
    const horaFormatada = this.formatarHoraParaComparacao(hora);

    return from(
      this.supabaseService
        .getClient()
        .from('consultas')
        .select('id, paciente, medico')
        .eq('medico_id', medicoUUID)
        .eq('data', data)
        .in('status', [1, 2])
        .maybeSingle()
    ).pipe(
      map((result: any) => {
        if (!result.data) return false;

        // Converter hora do banco para formato de comparação
        const horaBanco = this.formatarHoraParaComparacao(result.data.hora);
        return horaBanco === horaFormatada;
      }),
      catchError((error) => {
        if (error.code === 'PGRST116') {
          return of(false);
        }
        console.error('Erro ao verificar conflito de horário:', error);
        return of(false);
      })
    );
  }

  private tentarAgendamentoAtomico(
    agendamento: Agendamento,
    pacienteId: string
  ): Observable<Agendamento> {
    // Garantir formato correto da hora para o banco
    const horaFormatada = this.formatarHoraParaBanco(agendamento.hora);

    const consultaSupabase = {
      paciente: agendamento.paciente,
      paciente_id: pacienteId,
      medico: agendamento.medico,
      medico_id: this.ensureUUID(agendamento.medicoId),
      especialidade: agendamento.especialidade,
      especialidade_id: this.ensureUUID(agendamento.especialidadeId),
      local: agendamento.local,
      data: agendamento.data,
      hora: horaFormatada,
      status: agendamento.status,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    };

    return from(
      this.supabaseService
        .getClient()
        .from('consultas')
        .insert([consultaSupabase])
        .select()
        .single()
    ).pipe(
      map((result: any) => {
        if (result.error) {
          if (result.error.code === '23505') {
            throw new Error(
              `O médico ${agendamento.medico} já possui uma consulta agendada para ${this.formatarData(
                agendamento.data
              )} às ${agendamento.hora}. Por favor, escolha outro horário.`
            );
          }

          console.error('Erro ao criar agendamento:', result.error);
          throw result.error;
        }

        return {
          ...agendamento,
          id: result.data.id,
        };
      })
    );
  }

  private formatarHoraParaBanco(hora: string): string {
    // Converter "HH:MM" para "HH:MM:SS"
    if (hora && hora.length === 5 && hora.includes(':')) {
      return `${hora}:00`;
    }
    return hora;
  }

  private formatarHoraParaComparacao(hora: string): string {
    // Converter "HH:MM:SS" para "HH:MM" para comparação
    if (hora && hora.includes(':')) {
      const parts = hora.split(':');
      return `${parts[0]}:${parts[1]}`;
    }
    return hora;
  }

  private formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR');
  }

  private verificarAgendamentoExistente(
    pacienteId: string,
    especialidadeId: string
  ): Observable<boolean> {
    return from(
      this.supabaseService
        .getClient()
        .from('consultas')
        .select('id, especialidade, status')
        .eq('paciente_id', pacienteId)
        .eq('especialidade_id', especialidadeId)
        .in('status', [1, 2])
    ).pipe(
      map((result: any) => {
        if (result.error) {
          console.error(
            'Erro ao verificar agendamentos existentes:',
            result.error
          );
          return false;
        }

        const agendamentosExistentes = result.data || [];
        return agendamentosExistentes.length > 0;
      }),
      catchError((error) => {
        console.error('Erro ao verificar agendamentos existentes:', error);
        return of(false);
      })
    );
  }

  getConsultasAtivasDoUsuario(): Observable<any[]> {
    return from(this.supabaseService.getCurrentUserId()).pipe(
      switchMap((pacienteId) => {
        if (!pacienteId) {
          return of([]);
        }

        return from(
          this.supabaseService
            .getClient()
            .from('consultas')
            .select('id, especialidade, data, hora, status')
            .eq('paciente_id', pacienteId)
            .in('status', [1, 2])
            .order('data', { ascending: true })
        );
      }),
      map((result: any) => {
        if (result.error) {
          console.error('Erro ao buscar consultas ativas:', result.error);
          return [];
        }
        return result.data || [];
      })
    );
  }

  private ensureUUID(id: string): string {
    if (this.isValidUUID(id)) {
      return id;
    }

    if (!isNaN(Number(id))) {
      const numericId = Number(id);
      const hex = numericId.toString(16).padStart(8, '0');
      return `00000000-0000-4000-8000-${hex.padStart(12, '0')}`;
    }

    return this.generateUUID();
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  getHorariosDisponiveis(medicoId: string, data: string): Observable<string[]> {
    const medicoUUID = this.ensureUUID(medicoId);

    return from(
      this.supabaseService
        .getClient()
        .from('consultas')
        .select('hora')
        .eq('medico_id', medicoUUID)
        .eq('data', data)
        .in('status', [1, 2])
    ).pipe(
      map((result: any) => {
        if (result.error) {
          console.error('Erro ao buscar horários ocupados:', result.error);
          return this.getHorariosPadrao();
        }

        // Converter horários do banco para formato de comparação
        const horariosOcupados = result.data?.map((consulta: any) =>
          this.formatarHoraParaComparacao(consulta.hora)
        ) || [];

        const todosHorarios = this.getHorariosPadrao();

        // Filtrar horários não ocupados
        const horariosLivres = todosHorarios.filter(
          (horario) => !horariosOcupados.includes(horario)
        );

        return horariosLivres;
      }),
      catchError((error) => {
        console.error('Erro ao carregar horários disponíveis:', error);
        return of(this.getHorariosPadrao());
      })
    );
  }

  private getHorariosPadrao(): string[] {
    return [
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
    ];
  }
}
