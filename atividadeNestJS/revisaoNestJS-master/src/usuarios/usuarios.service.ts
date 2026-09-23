import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export type Papel = 'solicitante' | 'gestor' | 'auditor';

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  senhaHash: string;
  papel: Papel;
  ativo: boolean;
}

export type UsuarioAutenticado = Omit<Usuario, "senhaHash">

@Injectable()
export class UsuariosService {
  private readonly usuarios: Usuario[] = [
    {
      id: 1,
      nome: 'Ana Lima',
      email: 'ana@empresa.com',
      senhaHash: bcrypt.hashSync(process.env.USUARIO_GESTOR_SENHA ?? '', 12),
      papel: 'gestor',
      ativo: true,
    },
    {
      id: 2,
      nome: 'Bruno Silva',
      email: 'bruno@empresa.com',
      senhaHash: bcrypt.hashSync(process.env.USUARIO_SOLICITANTE_SENHA ?? '', 12),
      papel: 'solicitante',
      ativo: true,
    },
  ];

  buscarPorEmail(email: string) {
    return this.usuarios.find(usuario => usuario.email === email);
  }
}
