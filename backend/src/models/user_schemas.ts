import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const GetMeSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...', description: 'JWT token' }),
});

export const UpdateProfileSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...', description: 'JWT token' }),
  username: z
    .string()
    .min(3)
    .max(20)
    .optional()
    .openapi({ example: 'novo_username', description: 'Novo nome de usuário' }),
});

export const ChangePasswordSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...', description: 'JWT token' }),
  currentPassword: z
    .string()
    .min(6)
    .openapi({ example: 'senhaAtual123', description: 'Senha atual' }),
  newPassword: z.string().min(6).openapi({ example: 'novaSenha123', description: 'Nova senha' }),
  confirmPassword: z
    .string()
    .min(6)
    .openapi({ example: 'novaSenha123', description: 'Confirmação da nova senha' }),
});

export const ChangePasswordResponseSchema = z.object({
  success: z.boolean().openapi({ example: true, description: 'Sucesso da operação' }),
  message: z.string().openapi({ example: 'Senha alterada com sucesso', description: 'Mensagem' }),
});

export const UpdateProfileResponseSchema = z.object({
  success: z.boolean().openapi({ example: true, description: 'Sucesso da operação' }),
  message: z
    .string()
    .optional()
    .openapi({ example: 'Perfil atualizado com sucesso', description: 'Mensagem' }),
});

export type GetMe = z.infer<typeof GetMeSchema>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;
export type ChangePasswordResponse = z.infer<typeof ChangePasswordResponseSchema>;
export type UpdateProfileResponse = z.infer<typeof UpdateProfileResponseSchema>;
