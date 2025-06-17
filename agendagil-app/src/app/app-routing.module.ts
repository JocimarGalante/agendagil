import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AgendaComponent } from './scheduling/agenda/agenda.component';
import { AuthGuard } from './auth/auth.guard'; // certifique-se de importar corretamente

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'cadastro', component: RegisterComponent },

  // ROTAS PROTEGIDAS
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'agenda', component: AgendaComponent, canActivate: [AuthGuard] },

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
