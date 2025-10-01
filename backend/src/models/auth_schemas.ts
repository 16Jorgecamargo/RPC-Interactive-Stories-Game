import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const RegisterSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .openapi({ example: 'usuario1', description: 'Nome de usuário' }),
  password: z.string().min(6).openapi({ example: 'senha123', description: 'Senha' }),
  confirmPassword: z
    .string()
    .min(6)
    .openapi({ example: 'senha123', description: 'Confirmação de senha' }),
});

export const LoginSchema = z.object({
  username: z.string().min(3).openapi({ example: 'usuario1', description: 'Nome de usuário' }),
  password: z.string().min(6).openapi({ example: 'senha123', description: 'Senha' }),
});

export const UserSchema = z.object({
  id: z.string().openapi({ example: 'user_123abc', description: 'ID único do usuário' }),
  username: z
    .string()
    .min(3)
    .max(20)
    .openapi({ example: 'usuario1', description: 'Nome de usuário' }),
  password: z.string().openapi({ example: '$2b$10$...', description: 'Hash da senha' }),
  role: z.enum(['USER', 'ADMIN']).openapi({ example: 'USER', description: 'Papel do usuário' }),
  createdAt: z
    .string()
    .openapi({ example: '2025-10-01T12:00:00Z', description: 'Data de criação' }),
});

export const UserResponseSchema = UserSchema.omit({ password: true });

export const LoginResponseSchema = z.object({
  token: z.string().openapi({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT token de autenticação',
  }),
  user: UserResponseSchema,
  expiresIn: z
    .number()
    .openapi({ example: 86400, description: 'Tempo de expiração em segundos (24h)' }),
});

export const RegisterResponseSchema = z.object({
  success: z.boolean().openapi({ example: true, description: 'Sucesso da operação' }),
  userId: z
    .string()
    .optional()
    .openapi({ example: 'user_123abc', description: 'ID do usuário criado' }),
  message: z
    .string()
    .optional()
    .openapi({ example: 'Usuário já existe', description: 'Mensagem de erro' }),
});

export type User = z.infer<typeof UserSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
