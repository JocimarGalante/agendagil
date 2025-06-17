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
  forcaSenha = {
    texto: '',
    cor: '',
    porcentagem: '0%',
  };
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
  avaliarForcaSenha(): void {
    const senha = this.registerForm.get('senha')?.value || '';

    if (!senha) {
      this.forcaSenha = {
        texto: '',
        cor: '',
        porcentagem: '0%',
      };
      return;
    }

    let pontuacao = 0;
    if (senha.length >= 8) pontuacao++;
    if (/[A-Z]/.test(senha)) pontuacao++;
    if (/[a-z]/.test(senha)) pontuacao++;
    if (/[0-9]/.test(senha)) pontuacao++;
    if (/[^A-Za-z0-9]/.test(senha)) pontuacao++;

    switch (pontuacao) {
      case 0:
      case 1:
        this.forcaSenha = {
          texto: 'Senha fraca',
          cor: '#e74c3c',
          porcentagem: '25%',
        };
        break;
      case 2:
      case 3:
        this.forcaSenha = {
          texto: 'Senha média',
          cor: '#f1c40f',
          porcentagem: '50%',
        };
        break;
      case 4:
        this.forcaSenha = {
          texto: 'Senha boa',
          cor: '#2ecc71',
          porcentagem: '75%',
        };
        break;
      case 5:
        this.forcaSenha = {
          texto: 'Senha forte',
          cor: '#28b463',
          porcentagem: '100%',
        };
        break;
    }
  }
}
