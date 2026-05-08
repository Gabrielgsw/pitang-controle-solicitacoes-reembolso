# Sistema de Controle de Solicitações de Reembolso (Pitang)

Um sistema web desenvolvido para o Desafio Técnico do Programa de Estágio da Pitang. Este sistema é voltado para  para gestão, aprovação e acompanhamento de solicitações de reembolso corporativo. Desenvolvido com foco em usabilidade, segurança e controle de acesso baseado em perfis (RBAC).

## Tecnologias Utilizadas

- [React](https://react.dev/) - Biblioteca JavaScript para construção de interfaces de usuário.
- [Typescript](https://www.typescriptlang.org/) - Linguagem de programação
- [Express](https://expressjs.com/pt-br/) - Framework para desenvolvimento backend em node.js
- [Prisma](https://www.prisma.io/) - ORM 
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

## Funcionalidades implementadas

### Autenticação & Acesso
- [x] Login com JWT.
- [x] Cadastro de usuários(Apenas ADMIN).
- [x] Proteção de rotas no frontend.
- [x] Controle de acesso no backend via RBAC.
- [x] Middleware de autenticação.


### Dashboard & Listagem de Solicitações de reembolso
- [x] Listagem de reembolsos com paginação.
- [x] Filtros avançados combinados (Status, Categoria, Nome do Colaborador).
- [x] Ordenação de registros .
- [x] Cards de totalização financeira por status.
- [x] Controle de acesso por perfil.

### Gestão de Solicitações
- [x] Criação de nova solicitação de reembolso.
- [x] Mock/Simulação de upload de comprovantes em PDF.
- [x] Visualização de detalhes da solicitação com iframe para preview do comprovante.
- [x] Edição de solicitações existentes.
- [x] Histórico de movimentações da solicitação.


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
 
3. Configure o seu arquivo `.env` com a URL do banco de dados e a chave JWT.
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

