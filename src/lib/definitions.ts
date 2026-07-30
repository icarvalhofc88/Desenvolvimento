import { z } from "zod";

export const LoginFormSchema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }).trim(),
  senha: z.string().min(1, { error: "Informe a senha." }),
});

export type LoginFormState =
  | {
      erro?: string;
    }
  | undefined;

export const PERFIS = ["DONO", "GERENTE", "CAIXA", "GARCOM", "COZINHA"] as const;

export const NovoUsuarioFormSchema = z.object({
  nome: z.string().min(2, { error: "Informe o nome completo." }).trim(),
  email: z.email({ error: "Informe um e-mail válido." }).trim(),
  senha: z
    .string()
    .min(6, { error: "A senha deve ter pelo menos 6 caracteres." }),
  perfil: z.enum(PERFIS, { error: "Selecione um perfil válido." }),
});

export type NovoUsuarioFormState =
  | {
      erros?: {
        nome?: string[];
        email?: string[];
        senha?: string[];
        perfil?: string[];
      };
      erro?: string;
      sucesso?: boolean;
    }
  | undefined;
