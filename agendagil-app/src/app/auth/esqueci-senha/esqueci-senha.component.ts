import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '@auth/auth.service';

@Component({
  selector: 'app-esqueci-senha',
  templateUrl: './esqueci-senha.component.html',
  styleUrls: ['./esqueci-senha.component.scss']
})
export class EsqueciSenhaComponent implements OnInit {
  senhaForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.senhaForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.senhaForm.valid) {
      this.loading = true;
      const email = this.senhaForm.value.email;

      this.authService.resetPassword(email).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'E-mail enviado!',
            html: `
              <div class="text-start">
                <p>Enviamos um link de recuperação para: <strong>${email}</strong></p>
                <p class="mb-0"><small>Verifique sua caixa de entrada e também a pasta de spam.</small></p>
              </div>
            `,
            confirmButtonColor: '#28b463',
            confirmButtonText: 'Entendi'
          }).then(() => {
            this.senhaForm.reset();
            this.router.navigate(['/login']);
          });
        },
        error: (error) => {
          console.error('Erro ao enviar email de recuperação:', error);

          let errorMessage = 'Não foi possível enviar o email de recuperação. Tente novamente.';

          if (error.message && error.message.includes('Email not found')) {
            errorMessage = 'Não encontramos uma conta com este email. Verifique o endereço digitado.';
          } else if (error.message && error.message.includes('rate limit')) {
            errorMessage = 'Muitas tentativas em um curto período. Aguarde alguns minutos e tente novamente.';
          } else if (error.message && error.message.includes('Email not confirmed')) {
            errorMessage = 'Este email ainda não foi confirmado. Verifique sua caixa de entrada.';
          }

          Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: errorMessage,
            confirmButtonColor: '#dc3545'
          });
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      Object.keys(this.senhaForm.controls).forEach(key => {
        const control = this.senhaForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
    }
  }

  voltarParaLogin(): void {
    if (!this.loading) {
      this.router.navigate(['/login']);
    }
  }

  get email(): AbstractControl | null {
    return this.senhaForm.get('email');
  }
}
