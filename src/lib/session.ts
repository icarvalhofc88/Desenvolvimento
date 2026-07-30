import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Perfil } from "@/generated/prisma/client";

// Chave secreta usada para assinar o cookie de sessão. Vem do arquivo .env
// e nunca deve ser exposta publicamente.
const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
  throw new Error("SESSION_SECRET não definida no arquivo .env");
}
const encodedKey = new TextEncoder().encode(secretKey);

const NOME_COOKIE = "sessao";
const DURACAO_SESSAO_MS = 12 * 60 * 60 * 1000; // 12 horas
const DURACAO_SESSAO_JOSE = "12h"; // mesmo valor, no formato que a lib "jose" espera

export type SessionPayload = {
  usuarioId: string;
  nome: string;
  perfil: Perfil;
};

// Transforma os dados da sessão em um token assinado (não pode ser
// forjado nem alterado por quem não tem a chave secreta).
async function encrypt(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(DURACAO_SESSAO_JOSE)
    .sign(encodedKey);
}

// Faz o caminho inverso: confere a assinatura e devolve os dados da sessão.
// Se o token for inválido ou tiver expirado, devolve null.
async function decrypt(token: string | undefined = ""): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// Cria a sessão (login bem-sucedido): gera o cookie e o grava no navegador.
export async function criarSessao(dados: SessionPayload) {
  const expiraEm = new Date(Date.now() + DURACAO_SESSAO_MS);
  const sessao = await encrypt(dados);
  const cookieStore = await cookies();

  cookieStore.set(NOME_COOKIE, sessao, {
    httpOnly: true, // JavaScript do navegador não consegue ler este cookie
    secure: process.env.NODE_ENV === "production", // exige https em produção
    sameSite: "lax",
    expires: expiraEm,
    path: "/",
  });
}

// Lê e valida a sessão atual a partir do cookie da requisição.
export async function lerSessao(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(NOME_COOKIE)?.value;
  return decrypt(token);
}

// Apaga a sessão (logout).
export async function encerrarSessao() {
  const cookieStore = await cookies();
  cookieStore.delete(NOME_COOKIE);
}
