// src/app/consultas/consulta.service.ts
import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Consulta } from '@models/consulta.model';
import { SupabaseService } from 'core/services/supabase.service';
import { ModelConverter } from 'core/helpers/model-converters';

@Injectable({
  providedIn: 'root'
})
export class ConsultaService {
  constructor(private supabaseService: SupabaseService) {}

  getConsultas(): Observable<Consulta[]> {
    return from(
      this.supabaseService.getClient()
        .from('consultas')
        .select('*')
        .order('data', { ascending: true })
        .order('hora', { ascending: true })
    ).pipe(
      map((result: any) => {
        if (result.error) throw result.error;
        return result.data.map((consulta: any) =>
          ModelConverter.fromSupabaseConsulta(consulta)
        );
      }),
      catchError((error: any) => {
        console.error('Erro ao buscar consultas:', error);
        throw error;
      })
    );
  }

  getConsultaPorId(id: string): Observable<Consulta> {
    return from(
      this.supabaseService.getClient()
        .from('consultas')
        .select('*')
        .eq('id', id) // REMOVER .toString() - já é string
        .single()
    ).pipe(
      map((result: any) => {
        if (result.error) throw result.error;
        return ModelConverter.fromSupabaseConsulta(result.data);
      })
    );
  }

  criarConsulta(consulta: Consulta): Observable<Consulta> {
    const consultaSupabase = ModelConverter.toSupabaseConsulta(consulta);

    // Garantir que o ID seja uma string válida para UUID
    if (!consultaSupabase.id || this.isNumber(consultaSupabase.id)) {
      consultaSupabase.id = this.generateUUID();
    }

    return from(
      this.supabaseService.getClient()
        .from('consultas')
        .insert([consultaSupabase])
        .select()
        .single()
    ).pipe(
      map((result: any) => {
        if (result.error) throw result.error;
        return ModelConverter.fromSupabaseConsulta(result.data);
      })
    );
  }

  atualizarConsulta(id: string, consulta: Consulta): Observable<Consulta> {
    const consultaSupabase = ModelConverter.toSupabaseConsulta(consulta);

    // Garantir que o ID da consulta seja consistente
    consultaSupabase.id = id;

    return from(
      this.supabaseService.getClient()
        .from('consultas')
        .update(consultaSupabase)
        .eq('id', id) // REMOVER .toString() - já é string
        .select()
        .single()
    ).pipe(
      map((result: any) => {
        if (result.error) throw result.error;
        return ModelConverter.fromSupabaseConsulta(result.data);
      })
    );
  }

  deletarConsulta(id: string): Observable<void> { // MUDANÇA: number → string
    return from(
      this.supabaseService.getClient()
        .from('consultas')
        .delete()
        .eq('id', id) // REMOVER .toString() - já é string
    ).pipe(
      map((result: any) => {
        if (result.error) throw result.error;
        return;
      })
    );
  }

  // Método para verificar se é número
  private isNumber(value: any): boolean {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  // Gerar UUID v4
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
