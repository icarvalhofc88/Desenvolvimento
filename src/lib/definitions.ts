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

export const TrocarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, { error: "Informe a senha atual." }),
    novaSenha: z
      .string()
      .min(6, { error: "A nova senha deve ter pelo menos 6 caracteres." }),
    confirmarNovaSenha: z.string(),
  })
  .refine((dados) => dados.novaSenha === dados.confirmarNovaSenha, {
    error: "A confirmação não é igual à nova senha.",
    path: ["confirmarNovaSenha"],
  });

export type TrocarSenhaState =
  | {
      erro?: string;
      sucesso?: boolean;
    }
  | undefined;

export const RedefinirSenhaSchema = z.object({
  novaSenha: z
    .string()
    .min(6, { error: "A nova senha deve ter pelo menos 6 caracteres." }),
});

export type RedefinirSenhaState =
  | {
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
  custoUnitario: z.coerce.number().nonnegative().optional(),
  estoqueMinimo: z.coerce.number().nonnegative().default(0),
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

export const TIPOS_AJUSTE_ESTOQUE = [
  "ENTRADA_AJUSTE",
  "SAIDA_AJUSTE",
  "SAIDA_PERDA",
] as const;

export const AjusteEstoqueSchema = z.object({
  produtoId: z.string().min(1, { error: "Selecione um produto." }),
  tipo: z.enum(TIPOS_AJUSTE_ESTOQUE, { error: "Selecione o tipo de ajuste." }),
  quantidade: z.coerce
    .number({ error: "Informe uma quantidade válida." })
    .positive({ error: "A quantidade deve ser maior que zero." }),
  observacao: z.string().trim().optional(),
});

export type AjusteEstoqueInput = z.input<typeof AjusteEstoqueSchema>;

export type AjusteEstoqueState =
  | {
      erro?: string;
      sucesso?: boolean;
    }
  | undefined;

export const ItemNotaFiscalInputSchema = z.object({
  produtoId: z.string().min(1, { error: "Selecione um produto para o item." }),
  descricaoOriginal: z.string().trim().optional(),
  quantidade: z.coerce
    .number({ error: "Informe uma quantidade válida." })
    .positive({ error: "A quantidade deve ser maior que zero." }),
  valorUnitario: z.coerce.number().nonnegative().optional(),
});

export const NotaFiscalManualSchema = z.object({
  numero: z.string().trim().optional(),
  fornecedorNome: z.string().trim().optional(),
  fornecedorCnpj: z.string().trim().optional(),
  dataEmissao: z.string().trim().optional(),
  itens: z
    .array(ItemNotaFiscalInputSchema)
    .min(1, { error: "Adicione ao menos um item à nota." }),
});

export type NotaFiscalManualInput = z.input<typeof NotaFiscalManualSchema>;

export const NotaFiscalXmlConfirmacaoSchema = NotaFiscalManualSchema.extend({
  chaveAcesso: z.string().trim().optional(),
  valorTotal: z.coerce.number().nonnegative().optional(),
});

export type NotaFiscalXmlConfirmacaoInput = z.input<
  typeof NotaFiscalXmlConfirmacaoSchema
>;

export type NotaFiscalFormState =
  | {
      erro?: string;
      sucesso?: boolean;
    }
  | undefined;

export const TIPOS_COMANDA = ["MESA", "AVULSA"] as const;

export const AbrirComandaSchema = z
  .object({
    tipo: z.enum(TIPOS_COMANDA, { error: "Selecione o tipo de comanda." }),
    mesa: z.string().trim().optional(),
  })
  .refine((dados) => dados.tipo !== "MESA" || !!dados.mesa, {
    error: "Informe a mesa.",
    path: ["mesa"],
  });

export type AbrirComandaInput = z.input<typeof AbrirComandaSchema>;

export type AbrirComandaState =
  | {
      erro?: string;
      comandaId?: string;
    }
  | undefined;

export const AdicionarItemComandaSchema = z.object({
  comandaId: z.string().min(1),
  produtoId: z.string().min(1, { error: "Selecione um produto." }),
  variacaoId: z.string().trim().optional(),
  quantidade: z.coerce
    .number({ error: "Informe uma quantidade válida." })
    .positive({ error: "A quantidade deve ser maior que zero." }),
  observacao: z.string().trim().optional(),
});

export type AdicionarItemComandaInput = z.input<
  typeof AdicionarItemComandaSchema
>;

export type ComandaActionState =
  | {
      erro?: string;
      sucesso?: boolean;
    }
  | undefined;

export const FORMAS_PAGAMENTO = [
  "DINHEIRO",
  "CARTAO_DEBITO",
  "CARTAO_CREDITO",
  "PIX",
  "OUTRO",
] as const;

export const PagamentoInputSchema = z.object({
  forma: z.enum(FORMAS_PAGAMENTO, { error: "Selecione a forma de pagamento." }),
  valor: z.coerce
    .number({ error: "Informe um valor válido." })
    .positive({ error: "O valor deve ser maior que zero." }),
});

export const FecharComandaSchema = z.object({
  comandaId: z.string().min(1),
  pagamentos: z
    .array(PagamentoInputSchema)
    .min(1, { error: "Adicione ao menos uma forma de pagamento." }),
});

export type FecharComandaInput = z.input<typeof FecharComandaSchema>;

export type FecharComandaState =
  | {
      erro?: string;
      sucesso?: boolean;
    }
  | undefined;

// Usado tanto para Contas a Pagar quanto Contas a Receber — mesma forma,
// só muda a tabela em que a ação grava.
export const ContaFormSchema = z.object({
  descricao: z.string().min(2, { error: "Informe a descrição." }).trim(),
  categoria: z.string().trim().optional(),
  valor: z.coerce
    .number({ error: "Informe um valor válido." })
    .positive({ error: "O valor deve ser maior que zero." }),
  vencimento: z.string().min(1, { error: "Informe a data de vencimento." }),
});

export type ContaFormInput = z.input<typeof ContaFormSchema>;

export type ContaFormState =
  | {
      erro?: string;
      sucesso?: boolean;
    }
  | undefined;
