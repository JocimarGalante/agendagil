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

  getConsultaPorId(id: number): Observable<Consulta> {
    return from(
      this.supabaseService.getClient()
        .from('consultas')
        .select('*')
        .eq('id', id.toString())
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

    return from(
      this.supabaseService.getClient()
        .from('consultas')
        .update(consultaSupabase)
        .eq('id', id.toString())
        .select()
        .single()
    ).pipe(
      map((result: any) => {
        if (result.error) throw result.error;
        return ModelConverter.fromSupabaseConsulta(result.data);
      })
    );
  }

  deletarConsulta(id: number): Observable<void> {
    return from(
      this.supabaseService.getClient()
        .from('consultas')
        .delete()
        .eq('id', id.toString())
    ).pipe(
      map((result: any) => {
        if (result.error) throw result.error;
        return;
      })
    );
  }
}
