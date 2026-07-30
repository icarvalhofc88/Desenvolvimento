import { redirect } from "next/navigation";

// Quem chegar aqui já passou pelo "proxy" (nosso porteiro de autenticação),
// então ou já está logado, ou o proxy já mandou para /login antes disso.
export default function Home() {
  redirect("/dashboard");
}
