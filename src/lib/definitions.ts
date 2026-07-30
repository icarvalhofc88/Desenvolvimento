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

export const TIPOS_PRODUTO = ["SIMPLES", "COMPOSTO"] as const;

export const UNIDADES_MEDIDA = [
  "un",
  "kg",
  "g",
  "L",
  "ml",
  "porcao",
  "fatia",
  "pacote",
  "duzia",
] as const;

export const CategoriaFormSchema = z.object({
  nome: z.string().min(2, { error: "Informe o nome da categoria." }).trim(),
  categoriaPaiId: z.string().trim().optional(),
});

export const VariacaoInputSchema = z.object({
  nome: z.string().min(1, { error: "Informe o nome da variação." }).trim(),
  precoVenda: z.coerce
    .number({ error: "Informe um preço válido." })
    .nonnegative({ error: "O preço não pode ser negativo." }),
});

export const ItemFichaTecnicaInputSchema = z.object({
  insumoId: z.string().min(1, { error: "Selecione um insumo." }),
  quantidade: z.coerce
    .number({ error: "Informe uma quantidade válida." })
    .positive({ error: "A quantidade deve ser maior que zero." }),
});

export const ProdutoFormSchema = z.object({
  nome: z.string().min(2, { error: "Informe o nome do produto." }).trim(),
  descricao: z.string().trim().optional(),
  categoriaId: z.string().trim().optional(),
  tipo: z.enum(TIPOS_PRODUTO, { error: "Selecione o tipo do produto." }),
  unidadeMedida: z.enum(UNIDADES_MEDIDA, {
    error: "Selecione uma unidade de medida válida.",
  }),
  vendavel: z.boolean(),
  precoVenda: z.coerce.number().nonnegative().optional(),
  variacoes: z.array(VariacaoInputSchema).default([]),
  itensFichaTecnica: z.array(ItemFichaTecnicaInputSchema).default([]),
});

export type ProdutoFormInput = z.input<typeof ProdutoFormSchema>;

export type ProdutoFormState =
  | {
      erro?: string;
      sucesso?: boolean;
    }
  | undefined;
