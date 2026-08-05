import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { lerSessao } from "@/lib/session";

// O "proxy" roda antes de qualquer página ser carregada. Aqui fazemos a
// checagem rápida: "esse visitante está logado?". Isso evita que alguém
// não autenticado veja qualquer tela do sistema, mesmo digitando a URL
// diretamente no navegador.
const ROTAS_PUBLICAS = ["/login"];

export default async function proxy(request: NextRequest) {
  const caminho = request.nextUrl.pathname;
  const rotaPublica = ROTAS_PUBLICAS.includes(caminho);

  const sessao = await lerSessao();

  if (!rotaPublica && !sessao) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (rotaPublica && sessao) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Roda em tudo, exceto arquivos estáticos, imagens e o manifesto do PWA
  // (o navegador precisa conseguir buscar esses arquivos sem estar logado).
  matcher: [
    "/((?!_next/static|_next/image|manifest\\.json|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)",
  ],
};
