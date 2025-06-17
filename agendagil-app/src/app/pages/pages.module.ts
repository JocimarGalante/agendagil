import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home/home.component';
import { DashboardPacienteComponent } from './dashboard-paciente/dashboard-paciente.component';
import { DashboardMedicoComponent } from './dashboard-medico/dashboard-medico.component';
import { DashboardAdminComponent } from './dashboard-admin/dashboard-admin.component';
import { CoreModule } from 'core/core.module';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [
    HomeComponent,
    DashboardPacienteComponent,
    DashboardMedicoComponent,
    DashboardAdminComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    RouterModule
  ]
})
export class PagesModule { }
