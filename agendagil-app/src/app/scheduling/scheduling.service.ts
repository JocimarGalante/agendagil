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

        console.log('Especialidades carregadas:', especialidades);
        return especialidades;
      }),
      catchError((error) => {
        console.error('Erro completo ao carregar especialidades:', error);
        return this.http.get<Especialidade[]>(`${this.API_URL}/especialidades`);
      })
    );
  }

  getMedicosPorEspecialidade(especialidadeId: string): Observable<Medico[]> {
    console.log('Buscando médicos para especialidade UUID:', especialidadeId);

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

        console.log(
          `Médicos encontrados para especialidade ${especialidadeId}:`,
          result.data
        );

        const medicos = result.data.map((medico: any) => ({
          id: medico.id,
          nome: medico.nome,
          especialidadeId: medico.especialidade_id,
          crm: medico.crm,
          local: medico.local,
        }));

        console.log('Médicos convertidos:', medicos);
        return medicos;
      }),
      catchError((error) => {
        console.error('Erro completo ao carregar médicos:', error);
        return this.http.get<Medico[]>(`${this.API_URL}/medicos`);
      })
    );
  }

  criarAgendamento(agendamento: Agendamento): Observable<Agendamento> {
    console.log('Criando agendamento:', agendamento);

    // Usar o método helper do SupabaseService
    return from(this.supabaseService.getCurrentUser()).pipe(
      switchMap((user) => {
        if (!user) {
          throw new Error('Usuário não autenticado');
        }

        // Usar o UUID real do usuário autenticado do Supabase Auth
        const pacienteId = user.id;

        console.log('UUID real do usuário:', pacienteId);

        // VALIDAÇÃO: Garantir que todos os IDs sejam UUIDs válidos
        const consultaSupabase = {
          paciente: agendamento.paciente,
          paciente_id: pacienteId, // UUID real do usuário autenticado
          medico: agendamento.medico,
          medico_id: this.ensureUUID(agendamento.medicoId), // Garantir UUID válido
          especialidade: agendamento.especialidade,
          especialidade_id: this.ensureUUID(agendamento.especialidadeId), // Garantir UUID válido
          local: agendamento.local,
          data: agendamento.data,
          hora: agendamento.hora,
          status: agendamento.status,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
        };

        console.log('Dados para inserir no Supabase:', consultaSupabase);

        return from(
          this.supabaseService
            .getClient()
            .from('consultas')
            .insert([consultaSupabase])
            .select()
            .single()
        );
      }),
      map((result: any) => {
        if (result.error) {
          console.error('Erro ao criar agendamento:', result.error);
          throw result.error;
        }

        console.log('Agendamento criado com sucesso:', result.data);
        return {
          ...agendamento,
          id: result.data.id,
        };
      }),
      catchError((error) => {
        console.error('Erro completo ao criar agendamento:', error);

        // Tratamento específico para erro de RLS
        if (
          error.message?.includes('row-level security') ||
          error.code === '42501'
        ) {
          throw new Error(
            'Permissão negada. Verifique as políticas de segurança da tabela consultas.'
          );
        }

        // Tratamento específico para erro de tipo UUID
        if (error.message?.includes('invalid input syntax for type uuid')) {
          throw new Error(
            'Erro de tipo de dados. Verifique se todos os IDs são UUIDs válidos.'
          );
        }

        throw error;
      })
    );
  }

  // Método para garantir que o ID seja um UUID válido
  private ensureUUID(id: string): string {
    // Se já é um UUID válido, retornar como está
    if (this.isValidUUID(id)) {
      return id;
    }

    // Se for número, converter para UUID determinístico
    if (!isNaN(Number(id))) {
      const numericId = Number(id);
      const hex = numericId.toString(16).padStart(8, '0');
      return `00000000-0000-4000-8000-${hex.padStart(12, '0')}`;
    }

    // Se for outra coisa, gerar UUID aleatório
    return this.generateUUID();
  }

  // Método para validar UUID
  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // Método para gerar UUID v4
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
    console.log('Buscando horários para médico UUID:', medicoId, 'data:', data);

    if (!medicoId || !data) {
      console.error('Parâmetros inválidos:', { medicoId, data });
      return of(this.getHorariosPadrao());
    }

    return from(
      this.supabaseService
        .getClient()
        .from('disponibilidades_medicos')
        .select('horarios_disponiveis, horarios_ocupados')
        .eq('medico_id', medicoId)
        .eq('data', data)
        .single()
    ).pipe(
      map((result: any) => {
        if (result.error) {
          console.error('Erro ao buscar disponibilidade:', result.error);
          return this.getHorariosPadrao();
        }

        if (!result.data) {
          console.log(
            'Nenhuma disponibilidade encontrada, usando horários padrão'
          );
          return this.getHorariosPadrao();
        }

        const horariosDisponiveis = result.data.horarios_disponiveis || [];
        const horariosOcupados = result.data.horarios_ocupados || [];

        const horariosLivres = horariosDisponiveis.filter(
          (horario: string) => !horariosOcupados.includes(horario)
        );

        console.log('Horários livres encontrados:', horariosLivres);
        return horariosLivres;
      }),
      catchError((error) => {
        console.error('Erro ao carregar horários disponíveis:', error);
        return of(this.getHorariosPadrao());
      })
    );
  }

  // Métodos de debug
  debugMedicos(): Observable<any> {
    return from(
      this.supabaseService.getClient().from('medicos').select('*').order('nome')
    ).pipe(
      map((result: any) => {
        if (result.error) throw result.error;

        console.log('=== DEBUG MÉDICOS ===');
        result.data.forEach((medico: any) => {
          console.log(
            `Médico: ${medico.nome} | ID: ${medico.id} | Especialidade ID: ${medico.especialidade_id}`
          );
        });

        return result.data;
      })
    );
  }

  debugEspecialidades(): Observable<any> {
    return from(
      this.supabaseService
        .getClient()
        .from('especialidades')
        .select('*')
        .order('nome')
    ).pipe(
      map((result: any) => {
        if (result.error) throw result.error;

        console.log('=== DEBUG ESPECIALIDADES ===');
        result.data.forEach((especialidade: any) => {
          console.log(
            `Especialidade: ${especialidade.nome} | ID: ${especialidade.id}`
          );
        });

        return result.data;
      })
    );
  }

  // Método para debug das consultas
  debugConsultas(): Observable<any> {
    return from(
      this.supabaseService
        .getClient()
        .from('consultas')
        .select('*')
        .order('data', { ascending: false })
    ).pipe(
      map((result: any) => {
        if (result.error) throw result.error;

        console.log('=== DEBUG CONSULTAS ===');
        result.data.forEach((consulta: any) => {
          console.log(
            `Consulta: ${consulta.paciente} | Paciente ID: ${consulta.paciente_id} | Médico ID: ${consulta.medico_id} | Status: ${consulta.status}`
          );
        });

        return result.data;
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
