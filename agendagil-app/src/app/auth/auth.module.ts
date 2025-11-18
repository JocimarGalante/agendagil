import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CoreModule } from "../core/core.module";
import { RouterModule } from '@angular/router';
import { EsqueciSenhaComponent } from './esqueci-senha/esqueci-senha.component';
import { NgxMaskModule } from 'ngx-mask';
import { ResetSenhaComponent } from './reset-senha/reset-senha.component';


@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    EsqueciSenhaComponent,
    ResetSenhaComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    CoreModule,
    RouterModule,
    NgxMaskModule.forRoot(),
],
  exports: [
    LoginComponent,
    RegisterComponent
  ]
})
export class AuthModule { }
