import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
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
        next: user => {
          this.loading = false;
          console.log('Usuário logado:', user);
          this.router.navigate(['/home']);
        },
        error: err => {
          this.loading = false;
          this.errorMessage = err.message || 'Erro no login. Verifique seus dados.';
        }
      });
    }
  }
}
