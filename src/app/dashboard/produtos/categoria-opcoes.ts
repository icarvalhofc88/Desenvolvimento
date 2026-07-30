// Funções compartilhadas para transformar a lista "achatada" de categorias
// (como vem do banco) em uma árvore de categorias/subcategorias, e essa
// árvore em uma lista de opções indentadas para usar em um <select>.

export type CategoriaBase = {
  id: string;
  nome: string;
  categoriaPaiId: string | null;
};

export type CategoriaComFilhos<T extends CategoriaBase> = T & {
  filhos: CategoriaComFilhos<T>[];
};

export function montarArvoreCategorias<T extends CategoriaBase>(
  categorias: T[]
): CategoriaComFilhos<T>[] {
  const porId = new Map<string, CategoriaComFilhos<T>>(
    categorias.map((c) => [c.id, { ...c, filhos: [] }])
  );
  const raizes: CategoriaComFilhos<T>[] = [];

  for (const categoria of porId.values()) {
    if (categoria.categoriaPaiId) {
      const pai = porId.get(categoria.categoriaPaiId);
      pai?.filhos.push(categoria);
    } else {
      raizes.push(categoria);
    }
  }

  return raizes;
}

export function montarOpcoesCategoria<T extends CategoriaBase>(
  categorias: T[]
): { id: string; nomeExibicao: string }[] {
  function achatar(
    arvore: CategoriaComFilhos<T>[],
    prefixo: string
  ): { id: string; nomeExibicao: string }[] {
    return arvore.flatMap((categoria) => [
      { id: categoria.id, nomeExibicao: `${prefixo}${categoria.nome}` },
      ...achatar(categoria.filhos, `${prefixo}— `),
    ]);
  }

  return achatar(montarArvoreCategorias(categorias), "");
}
