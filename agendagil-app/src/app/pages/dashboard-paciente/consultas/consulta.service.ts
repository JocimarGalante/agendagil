import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { Consulta } from '@models/consulta.model';
import { SupabaseService } from 'core/services/supabase.service';
import { ModelConverter } from 'core/helpers/model-converters';

@Injectable({
  providedIn: 'root',
})
export class ConsultaService {
  constructor(private supabaseService: SupabaseService) {}

  getConsultas(): Observable<Consulta[]> {
    return from(this.supabaseService.getCurrentUser()).pipe(
      switchMap((user) => {
        if (!user) {
          throw new Error('Usuário não autenticado');
        }

        const userId = user.id;

        return from(
          this.supabaseService
            .getClient()
            .from('consultas')
            .select('*')
            .eq('paciente_id', userId)
            .order('data', { ascending: true })
            .order('hora', { ascending: true })
        );
      }),
      map((result: any) => {
        if (result.error) {
          console.error('Erro ao buscar consultas:', result.error);
          throw result.error;
        }

        return result.data.map((consulta: any) =>
          ModelConverter.fromSupabaseConsulta(consulta)
        );
      }),
      catchError((error: any) => {
        console.error('Erro completo ao buscar consultas:', error);
        throw error;
      })
    );
  }

  getConsultaPorId(id: string): Observable<Consulta> {
    return from(this.supabaseService.getCurrentUser()).pipe(
      switchMap((user) => {
        if (!user) {
          throw new Error('Usuário não autenticado');
        }

        return from(
          this.supabaseService
            .getClient()
            .from('consultas')
            .select('*')
            .eq('id', id)
            .eq('paciente_id', user.id)
            .single()
        );
      }),
      map((result: any) => {
        if (result.error) throw result.error;
        return ModelConverter.fromSupabaseConsulta(result.data);
      })
    );
  }

  criarConsulta(consulta: Consulta): Observable<Consulta> {
    return from(this.supabaseService.getCurrentUser()).pipe(
      switchMap((user) => {
        if (!user) {
          throw new Error('Usuário não autenticado');
        }

        const consultaSupabase = ModelConverter.toSupabaseConsulta(consulta);

        consultaSupabase.paciente_id = user.id;

        if (!consultaSupabase.id || this.isNumber(consultaSupabase.id)) {
          consultaSupabase.id = this.generateUUID();
        }

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
        if (result.error) throw result.error;
        return ModelConverter.fromSupabaseConsulta(result.data);
      })
    );
  }

  atualizarConsulta(id: string, consulta: Consulta): Observable<Consulta> {
    return from(this.supabaseService.getCurrentUser()).pipe(
      switchMap((user) => {
        if (!user) {
          throw new Error('Usuário não autenticado');
        }

        const consultaSupabase = ModelConverter.toSupabaseConsulta(consulta);

        consultaSupabase.id = id;

        consultaSupabase.paciente_id = user.id;

        return from(
          this.supabaseService
            .getClient()
            .from('consultas')
            .update(consultaSupabase)
            .eq('id', id)
            .eq('paciente_id', user.id)
            .select()
            .single()
        );
      }),
      map((result: any) => {
        if (result.error) {
          console.error('Erro ao atualizar consulta:', result.error);
          throw result.error;
        }
        return ModelConverter.fromSupabaseConsulta(result.data);
      }),
      catchError((error) => {
        console.error('Erro completo ao atualizar consulta:', error);
        throw error;
      })
    );
  }

  cancelarConsulta(id: string): Observable<Consulta> {
    return from(this.supabaseService.getCurrentUser()).pipe(
      switchMap((user) => {
        if (!user) {
          throw new Error('Usuário não autenticado');
        }

        return from(
          this.supabaseService
            .getClient()
            .from('consultas')
            .update({
              status: 0,
              atualizado_em: new Date().toISOString()
            })
            .eq('id', id)
            .eq('paciente_id', user.id)
            .select()
            .single()
        );
      }),
      map((result: any) => {
        if (result.error) {
          console.error('Erro ao cancelar consulta:', result.error);
          throw result.error;
        }
        return ModelConverter.fromSupabaseConsulta(result.data);
      }),
      catchError((error) => {
        console.error('Erro completo ao cancelar consulta:', error);
        throw error;
      })
    );
  }

  reagendarConsulta(id: string, novaData: string, novaHora: string): Observable<Consulta> {
    return from(this.supabaseService.getCurrentUser()).pipe(
      switchMap((user) => {
        if (!user) {
          throw new Error('Usuário não autenticado');
        }

        return from(
          this.supabaseService
            .getClient()
            .from('consultas')
            .update({
              data: novaData,
              hora: novaHora,
              atualizado_em: new Date().toISOString()
            })
            .eq('id', id)
            .eq('paciente_id', user.id)
            .select()
            .single()
        );
      }),
      map((result: any) => {
        if (result.error) {
          console.error('Erro ao reagendar consulta:', result.error);
          throw result.error;
        }
        return ModelConverter.fromSupabaseConsulta(result.data);
      }),
      catchError((error) => {
        console.error('Erro completo ao reagendar consulta:', error);
        throw error;
      })
    );
  }

  deletarConsulta(id: string): Observable<void> {
    return from(this.supabaseService.getCurrentUser()).pipe(
      switchMap((user) => {
        if (!user) {
          throw new Error('Usuário não autenticado');
        }

        return from(
          this.supabaseService
            .getClient()
            .from('consultas')
            .delete()
            .eq('id', id)
            .eq('paciente_id', user.id)
        );
      }),
      map((result: any) => {
        if (result.error) throw result.error;
        return;
      })
    );
  }

  private isNumber(value: any): boolean {
    return !isNaN(parseFloat(value)) && isFinite(value);
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
}
