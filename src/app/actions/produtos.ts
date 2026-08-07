"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirContextoLoja } from "@/lib/dal";
import type { Perfil } from "@/generated/prisma/client";
import {
  CategoriaFormSchema,
  ProdutoFormSchema,
  type ProdutoFormInput,
  type ProdutoFormState,
} from "@/lib/definitions";

const PERFIS_QUE_GERENCIAM_CATALOGO: Perfil[] = ["DONO", "GERENTE"];

export async function criarCategoria(
  _estadoAnterior: { erro?: string } | undefined,
  formData: FormData
): Promise<{ erro?: string } | undefined> {
  const contexto = await exigirContextoLoja(PERFIS_QUE_GERENCIAM_CATALOGO);

  const validado = CategoriaFormSchema.safeParse({
    nome: formData.get("nome"),
    categoriaPaiId: formData.get("categoriaPaiId") || undefined,
  });

  if (!validado.success) {
    return { erro: "Informe um nome válido para a categoria." };
  }

  const { nome, categoriaPaiId } = validado.data;

  // Se foi escolhida uma categoria "pai", ela precisa existir e pertencer
  // à mesma loja (evita vincular a uma categoria de outra loja).
  if (categoriaPaiId) {
    const categoriaPai = await db.categoria.findUnique({
      where: { id: categoriaPaiId },
    });
    if (!categoriaPai || categoriaPai.lojaId !== contexto.lojaId) {
      return { erro: "Categoria pai inválida." };
    }
  }

  const jaExiste = await db.categoria.findFirst({
    where: {
      lojaId: contexto.lojaId,
      nome,
      categoriaPaiId: categoriaPaiId ?? null,
    },
  });
  if (jaExiste) {
    return { erro: "Já existe uma categoria com este nome neste nível." };
  }

  await db.categoria.create({
    data: {
      lojaId: contexto.lojaId,
      nome,
      categoriaPaiId: categoriaPaiId ?? null,
    },
  });

  revalidatePath("/dashboard/produtos/categorias");
  return undefined;
}

export async function alternarAtivoCategoria(categoriaId: string) {
  const contexto = await exigirContextoLoja(PERFIS_QUE_GERENCIAM_CATALOGO);

  const categoria = await db.categoria.findUnique({
    where: { id: categoriaId },
  });
  if (!categoria || categoria.lojaId !== contexto.lojaId) {
    return;
  }

  await db.categoria.update({
    where: { id: categoriaId },
    data: { ativo: !categoria.ativo },
  });

  revalidatePath("/dashboard/produtos/categorias");
}

type ProdutoValidado = {
  nome: string;
  descricao: string | null;
  categoriaId: string | null;
  tipo: "SIMPLES" | "COMPOSTO";
  unidadeMedida: string;
  vendavel: boolean;
  precoVenda: number | null | undefined;
  custoUnitario: number | null | undefined;
  estoqueMinimo: number;
  variacoes: { nome: string; precoVenda: number }[];
  itensFichaTecnica: { insumoId: string; quantidade: number }[];
};

// Confere e prepara os dados de um produto antes de criar/atualizar.
// Devolve { erro } OU { dados } (nunca os dois).
async function validarProduto(
  contexto: { lojaId: string },
  dados: ProdutoFormInput,
  produtoIdAtual?: string
): Promise<{ erro?: string; dados?: ProdutoValidado }> {
  const validado = ProdutoFormSchema.safeParse(dados);
  if (!validado.success) {
    return { erro: "Verifique os campos do produto e tente novamente." };
  }

  const {
    nome,
    descricao,
    categoriaId,
    tipo,
    unidadeMedida,
    vendavel,
    precoVenda,
    custoUnitario,
    estoqueMinimo,
    variacoes,
    itensFichaTecnica,
  } = validado.data;

  if (categoriaId) {
    const categoria = await db.categoria.findUnique({
      where: { id: categoriaId },
    });
    if (!categoria || categoria.lojaId !== contexto.lojaId) {
      return { erro: "Categoria inválida." };
    }
  }

  // Um produto vendável sem variações precisa ter um preço definido.
  if (vendavel && variacoes.length === 0 && precoVenda === undefined) {
    return {
      erro:
        "Informe o preço de venda, ou cadastre ao menos uma variação com preço.",
    };
  }

  // Só produto do tipo COMPOSTO tem ficha técnica.
  if (tipo === "SIMPLES" && itensFichaTecnica.length > 0) {
    return {
      erro: "Só produtos do tipo 'Composto' podem ter ficha técnica.",
    };
  }

  if (itensFichaTecnica.length > 0) {
    const idsInsumos = [
      ...new Set(itensFichaTecnica.map((item) => item.insumoId)),
    ];

    if (produtoIdAtual && idsInsumos.includes(produtoIdAtual)) {
      return { erro: "Um produto não pode ser insumo de si mesmo." };
    }

    const insumos = await db.produto.findMany({
      where: { id: { in: idsInsumos } },
    });
    const insumosValidos = insumos.every((i) => i.lojaId === contexto.lojaId);
    if (insumos.length !== idsInsumos.length || !insumosValidos) {
      return { erro: "Um ou mais insumos selecionados são inválidos." };
    }
  }

  return {
    dados: {
      nome,
      descricao: descricao || null,
      categoriaId: categoriaId || null,
      tipo,
      unidadeMedida,
      vendavel,
      precoVenda: variacoes.length > 0 ? null : precoVenda,
      custoUnitario,
      estoqueMinimo,
      variacoes,
      itensFichaTecnica,
    },
  };
}

export async function criarProduto(
  dados: ProdutoFormInput
): Promise<ProdutoFormState> {
  const contexto = await exigirContextoLoja(PERFIS_QUE_GERENCIAM_CATALOGO);

  const resultado = await validarProduto(contexto, dados);
  if (resultado.erro) {
    return { erro: resultado.erro };
  }
  const { nome, descricao, categoriaId, tipo, unidadeMedida, vendavel, precoVenda, custoUnitario, estoqueMinimo, variacoes, itensFichaTecnica } =
    resultado.dados!;

  const jaExiste = await db.produto.findFirst({
    where: { lojaId: contexto.lojaId, nome },
  });
  if (jaExiste) {
    return { erro: "Já existe um produto com este nome." };
  }

  await db.produto.create({
    data: {
      lojaId: contexto.lojaId,
      nome,
      descricao,
      categoriaId,
      tipo,
      unidadeMedida,
      vendavel,
      precoVenda,
      custoUnitario,
      estoqueMinimo,
      variacoes: { create: variacoes },
      itensFichaTecnica: {
        create: itensFichaTecnica.map((item) => ({
          insumoId: item.insumoId,
          quantidade: item.quantidade,
        })),
      },
    },
  });

  revalidatePath("/dashboard/produtos");
  return { sucesso: true };
}

export async function atualizarProduto(
  produtoId: string,
  dados: ProdutoFormInput
): Promise<ProdutoFormState> {
  const contexto = await exigirContextoLoja(PERFIS_QUE_GERENCIAM_CATALOGO);

  const produtoAtual = await db.produto.findUnique({
    where: { id: produtoId },
  });
  if (!produtoAtual || produtoAtual.lojaId !== contexto.lojaId) {
    return { erro: "Produto não encontrado." };
  }

  const resultado = await validarProduto(contexto, dados, produtoId);
  if (resultado.erro) {
    return { erro: resultado.erro };
  }
  const { nome, descricao, categoriaId, tipo, unidadeMedida, vendavel, precoVenda, custoUnitario, estoqueMinimo, variacoes, itensFichaTecnica } =
    resultado.dados!;

  const outroComMesmoNome = await db.produto.findFirst({
    where: { lojaId: contexto.lojaId, nome, NOT: { id: produtoId } },
  });
  if (outroComMesmoNome) {
    return { erro: "Já existe um produto com este nome." };
  }

  // Estratégia simples: apaga as variações/itens de ficha técnica antigos
  // e recria com os valores atuais do formulário.
  await db.$transaction([
    db.variacao.deleteMany({ where: { produtoId } }),
    db.itemFichaTecnica.deleteMany({ where: { produtoId } }),
    db.produto.update({
      where: { id: produtoId },
      data: {
        nome,
        descricao,
        categoriaId,
        tipo,
        unidadeMedida,
        vendavel,
        precoVenda,
        custoUnitario,
        estoqueMinimo,
        variacoes: { create: variacoes },
        itensFichaTecnica: {
          create: itensFichaTecnica.map((item) => ({
            insumoId: item.insumoId,
            quantidade: item.quantidade,
          })),
        },
      },
    }),
  ]);

  revalidatePath("/dashboard/produtos");
  revalidatePath(`/dashboard/produtos/${produtoId}/editar`);
  return { sucesso: true };
}

export async function alternarAtivoProduto(produtoId: string) {
  const contexto = await exigirContextoLoja(PERFIS_QUE_GERENCIAM_CATALOGO);

  const produto = await db.produto.findUnique({ where: { id: produtoId } });
  if (!produto || produto.lojaId !== contexto.lojaId) {
    return;
  }

  await db.produto.update({
    where: { id: produtoId },
    data: { ativo: !produto.ativo },
  });

  revalidatePath("/dashboard/produtos");
}
