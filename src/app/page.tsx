import { redirect } from "next/navigation";
import { obterContexto } from "@/lib/dal";

// Quem chegar aqui já passou pelo "proxy" (nosso porteiro de autenticação),
// então já está logado. Só falta decidir para onde mandar: Admin Geral vai
// para a lista de lojas, os demais vão para o painel da loja.
export default async function Home() {
  const contexto = await obterContexto();

  if (!contexto) {
    redirect("/login");
  }

  redirect(contexto.lojaId ? "/dashboard" : "/admin/lojas");
}
