import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { RegisterService } from '../services/register.service';
import { TipoUsuario } from '@models/usuario/tipo-usuario.enum';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { Plano } from '@models/plano.model';

interface Tipo {
  value: string;
  label: string;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  tipoUsuarioSelecionado: string = '';
  tipoUsuarioEnum = TipoUsuario;
  hoje: string = new Date().toISOString().split('T')[0];

  tipos: Tipo[] = [
    { value: TipoUsuario.PACIENTE, label: 'Paciente' },
    {
      value: TipoUsuario.PROFISSIONAL_AUTONOMO,
      label: 'Profissional Autônomo',
    },
    { value: TipoUsuario.CLINICA, label: 'Clínica' },
  ];

  planos: Plano[] = [
    {
      id: 'plano1',
      nome: 'Plano Básico',
      descricao: 'Anúncios simples com alcance limitado',
      preco: 49.9,
    },
    {
      id: 'plano2',
      nome: 'Plano Profissional',
      descricao: 'Anúncios com maior visibilidade e destaque',
      preco: 99.9,
    },
    {
      id: 'plano3',
      nome: 'Plano Premium',
      descricao: 'Anúncios prioritários com suporte exclusivo',
      preco: 149.9,
    },
  ];

  forcaSenha = {
    texto: '',
    cor: '',
    porcentagem: '0%',
  };

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      tipo: ['', Validators.required],
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', Validators.required],

      // Campos para PACIENTE
      cpf: [''],
      dataNascimento: [''],
      genero: [''],

      // Campos para PROFISSIONAL AUTÔNOMO
      crm: [''],
      especialidade: [''],
      formacao: [''],
      experiencia: [''],
      descricao: [''],
      siteProfissional: [''],

      // Campos para CLINICA
      cnpj: [''],
      razaoSocial: [''],
      responsavelTecnico: [''],
      registroResponsavel: [''],
      especialidadesAtendidas: [''],
      site: [''],
      horarioFuncionamento: [''],
      descricaoClinica: [''],

      // Plano selecionado
      planoSelecionado: [''],
    });

    this.registerForm.get('tipo')?.valueChanges.subscribe((tipo: string) => {
      this.tipoUsuarioSelecionado = tipo;
      this.atualizarValidadoresPorTipo(tipo);
    });
  }

  private atualizarValidadoresPorTipo(tipo: string) {
    this.limparValidadoresEspecificos();

    switch (tipo) {
      case TipoUsuario.PACIENTE:
        this.registerForm.get('cpf')?.setValidators([Validators.required]);
        this.registerForm.get('dataNascimento')?.setValidators([Validators.required]);
        this.registerForm.get('planoSelecionado')?.clearValidators();
        break;

      case TipoUsuario.PROFISSIONAL_AUTONOMO:
        this.registerForm.get('cpf')?.setValidators([Validators.required]);
        this.registerForm.get('crm')?.setValidators([Validators.required]);
        this.registerForm.get('especialidade')?.setValidators([Validators.required]);
        this.registerForm.get('planoSelecionado')?.setValidators([Validators.required]);
        break;

      case TipoUsuario.CLINICA:
        this.registerForm.get('cnpj')?.setValidators([Validators.required]);
        this.registerForm.get('razaoSocial')?.setValidators([Validators.required]);
        this.registerForm.get('planoSelecionado')?.setValidators([Validators.required]);
        break;

      default:
        break;
    }

    ['cpf', 'dataNascimento', 'crm', 'especialidade', 'cnpj', 'razaoSocial', 'planoSelecionado']
      .forEach((campo) => {
        this.registerForm.get(campo)?.updateValueAndValidity();
      });
  }

  private limparValidadoresEspecificos() {
    const campos = [
      'cpf',
      'dataNascimento',
      'crm',
      'especialidade',
      'cnpj',
      'razaoSocial',
      'planoSelecionado',
    ];
    campos.forEach((campo) => {
      this.registerForm.get(campo)?.clearValidators();
      this.registerForm.get(campo)?.setValue('');
      this.registerForm.get(campo)?.updateValueAndValidity();
    });
  }

  avaliarForcaSenha(): void {
    const senha = this.registerForm.get('senha')?.value || '';

    if (!senha) {
      this.forcaSenha = { texto: '', cor: '', porcentagem: '0%' };
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

  onSubmit(): void {
    if (this.registerForm.valid) {
      const formValue = this.registerForm.value;

      this.registerService.registrarUsuario(formValue, formValue.tipo).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Conta criada!',
            text: 'Sua conta foi criada com sucesso.',
            confirmButtonColor: '#28B463',
          });
          this.registerForm.reset();
          this.tipoUsuarioSelecionado = '';
          this.router.navigate(['/login']);
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
