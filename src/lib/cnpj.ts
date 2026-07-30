// Funções para validar e formatar CNPJ (Cadastro Nacional da Pessoa
// Jurídica). O algoritmo dos dígitos verificadores é público e definido
// pela Receita Federal.

export function apenasNumeros(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function validarCnpj(valor: string): boolean {
  const cnpj = apenasNumeros(valor);

  if (cnpj.length !== 14) return false;
  // Rejeita sequências de dígitos repetidos (ex: 00000000000000),
  // que passariam no cálculo mas não são CNPJs válidos.
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calcularDigito = (base: string, pesos: number[]) => {
    const soma = base
      .split("")
      .reduce((acc, digito, i) => acc + Number(digito) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const digito1 = calcularDigito(
    cnpj.slice(0, 12),
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  );
  if (digito1 !== Number(cnpj[12])) return false;

  const digito2 = calcularDigito(
    cnpj.slice(0, 13),
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  );
  if (digito2 !== Number(cnpj[13])) return false;

  return true;
}

export function formatarCnpj(valor: string): string {
  const cnpj = apenasNumeros(valor);
  if (cnpj.length !== 14) return valor;
  return cnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}
