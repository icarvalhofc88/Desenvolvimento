import { z } from "zod";
import { validarCnpj } from "@/lib/cnpj";

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

export const STATUS_LOJA = ["TESTE", "ATIVA", "SUSPENSA"] as const;

export const NovaLojaFormSchema = z.object({
  nomeFantasia: z.string().min(2, { error: "Informe o nome da loja." }).trim(),
  razaoSocial: z.string().trim().optional(),
  cnpj: z
    .string()
    .trim()
    .refine(validarCnpj, { error: "Informe um CNPJ válido." }),
  nomeDono: z
    .string()
    .min(2, { error: "Informe o nome do responsável pela loja." })
    .trim(),
  emailDono: z.email({ error: "Informe um e-mail válido." }).trim(),
  senhaDono: z
    .string()
    .min(6, { error: "A senha deve ter pelo menos 6 caracteres." }),
});

export type NovaLojaFormState =
  | {
      erros?: {
        nomeFantasia?: string[];
        cnpj?: string[];
        nomeDono?: string[];
        emailDono?: string[];
        senhaDono?: string[];
      };
      erro?: string;
      sucesso?: boolean;
    }
  | undefined;
