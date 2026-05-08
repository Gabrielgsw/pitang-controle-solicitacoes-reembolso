# Sistema de Controle de Solicitações de Reembolso - Pitang

Um sistema web desenvolvido para o Desafio Técnico do Programa de Estágio da Pitang. Este sistema é voltado para  para gestão, aprovação e acompanhamento de solicitações de reembolso corporativo, para gastos relativos a viagens/eventos. Desenvolvido com foco em usabilidade, segurança e controle de acesso baseado em perfis (RBAC).

## Tecnologias Utilizadas

- [React](https://react.dev/) - Biblioteca JavaScript para construção de interfaces de usuário.
- [Typescript](https://www.typescriptlang.org/) - Linguagem de programação
- [Express](https://expressjs.com/pt-br/) - Framework para desenvolvimento backend em node.js
- [Prisma](https://www.prisma.io/) - ORM de alta performance para node.js
- [Bun](https://bun.com/) - Ambiente de execução rápido e otimizado para node.js
- [Vite](https://vitejs.dev/) - Build tool e dev server rápido para projetos web modernos.
- [React Router](https://reactrouter.com/) - Biblioteca de roteamento para React.
- [React Hook Form](https://react-hook-form.com/) - Biblioteca para gerenciamento de formulários em React com performance otimizada.
- [Zod](https://zod.dev/)- Biblioteca de validação de schemas.
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utilitário para criação rápida de designs personalizados.
- [shadcn/ui](https://ui.shadcn.com/) - Biblioteca de componentes de UI reutilizáveis e customizáveis construídos com Radix UI e Tailwind CSS.
- [Jest](https://jestjs.io/pt-BR/) - Framework de testes unitários para o frontend.
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro) - Conjunto de utilitários para testar componentes React de forma centrada no usuário.
- [Supertest](https://www.npmjs.com/package/supertest) - Biblioteca para testes no backend.
- [Axios](https://axios.dev/) - Cliente HTTP baseado em Promises para o navegador e node.js.
- [DayJs](https://day.js.org/) - Biblioteca leve para manipulação de datas
- [Lucide React](https://lucide.dev/) - Conjunto de ícones bem elaborados para React.

---

## Endpoints

###  Autenticação

- Realizar login - `POST` `/login`

### Categorias

- Listar categorias - `GET` `/categories`
- Criar categoria - `POST` `/categories`
- Atualizar categoria - `PUT` `/categories/:id`

### Reembolsos

- Listar solicitações - `GET` `/reimbursements`
- Criar solicitação - `POST` `/reimbursements`
- Buscar solicitação por ID - `GET` `/reimbursements/:id`
- Editar solicitação - `PUT` `/reimbursements/:id`

### Ações de Fluxo

- Submeter solicitação - `POST` `/reimbursements/:id/submit`
- Aprovar solicitação - `POST` `/reimbursements/:id/approve`
- Rejeitar solicitação - `POST` `/reimbursements/:id/reject`
- Cancelar solicitação - `POST` `/reimbursements/:id/cancel`
- Marcar como pago - `POST` `/reimbursements/:id/pay`

### Histórico e Anexos

- Listar histórico - `GET` `/reimbursements/:id/history`
- Upload de anexo - `POST` `/reimbursements/:id/attachments`
- Listar anexos - `GET` `/reimbursements/:id/attachments`

### Usuários

- Cadastrar usuário - `POST` `/users`
- Listar usuários - `GET` `/users`
- Buscar usuário por ID - `GET` `/users/:id`
- Atualizar usuário - `PUT` `/users/:id`
- Excluir usuário - `DELETE` `/users/:id`

---
## Funcionalidades implementadas

### Backend
- [x] API RESTful com Node.js, Express.js e TypeScript
- [x] Login com JWT
- [x] Cadastro de usuário
- [x] Middleware de autenticação
- [x] Middleware de permissão por perfil
- [x] Validação de body, params e query params com Zod
- [x] CRUD de categorias
- [x] CRUD de solicitações de reembolso
- [x] Modelagem com Prisma
- [x] Manipulação de datas com DayJS 
- [x] Upload/listagem simulada de anexos
- [x] Envio da solicitação
- [x] Aprovação de solicitação
- [x] Rejeição com justificativa
- [x] Marcação como pago
- [x] Listagem do histórico da solicitação
- [x] Tratamento adequado de erros HTTP
- [x] Testes de integração com Jest e Supertest para rotas principais
- [x] Paginação
- [x] Filtro por status
- [x] Filtro por categoria
- [x] Busca por colaborador
- [x] Ordenação por data ou valor
- [x] Dashboard com totais
- [x] Preview mockado de anexos
- [x] Soft delete
- [x] Seeds iniciais
- [x] Collection do Postman
- [x] Consumo simples de API externa (AwesomeAPI: Conversão de cotações)
- [x] Docker Compose
- [x] Bloqueio de despesas futuras


### Frontend
| [x] | Tela | Objetivo | Cuidados esperados |
|-----|------|----------|--------------------|
| [x] | Login | Autenticar usuário, salvar token e atualizar o contexto global de autenticação. | Exibir erro para credenciais inválidas. |
| [x] | Cadastro | Criar usuário. | Validar campos obrigatórios e e-mail. |
| [x] | Dashboard/Listagem | Listar solicitações conforme o perfil usando chamada à API com Axios ou Fetch. | Exibir loading, erro e estado vazio. |
| [x] | Nova solicitação | Criar solicitação de reembolso. | Validar valor, data, categoria e descrição no frontend e tratar erros retornados pelo backend. |
| [x] | Editar solicitação | Editar solicitação própria em RASCUNHO. | Bloquear edição quando o status não permitir. |
| [x] | Detalhe da solicitação | Visualizar dados completos, anexos e status. | Mostrar ações disponíveis conforme perfil e status. |
| [x] | Histórico | Visualizar trilha de auditoria. | Exibir ação, usuário, data/hora e observação. |
| [x] | Aprovação/Rejeição | Permitir ação do gestor. | Exigir justificativa ao rejeitar. |
| [x] | Pagamento | Permitir marcação como pago pelo financeiro. | Permitir apenas solicitações APROVADAS. |
| [x] | Gestão de categorias | Admin cria, edita e inativa categorias. | Não permitir uso de categoria inativa em novas solicitações. |
| [x] | Usuarios | Visualizar usuários cadastrados | Gerenciamento de usuários por parte do ADMIN |





---

## Instruções de Execução

### Pré-requisitos
Certifique-se de ter instalado em sua máquina:
* [Node.js](https://nodejs.org/) (v18 ou superior)
* [Bun](https://bun.sh/) (runtime utilizado para o desenvolvimento)
* [Docker](https://www.docker.com/) (execução do banco de dados de desenvolvimento e testes)

### Rodando o Backend
1. Navegue até a pasta do backend.
2. Instale as dependências:
```bash
    cd .\packages\
    cd .\backend\
    bun install
```
 
3. Configure o seu arquivo `.env` com a URL do banco de dados e a chave JWT Secret.
4. Rode este comando docker, na pasta do backend, para iniciar o banco:
```bash
    docker compose up -d
```
5. Execute as migrations do banco: `bunx prisma migrate dev`
6. Execute para carregar as configurações do prisma: `bunx prisma generate`
7. Popule o banco com o seed criado: `bunx prisma db seed`

### Rodando o Frontend
1. Navegue até a pasta do frontend.
2. Instale as dependências: `bun install`
4. Inicie o servidor de desenvolvimento: `bun run dev`
5. O sistema estará disponível em: `http://localhost:5173`

### Executando os Testes
Para rodar os testes do Frontend:
```bash
cd .\packages\
cd .\frontend\
bun test --preload .\src\setupTests.ts 
```

Para rodar os testes do Backend:
```bash
cd .\packages\
cd .\backend\
bun test  

```

## Usuários para teste
| E-mail                     | Senha  | Perfil      |
|----------------------      |--------|-------------|
| gabriel.germano@pitang.com | pitang123 | COLABORADOR |
| gestor@pitang.com           | pitang123 | GESTOR      |
| financeiro@pitang.com       | pitang123 | FINANCEIRO  |
| admin@pitang.com            | pitang123 | ADMIN       |

