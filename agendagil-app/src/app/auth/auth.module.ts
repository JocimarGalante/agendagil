import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CoreModule } from "../core/core.module";
import { RouterModule } from '@angular/router';
import { EsqueciSenhaComponent } from './esqueci-senha/esqueci-senha.component';


@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    EsqueciSenhaComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    CoreModule,
    RouterModule
],
  exports: [
    LoginComponent,
    RegisterComponent
  ]
})
export class AuthModule { }
