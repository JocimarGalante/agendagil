import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AgendaComponent } from './scheduling/agenda/agenda.component';
import { AuthGuard } from './auth/auth.guard'; // certifique-se de importar corretamente
import { EsqueciSenhaComponent } from '@auth/esqueci-senha/esqueci-senha.component';
import { DashboardPacienteComponent } from 'pages/dashboard-paciente/dashboard-paciente.component';
import { DashboardMedicoComponent } from 'pages/dashboard-medico/dashboard-medico.component';
import { DashboardAdminComponent } from 'pages/dashboard-admin/dashboard-admin.component';
import { ConsultasComponent } from 'pages/dashboard-paciente/consultas/consultas.component';
import { NotificacoesComponent } from 'pages/dashboard-paciente/notificacoes/notificacoes.component';
import { HistoricoComponent } from 'pages/dashboard-paciente/historico/historico.component';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'cadastro', component: RegisterComponent },
  { path: 'esqueci-senha', component: EsqueciSenhaComponent },
  {
    path: 'dashboard-paciente',
    component: DashboardPacienteComponent,
    children: [
      { path: 'consultas', component: ConsultasComponent },
      { path: 'notificacoes', component: NotificacoesComponent },
      { path: 'historico', component: HistoricoComponent },
      { path: '', redirectTo: 'consultas', pathMatch: 'full' },
    ],
  },
  { path: 'dashboard-medico', component: DashboardMedicoComponent },
  { path: 'dashboard-admin', component: DashboardAdminComponent },

  // ROTAS PROTEGIDAS
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'agenda', component: AgendaComponent, canActivate: [AuthGuard] },

  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
