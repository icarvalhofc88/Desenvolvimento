# Empório Reserva 88 — Sistema de Administração

Sistema web para administrar o Empório Reserva 88: produtos, estoque,
comandas do restaurante, caixa/PDV e financeiro.

## Etapa atual

✅ **Etapa 1 concluída**: estrutura do projeto + login com perfis de acesso.

Perfis disponíveis:
- **Dono** e **Gerente**: acesso completo, incluindo cadastro de usuários.
- **Caixa**: opera o PDV (módulo futuro).
- **Garçom**: lança pedidos nas comandas pelo celular (módulo futuro).
- **Cozinha**: acompanha o painel de pedidos (módulo futuro).

## Tecnologias usadas (e por quê)

- **Next.js** (React): monta tanto as telas quanto o "cérebro" do sistema
  em um único projeto.
- **PostgreSQL**: banco de dados onde tudo fica salvo (usuários, produtos,
  vendas, etc).
- **Prisma**: tradutor entre o código e o banco de dados — em vez de
  escrever comandos SQL manualmente, descrevemos os dados em
  `prisma/schema.prisma` e o Prisma cuida do resto.
- **jose + cookies httpOnly**: geram e conferem o "crachá" de login
  (sessão) de forma segura.
- **bcryptjs**: nunca guardamos a senha do usuário como texto puro no
  banco — ela é transformada (hash) antes de ser salva.

## Como rodar o projeto localmente

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env` e preencha com os valores reais
   (endereço do banco de dados e uma chave secreta gerada com
   `openssl rand -base64 32`).

3. Aplique a estrutura do banco de dados:
   ```bash
   npm run db:migrate
   ```

4. Crie a primeira conta de acesso (dono), definindo `ADMIN_EMAIL` e
   `ADMIN_SENHA` no `.env`:
   ```bash
   npm run db:seed
   ```

5. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse http://localhost:3000 e faça login com o e-mail/senha do passo 4.

## Comandos úteis

| Comando              | O que faz                                              |
|-----------------------|---------------------------------------------------------|
| `npm run dev`         | Roda o sistema localmente, em modo de desenvolvimento    |
| `npm run build`       | Gera a versão de produção (usada ao publicar o sistema)  |
| `npm run db:migrate`  | Aplica mudanças no formato do banco de dados             |
| `npm run db:seed`     | Cria a primeira conta de acesso (dono)                   |
| `npm run db:studio`   | Abre uma tela visual para ver/editar os dados do banco   |

## Estrutura de pastas (visão geral)

```
prisma/schema.prisma      Desenho das tabelas do banco de dados
src/lib/db.ts             Conexão com o banco de dados
src/lib/session.ts        Criação/leitura do login (cookie de sessão)
src/lib/dal.ts            Checagens de "quem pode acessar o quê"
src/app/actions/          Ações do servidor (login, criar usuário, etc)
src/app/login/            Tela de login
src/app/dashboard/        Telas internas do sistema (protegidas por login)
src/proxy.ts              "Porteiro" que barra quem não está logado
```

## Próximos módulos

1. Cadastro de produtos (categorias, variações, fichas técnicas)
2. Controle de estoque (entrada por nota fiscal, baixa automática)
3. Comandas por mesa e avulsas + app do garçom (mobile)
4. Painel da cozinha
5. Caixa / PDV com ticket de venda
6. Financeiro (contas a pagar/receber, fluxo de caixa)
