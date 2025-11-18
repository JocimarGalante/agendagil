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
    this.loading = true;
    this.authService.hasPasswordRecoverySession().subscribe({
      next: (hasSession) => {
        this.showForm = hasSession;
        this.loading = false;
        if (!hasSession) {
          Swal.fire({
            icon: 'error',
            title: 'Link inválido',
            text: 'Este link de recuperação é inválido ou expirou.',
            confirmButtonColor: '#dc3545'
          }).then(() => {
            this.router.navigate(['/esqueci-senha']);
          });
        }
      },
      error: () => {
        this.showForm = false;
        this.loading = false;
        this.router.navigate(['/esqueci-senha']);
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      if (confirmPassword && confirmPassword.errors) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }

    return null;
  }

  onSubmit(): void {
    if (this.resetForm.valid) {
      this.loading = true;
      const newPassword = this.resetForm.get('password')?.value;

      this.authService.updatePassword(newPassword).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Senha alterada!',
            text: 'Sua senha foi redefinida com sucesso.',
            confirmButtonColor: '#28b463'
          }).then(() => {
            this.router.navigate(['/login']);
          });
        },
        error: (error) => {
          console.error('Erro ao redefinir senha:', error);
          this.loading = false;

          Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível redefinir sua senha. Tente novamente.',
            confirmButtonColor: '#dc3545'
          });
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
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
