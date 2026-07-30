# Reserva 88 — Plataforma de Administração para Lojas/Restaurantes

Sistema web **multi-loja** (multi-tenant): cada CNPJ cliente (ex: Empório
Reserva 88) tem seus próprios produtos, estoque, comandas, caixa e
financeiro, totalmente isolados dos dados de qualquer outra loja.

## Etapas concluídas

✅ **Etapa 1**: estrutura do projeto + login com perfis de acesso.
✅ **Etapa 2**: suporte a múltiplas lojas (multi-tenant) + Admin Geral.
✅ **Etapa 3**: cadastro de produtos (categorias, variações, fichas técnicas).
✅ **Etapa 4**: controle de estoque (notas fiscais de compra, ajustes, alertas, baixa por venda).

## Como o acesso é organizado

- **Admin Geral**: não pertence a nenhuma loja. Cadastra novas lojas
  (CNPJs clientes), controla o status da licença de cada uma (teste,
  ativa, suspensa) e pode entrar em **modo suporte** dentro de qualquer
  loja para ajudar (fica registrado em log de auditoria quem entrou,
  em qual loja e quando).
- **Dono** e **Gerente**: acesso completo dentro da própria loja,
  incluindo cadastro de usuários e financeiro.
- **Caixa**: opera o PDV (módulo futuro).
- **Garçom**: lança pedidos nas comandas pelo celular (módulo futuro).
- **Cozinha**: acompanha o painel de pedidos (módulo futuro).

### Regra de ouro do multi-tenant

**Toda tabela e toda consulta de dados operacionais (produtos, estoque,
comandas, vendas, financeiro) precisa ter e filtrar por `lojaId`.**
Isso é o que garante que os dados de uma loja nunca aparecem para outra.
Ao construir os próximos módulos, sempre usar `exigirContextoLoja(...)`
(em `src/lib/dal.ts`) para obter a loja atual antes de qualquer consulta.

## Proteção de dados (LGPD)

Medidas técnicas já implementadas:
- **Isolamento de dados por loja** (multi-tenant) — ver regra acima.
- **Senhas nunca em texto puro**: são transformadas (hash) com bcrypt
  antes de serem salvas.
- **Sessão de login segura**: cookie assinado (`httpOnly`), não pode ser
  lido nem forjado por scripts no navegador.
- **Log de auditoria** de acessos de suporte do Admin Geral às lojas
  (`LogAcessoSuporte`), atendendo ao princípio de prestação de contas.
- **Desativação em vez de exclusão** de usuários, preservando histórico
  sem perder a rastreabilidade.

Pendente (fora do escopo técnico, requer acompanhamento jurídico):
Termos de Uso e Política de Privacidade formalizando a relação entre a
plataforma (operadora dos dados) e cada loja cliente (controladora dos
dados dos seus próprios clientes/funcionários).

## Tecnologias usadas (e por quê)

- **Next.js** (React): monta tanto as telas quanto o "cérebro" do sistema
  em um único projeto.
- **PostgreSQL**: banco de dados onde tudo fica salvo (lojas, usuários,
  produtos, vendas, etc).
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

4. Crie a primeira conta de acesso (Admin Geral), definindo `ADMIN_EMAIL`
   e `ADMIN_SENHA` no `.env`:
   ```bash
   npm run db:seed
   ```

5. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse http://localhost:3000, faça login como Admin Geral e cadastre
   sua primeira loja em "Lojas" → "Nova loja".

## Comandos úteis

| Comando              | O que faz                                              |
|-----------------------|---------------------------------------------------------|
| `npm run dev`         | Roda o sistema localmente, em modo de desenvolvimento    |
| `npm run build`       | Gera a versão de produção (usada ao publicar o sistema)  |
| `npm run db:migrate`  | Aplica mudanças no formato do banco de dados             |
| `npm run db:seed`     | Cria a primeira conta de acesso (Admin Geral)             |
| `npm run db:studio`   | Abre uma tela visual para ver/editar os dados do banco   |

## Estrutura de pastas (visão geral)

```
prisma/schema.prisma      Desenho das tabelas do banco de dados
src/lib/db.ts             Conexão com o banco de dados
src/lib/session.ts        Criação/leitura do login (cookie de sessão)
src/lib/dal.ts            Checagens de "quem pode acessar o quê" e a loja atual
src/lib/cnpj.ts           Validação/formatação de CNPJ
src/app/actions/          Ações do servidor (login, criar usuário, criar loja...)
src/app/login/            Tela de login
src/app/admin/lojas/      Telas do Admin Geral (gestão de lojas/licenças)
src/app/dashboard/        Telas internas de cada loja (protegidas por login)
src/app/dashboard/produtos/  Cadastro de produtos, categorias e fichas técnicas
src/app/dashboard/estoque/   Estoque, notas fiscais de compra e ajustes
src/lib/estoque.ts        Regras de entrada/saída de estoque (usado também pelo futuro Caixa/PDV)
src/lib/nfe.ts            Leitor do XML de Nota Fiscal Eletrônica (NF-e)
src/proxy.ts              "Porteiro" que barra quem não está logado
```

## Cadastro de produtos

- **Categorias**: podem ter subcategorias (ex: "Lanches" → "Quentes").
- **Produto simples**: um item "de uma peça só". Pode ter o campo
  "Aparece à venda" desmarcado para funcionar só como insumo interno
  (ex: "Pão de forma", usado em receitas mas não vendido sozinho).
- **Variações**: um mesmo produto pode ter variações com preços
  diferentes (ex: "Lata 350ml" vs "600ml"). Quando há variações, o
  preço "base" do produto não é usado.
- **Produto composto (ficha técnica)**: feito a partir de outros
  produtos/insumos, com a quantidade de cada um (ex: um sanduíche
  usa 2 unidades de pão e 1 de presunto). A baixa automática desses
  insumos no estoque, ao vender, é implementada no módulo de estoque.

## Controle de estoque

- **Entrada por nota fiscal de compra**: lançada manualmente (formulário)
  ou importando o **XML da NF-e** do fornecedor — o sistema lê o
  fornecedor, número, data e itens automaticamente, e você confere/ajusta
  a qual produto cadastrado cada item corresponde antes de confirmar.
- **Ajuste manual de estoque**: entradas/saídas avulsas (correção, perda,
  quebra), com motivo registrado.
- **Alerta de estoque baixo**: cada produto tem um "estoque mínimo"; abaixo
  dele, aparece um aviso na tela de Estoque.
- **Baixa automática por venda**: função pronta em `src/lib/estoque.ts`
  (`venderProdutos`) para o futuro módulo de Caixa/PDV chamar ao fechar
  uma venda. Produto simples desconta ele mesmo; produto composto desconta
  cada insumo da ficha técnica, multiplicado pela quantidade vendida. Se
  não houver estoque suficiente de algum insumo, a venda inteira é
  bloqueada (nada é alterado pela metade).

## Próximos módulos

1. Comandas por mesa e avulsas + app do garçom (mobile)
2. Painel da cozinha
3. Caixa / PDV com ticket de venda (vai usar a baixa automática já pronta)
4. Financeiro (contas a pagar/receber, fluxo de caixa)
