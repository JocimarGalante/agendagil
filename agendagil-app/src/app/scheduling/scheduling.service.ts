import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
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

        return this.verificarAgendamentoExistente(
          pacienteId,
          agendamento.especialidadeId
        ).pipe(
          switchMap((jaExisteAgendamento) => {
            if (jaExisteAgendamento) {
              throw new Error(
                `Você já possui uma consulta agendada para ${agendamento.especialidade}. Cancele a consulta existente antes de agendar uma nova.`
              );
            }

            // NOVA VALIDAÇÃO: Verificar se o médico já está ocupado no horário
            return this.verificarMedicoOcupado(
              agendamento.medicoId,
              agendamento.data,
              agendamento.hora
            ).pipe(
              switchMap((medicoOcupado) => {
                if (medicoOcupado) {
                  throw new Error(
                    `O médico ${agendamento.medico} já possui uma consulta agendada para ${agendamento.data} às ${agendamento.hora}. Por favor, escolha outro horário.`
                  );
                }

                const consultaSupabase = {
                  paciente: agendamento.paciente,
                  paciente_id: pacienteId,
                  medico: agendamento.medico,
                  medico_id: this.ensureUUID(agendamento.medicoId),
                  especialidade: agendamento.especialidade,
                  especialidade_id: this.ensureUUID(
                    agendamento.especialidadeId
                  ),
                  local: agendamento.local,
                  data: agendamento.data,
                  hora: agendamento.hora,
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
                );
              })
            );
          })
        );
      }),
      map((result: any) => {
        if (result.error) {
          console.error('Erro ao criar agendamento:', result.error);
          throw result.error;
        }

        return {
          ...agendamento,
          id: result.data.id,
        };
      }),
      catchError((error) => {
        console.error('Erro completo ao criar agendamento:', error);

        if (
          error.message?.includes('row-level security') ||
          error.code === '42501'
        ) {
          throw new Error(
            'Permissão negada. Verifique as políticas de segurança da tabela consultas.'
          );
        }

        if (error.message?.includes('invalid input syntax for type uuid')) {
          throw new Error(
            'Erro de tipo de dados. Verifique se todos os IDs são UUIDs válidos.'
          );
        }

        throw error;
      })
    );
  }

  // NOVO MÉTODO: Verificar se o médico está ocupado no horário
  private verificarMedicoOcupado(
    medicoId: string,
    data: string,
    hora: string
  ): Observable<boolean> {
    return from(
      this.supabaseService
        .getClient()
        .from('consultas')
        .select('id')
        .eq('medico_id', medicoId)
        .eq('data', data)
        .eq('hora', hora)
        .in('status', [1, 2]) // Status: Agendada (1) ou Confirmada (2)
        .single()
    ).pipe(
      map((result: any) => {
        if (result.error) {
          // Se não encontrar registro, significa que o médico está livre
          if (result.error.code === 'PGRST116') {
            return false;
          }
          console.error(
            'Erro ao verificar disponibilidade do médico:',
            result.error
          );
          return false; // Em caso de erro, permite o agendamento (fail-open)
        }

        // Se encontrou um registro, médico está ocupado
        return true;
      }),
      catchError((error) => {
        console.error('Erro ao verificar disponibilidade do médico:', error);
        return of(false); // Em caso de erro, permite o agendamento
      })
    );
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
        .in('status', [1, 2]) // Status: Agendada (1) ou Confirmada (2)
    ).pipe(
      map((result: any) => {
        if (result.error) {
          console.error(
            'Erro ao verificar agendamentos existentes:',
            result.error
          );
          return false; // Em caso de erro, permite o agendamento
        }

        const agendamentosExistentes = result.data || [];

        return agendamentosExistentes.length > 0;
      }),
      catchError((error) => {
        console.error('Erro ao verificar agendamentos existentes:', error);
        return of(false); // Em caso de erro, permite o agendamento
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
            .in('status', [1, 2]) // Status: Agendada (1) ou Confirmada (2)
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
    if (!medicoId || !data) {
      console.error('Parâmetros inválidos:', { medicoId, data });
      return of(this.getHorariosPadrao());
    }

    return from(
      this.supabaseService
        .getClient()
        .from('disponibilidades_medicos')
        .select('horarios_disponiveis')
        .eq('medico_id', medicoId)
        .eq('data', data)
        .single()
    ).pipe(
      switchMap((disponibilidadeResult: any) => {
        let horariosDisponiveis = this.getHorariosPadrao();

        if (disponibilidadeResult.data) {
          horariosDisponiveis =
            disponibilidadeResult.data.horarios_disponiveis ||
            horariosDisponiveis;
        }

        // Buscar horários já ocupados pelo médico
        return from(
          this.supabaseService
            .getClient()
            .from('consultas')
            .select('hora')
            .eq('medico_id', medicoId)
            .eq('data', data)
            .in('status', [1, 2]) // Status: Agendada (1) ou Confirmada (2)
        ).pipe(
          map((consultasResult: any) => {
            const horariosOcupados =
              consultasResult.data?.map((consulta: any) => consulta.hora) || [];

            // Filtrar horários disponíveis removendo os ocupados
            const horariosLivres = horariosDisponiveis.filter(
              (horario: string) => !horariosOcupados.includes(horario)
            );

            return horariosLivres;
          })
        );
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
