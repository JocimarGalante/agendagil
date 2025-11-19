// reset-senha.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '@auth/auth.service';

@Component({
  selector: 'app-reset-senha',
  templateUrl: './reset-senha.component.html',
  styleUrls: ['./reset-senha.component.scss']
})
export class ResetSenhaComponent implements OnInit {
  resetForm: FormGroup;
  loading = false;
  showForm = false;
  checkingSession = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.checkRecoverySession();
  }

  private checkRecoverySession(): void {
    this.checkingSession = true;

    this.authService.hasPasswordRecoverySession().subscribe({
      next: (hasSession) => {
        this.showForm = hasSession;
        this.checkingSession = false;

        if (!hasSession) {
          this.showInvalidLinkMessage();
        }
      },
      error: (error) => {
        console.error('Erro ao verificar sessão:', error);
        this.showForm = false;
        this.checkingSession = false;
        this.showInvalidLinkMessage();
      }
    });
  }

  private showInvalidLinkMessage(): void {
    Swal.fire({
      icon: 'warning',
      title: 'Link inválido ou expirado',
      html: `
        <div class="text-start">
          <p>Este link de recuperação é inválido ou expirou.</p>
          <p>Possíveis motivos:</p>
          <ul class="text-start">
            <li>O link já foi utilizado</li>
            <li>O link expirou (válido por 24 horas)</li>
            <li>Erro na configuração</li>
          </ul>
          <p class="mb-0">Solicite um novo link de recuperação.</p>
        </div>
      `,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Solicitar novo link'
    }).then(() => {
      this.router.navigate(['/esqueci-senha']);
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    // Limpar erro se as senhas coincidem
    if (confirmPassword && confirmPassword.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }

    return null;
  }

  onSubmit(): void {
    if (this.resetForm.valid) {
      this.loading = true;
      const newPassword = this.resetForm.get('password')?.value;

      this.authService.updatePassword(newPassword).subscribe({
        next: (result) => {

          Swal.fire({
            icon: 'success',
            title: 'Senha alterada com sucesso!',
            html: `
              <div class="text-start">
                <p>Sua senha foi redefinida com sucesso.</p>
                <p class="mb-0">Agora você pode fazer login com sua nova senha.</p>
              </div>
            `,
            confirmButtonColor: '#28b463',
            confirmButtonText: 'Fazer login'
          }).then(() => {
            // Limpar storage e redirecionar
            localStorage.removeItem('usuarioLogado');
            localStorage.removeItem('tokenExpiration');
            this.router.navigate(['/login']);
          });
        },
        error: (error) => {
          console.error('Erro ao redefinir senha:', error);
          this.loading = false;

          let errorMessage = 'Não foi possível redefinir sua senha. ';

          if (error.message?.includes('Auth session missing') || error.message?.includes('session expired')) {
            errorMessage = 'A sessão expirou. Solicite um novo link de recuperação.';
          } else if (error.message?.includes('Password should be at least')) {
            errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
          } else if (error.message?.includes('Invalid password')) {
            errorMessage = 'Senha muito fraca. Use uma senha mais forte.';
          } else {
            errorMessage += 'Tente novamente ou solicite um novo link.';
          }

          Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: errorMessage,
            confirmButtonColor: '#dc3545'
          }).then(() => {
            if (error.message?.includes('session')) {
              this.router.navigate(['/esqueci-senha']);
            }
          });
        }
      });
    } else {
      // Marcar todos os campos como touched para mostrar erros
      Object.keys(this.resetForm.controls).forEach(key => {
        const control = this.resetForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
    }
  }

  get password(): AbstractControl | null {
    return this.resetForm.get('password');
  }

  get confirmPassword(): AbstractControl | null {
    return this.resetForm.get('confirmPassword');
  }
}
