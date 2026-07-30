import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar — Empório Reserva 88",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-zinc-900">
          Empório Reserva 88
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          Entre com seu e-mail e senha para acessar o sistema.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
