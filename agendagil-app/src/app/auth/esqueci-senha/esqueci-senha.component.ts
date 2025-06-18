import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-esqueci-senha',
  templateUrl: './esqueci-senha.component.html',
  styleUrls: ['./esqueci-senha.component.scss']
})
export class EsqueciSenhaComponent implements OnInit {
  senhaForm!: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.senhaForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.senhaForm.valid) {
      const email = this.senhaForm.value.email;

      // Aqui você pode chamar um serviço real futuramente
      Swal.fire({
        icon: 'success',
        title: 'E-mail enviado!',
        text: `Enviamos um link para ${email} com as instruções.`,
        confirmButtonColor: '#28b463'
      });

      this.senhaForm.reset();
      this.router.navigate(['/login']);
    }
  }
}
