import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home/home.component';
import { DashboardPacienteComponent } from './dashboard-paciente/dashboard-paciente.component';
import { DashboardMedicoComponent } from './dashboard-medico/dashboard-medico.component';
import { DashboardAdminComponent } from './dashboard-admin/dashboard-admin.component';
import { CoreModule } from 'core/core.module';
import { RouterModule } from '@angular/router';
import { ConsultasComponent } from './dashboard-paciente/consultas/consultas.component';
import { NotificacoesComponent } from './dashboard-paciente/notificacoes/notificacoes.component';
import { HistoricoComponent } from './dashboard-paciente/historico/historico.component';



@NgModule({
  declarations: [
    HomeComponent,
    DashboardPacienteComponent,
    DashboardMedicoComponent,
    DashboardAdminComponent,
    ConsultasComponent,
    NotificacoesComponent,
    HistoricoComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    RouterModule
  ]
})
export class PagesModule { }
