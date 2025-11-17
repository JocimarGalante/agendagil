// src/app/scheduling/scheduling.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from '../core/services/supabase.service';
import { Agendamento, Especialidade, Medico } from '@models/agendamento.model';

@Injectable({
  providedIn: 'root'
})
export class SchedulingService {
  private readonly API_URL = 'https://agendagil-api.vercel.app';

  constructor(
    private http: HttpClient,
    private supabaseService: SupabaseService
  ) {}

  getEspecialidades(): Observable<Especialidade[]> {
    return from(
      this.supabaseService.getClient()
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
          id: especialidade.id, // Manter como UUID
          nome: especialidade.nome
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
      this.supabaseService.getClient()
        .from('medicos')
        .select('*')
        .eq('especialidade_id', especialidadeId) // Usar UUID diretamente
        .order('nome')
    ).pipe(
      map((result: any) => {
        if (result.error) {
          console.error('Erro ao buscar médicos:', result.error);
          throw result.error;
        }

        console.log(`Médicos encontrados para especialidade ${especialidadeId}:`, result.data);

        const medicos = result.data.map((medico: any) => ({
          id: medico.id, // Manter como UUID
          nome: medico.nome,
          especialidadeId: medico.especialidade_id, // Manter como UUID
          crm: medico.crm,
          local: medico.local
        }));

        console.log('Médicos convertidos:', medicos);
        return medicos;
      }),
      catchError((error) => {
        console.error('Erro completo ao carregar médicos:', error);
        // Fallback para JSON Server (ajustar se necessário)
        return this.http.get<Medico[]>(`${this.API_URL}/medicos`);
      })
    );
  }

  criarAgendamento(agendamento: Agendamento): Observable<Agendamento> {
    console.log('Criando agendamento:', agendamento);

    const consultaSupabase = {
      paciente: agendamento.paciente,
      paciente_id: agendamento.pacienteId,
      medico: agendamento.medico,
      medico_id: agendamento.medicoId, // UUID do médico
      especialidade: agendamento.especialidade,
      especialidade_id: agendamento.especialidadeId, // UUID da especialidade
      local: agendamento.local,
      data: agendamento.data,
      hora: agendamento.hora,
      status: agendamento.status,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    };

    console.log('Dados para inserir no Supabase:', consultaSupabase);

    return from(
      this.supabaseService.getClient()
        .from('consultas')
        .insert([consultaSupabase])
        .select()
        .single()
    ).pipe(
      map((result: any) => {
        if (result.error) {
          console.error('Erro ao criar agendamento:', result.error);
          throw result.error;
        }

        console.log('Agendamento criado com sucesso:', result.data);

        return {
          ...agendamento,
          id: result.data.id
        };
      }),
      catchError((error) => {
        console.error('Erro completo ao criar agendamento:', error);
        throw error;
      })
    );
  }

  getHorariosDisponiveis(medicoId: string, data: string): Observable<string[]> {
    console.log('Buscando horários para médico UUID:', medicoId, 'data:', data);

    // Validação básica
    if (!medicoId || !data) {
      console.error('Parâmetros inválidos:', { medicoId, data });
      return of(this.getHorariosPadrao());
    }

    return from(
      this.supabaseService.getClient()
        .from('disponibilidades_medicos')
        .select('horarios_disponiveis, horarios_ocupados')
        .eq('medico_id', medicoId) // Usar UUID diretamente
        .eq('data', data)
        .single()
    ).pipe(
      map((result: any) => {
        if (result.error) {
          console.error('Erro ao buscar disponibilidade:', result.error);
          return this.getHorariosPadrao();
        }

        if (!result.data) {
          console.log('Nenhuma disponibilidade encontrada, usando horários padrão');
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

  // Método para debug - ver todos os médicos
  debugMedicos(): Observable<any> {
    return from(
      this.supabaseService.getClient()
        .from('medicos')
        .select(`
          *,
          especialidades (nome)
        `)
        .order('nome')
    ).pipe(
      map((result: any) => {
        if (result.error) throw result.error;

        console.log('=== DEBUG MÉDICOS ===');
        result.data.forEach((medico: any) => {
          console.log(`Médico: ${medico.nome} | ID: ${medico.id} | Especialidade: ${medico.especialidades.nome}`);
        });

        return result.data;
      })
    );
  }

  // Método para debug - ver todas as especialidades
  debugEspecialidades(): Observable<any> {
    return from(
      this.supabaseService.getClient()
        .from('especialidades')
        .select('*')
        .order('nome')
    ).pipe(
      map((result: any) => {
        if (result.error) throw result.error;

        console.log('=== DEBUG ESPECIALIDADES ===');
        result.data.forEach((especialidade: any) => {
          console.log(`Especialidade: ${especialidade.nome} | ID: ${especialidade.id}`);
        });

        return result.data;
      })
    );
  }

  private getHorariosPadrao(): string[] {
    return ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
  }
}
