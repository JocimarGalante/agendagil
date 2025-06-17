import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@auth/auth.service';
import Swal from 'sweetalert2';
import { Usuario } from '@models/usuario.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, senha } = this.loginForm.value;
      this.loading = true;
      this.errorMessage = null;

      this.authService.login(email, senha).subscribe({
        next: (usuario: Usuario) => {
          this.loading = false;

          Swal.fire({
            title: 'Login realizado',
            text: `Bem-vindo(a), ${usuario.nome}!`,
            icon: 'success',
            confirmButtonColor: '#28B463',
            timer: 1500,
            showConfirmButton: false
          });

          // Redirecionamento com base no tipo de usuário
          switch (usuario.tipo) {
            case 'paciente':
              this.router.navigate(['/dashboard-paciente']);
              break;
            case 'medico':
              this.router.navigate(['/dashboard-medico']);
              break;
            case 'administrador':
              this.router.navigate(['/dashboard-admin']);
              break;
            default:
              this.router.navigate(['/home']);
              break;
          }
        },
        error: err => {
          this.loading = false;

          Swal.fire({
            title: 'Erro no login',
            text: 'Email ou senha inválidos!',
            icon: 'error',
            confirmButtonColor: '#1B4F72'
          });

          this.errorMessage = err.message || 'Erro no login. Verifique seus dados.';
        }
      });
    } else {
      Swal.fire({
        title: 'Campos inválidos',
        text: 'Preencha corretamente todos os campos.',
        icon: 'warning',
        confirmButtonColor: '#1B4F72'
      });
    }
  }
}
