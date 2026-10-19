# 🔨 Forja de Prompts

A **Forja de Prompts** é uma biblioteca de prompts alimentada por você mesmo. O objetivo deste sistema é facilitar o trabalho com múltiplos contextos, projetos e até trabalhar simultaneamente com várias Inteligências Artificiais e LLMs diferentes. A ideia central é otimizar e facilitar o dia a dia de um desenvolvedor ou profissional que utiliza IA como sua principal ferramenta de trabalho.

> **Licença e Uso Público**
> Este repositório é de uso público. Você é livre para clonar, estudar e utilizar. No entanto, é obrigatório divulgar e manter os créditos do criador original: **Prof. Emerson Silva**. Se você for alterar ou fazer um fork (derivação) deste projeto, adicione o seu nome, mas mantenha o nome de quem começou o projeto.

---

## 📂 Estrutura do Projeto

O projeto está dividido em duas frentes (Frontend e Backend)[cite: 1]:

* **`forja-de-prompts-api/`** (Backend Node.js)
  * `Server.js`: Servidor Express contendo as rotas de API, configuração CORS, integração com Google Gemini e upload de arquivos via Multer[cite: 2].
  * `.env`: Arquivo (não versionado) com as variáveis de ambiente[cite: 3].
  * `uploads_forja/`: Diretório onde os anexos e mídias são salvos[cite: 1, 2].
* **`forja-de-prompts-web/`** (Frontend React + Vite)[cite: 1]
  * `src/`: Contém os componentes da interface (ex: `PainelPrincipal.jsx`, `TelaEntrada.jsx`)[cite: 4, 5].
  * `vite.config.js`: Configuração do bundler Vite[cite: 1].

---

## ⚙️ Configuração do Ambiente (.env)

No backend (`forja-de-prompts-api`), crie um arquivo chamado `.env` e configure as seguintes variáveis:

```env
PORT=3527
CORS_ORIGENS=http://localhost:5173,[http://127.0.0.1:5173](http://127.0.0.1:5173)
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=forja_de_prompts_db
DB_PORT=3306
GEMINI_API_KEY=sua_chave_do_google_ai_studio
GEMINI_MODEL=gemini-3.5-flash-lite
PASTA_UPLOADS=uploads_forja
LIMITE_TAMANHO_ARQUIVO_MB=50