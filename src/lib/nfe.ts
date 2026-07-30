import { XMLParser } from "fast-xml-parser";

// Lê os campos essenciais de um XML de Nota Fiscal Eletrônica (NF-e) de
// compra: fornecedor, número, data e os itens (produtos) comprados.
// Não valida assinatura digital nem consulta a SEFAZ — só extrai os dados
// para conferência e importação manual pelo usuário.

export type ItemNfe = {
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
};

export type NotaFiscalXmlParseada = {
  chaveAcesso: string | null;
  numero: string | null;
  dataEmissao: Date | null;
  fornecedorNome: string | null;
  fornecedorCnpj: string | null;
  valorTotal: number | null;
  itens: ItemNfe[];
};

function paraArray<T>(valor: T | T[] | undefined | null): T[] {
  if (valor === undefined || valor === null) return [];
  return Array.isArray(valor) ? valor : [valor];
}

export function interpretarXmlNfe(xml: string): NotaFiscalXmlParseada {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  let doc: unknown;
  try {
    doc = parser.parse(xml);
  } catch {
    throw new Error("Não foi possível ler o arquivo. Confira se é um XML válido.");
  }

  const raiz = doc as Record<string, unknown>;
  const nfeProc = (raiz.nfeProc ?? raiz) as Record<string, unknown>;
  const nfe = (nfeProc.NFe ?? nfeProc) as Record<string, unknown>;
  const infNFe = nfe?.infNFe as Record<string, unknown> | undefined;

  if (!infNFe) {
    throw new Error(
      "Este arquivo não parece ser o XML de uma Nota Fiscal Eletrônica (NF-e)."
    );
  }

  const chaveAcessoBruta = infNFe["@_Id"] as string | undefined;
  const chaveAcesso = chaveAcessoBruta
    ? chaveAcessoBruta.replace(/^NFe/, "")
    : null;

  const ide = (infNFe.ide ?? {}) as Record<string, unknown>;
  const emit = (infNFe.emit ?? {}) as Record<string, unknown>;
  const total = ((infNFe.total as Record<string, unknown>)?.ICMSTot ?? {}) as Record<
    string,
    unknown
  >;

  const dataEmissaoTexto = (ide.dhEmi ?? ide.dEmi) as string | undefined;
  const dataEmissao = dataEmissaoTexto ? new Date(dataEmissaoTexto) : null;

  const dets = paraArray(infNFe.det as Record<string, unknown> | Record<string, unknown>[] | undefined);

  const itens: ItemNfe[] = dets.map((det) => {
    const prod = (det.prod ?? {}) as Record<string, unknown>;
    return {
      codigo: String(prod.cProd ?? ""),
      descricao: String(prod.xProd ?? "Item sem descrição"),
      unidade: String(prod.uCom ?? "un"),
      quantidade: Number(prod.qCom ?? 0),
      valorUnitario: Number(prod.vUnCom ?? 0),
      valorTotal: Number(prod.vProd ?? 0),
    };
  });

  if (itens.length === 0) {
    throw new Error("Nenhum item de produto foi encontrado neste XML.");
  }

  return {
    chaveAcesso,
    numero: ide.nNF ? String(ide.nNF) : null,
    dataEmissao:
      dataEmissao && !Number.isNaN(dataEmissao.getTime()) ? dataEmissao : null,
    fornecedorNome: emit.xNome ? String(emit.xNome) : null,
    fornecedorCnpj: emit.CNPJ ? String(emit.CNPJ) : null,
    valorTotal: total.vNF ? Number(total.vNF) : null,
    itens,
  };
}
