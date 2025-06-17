import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RegisterService } from '../services/register.service';
import { TipoUsuario } from '@models/tipo-usuario.enum';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', Validators.required],
      tipo: [TipoUsuario.Paciente],
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.registerService.registrarUsuario(this.registerForm.value).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Conta criada!',
            text: 'Sua conta foi criada com sucesso.',
            confirmButtonColor: '#28B463',
          });
          this.registerForm.reset();
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: err.error?.message || 'Erro ao criar conta. Tente novamente.',
            confirmButtonColor: '#1B4F72',
          });
        },
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Campos obrigatórios',
        text: 'Preencha todos os campos corretamente.',
        confirmButtonColor: '#F1C40F',
      });
    }
  }
}
