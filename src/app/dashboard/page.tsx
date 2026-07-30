import { obterUsuarioAtual } from "@/lib/dal";

const MODULOS_FUTUROS = [
  "Cadastro de produtos (categorias, variações e fichas técnicas)",
  "Controle de estoque (entradas por nota fiscal e baixa automática)",
  "Comandas por mesa e avulsas + app do garçom",
  "Painel da cozinha",
  "Caixa / PDV com ticket de venda",
  "Financeiro (contas a pagar/receber, fluxo de caixa)",
];

export default async function DashboardPage() {
  const usuario = await obterUsuarioAtual();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Bem-vindo, {usuario?.nome}
        </h1>
        <p className="text-sm text-zinc-500">
          Esta é a primeira etapa do sistema: estrutura do projeto e login
          com perfis de acesso.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-medium text-zinc-900">
          Próximos módulos a construir
        </h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600">
          {MODULOS_FUTUROS.map((modulo) => (
            <li key={modulo}>{modulo}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
