"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Não renderiza nada visível — só recarrega os dados da página
// periodicamente, para o painel da cozinha se comportar como "tempo real"
// sem precisar de infraestrutura extra (WebSockets, etc).
export function AutoAtualizar({ intervaloMs = 4000 }: { intervaloMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, intervaloMs);
    return () => clearInterval(id);
  }, [router, intervaloMs]);

  return null;
}
