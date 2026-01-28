# 🚀 OtavioAI

Sistema de CRM/Pipeline inteligente com assistente de IA integrado para gerenciamento de leads, conversas de chat e cotações de produtos automotivos.

![React](https://img.shields.io/badge/React-19.2.3-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.2-646cff?style=flat-square&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-2.90-3ecf8e?style=flat-square&logo=supabase)

## ✨ Funcionalidades

- **📊 Dashboard** - KPIs, gráficos de tendência e interações recentes
- **💬 Chat** - Interface de chat com clientes via WhatsApp/N8N
- **📋 Pipeline** - Kanban de produtos com colunas de status
- **👥 Gestão de Usuários** - Controle de acesso baseado em roles e permissões
- **📈 Insights** - Análises e relatórios detalhados
- **🎯 Leads** - Gestão completa de clientes
- **📚 Base de Conhecimento** - Upload de documentos e URLs para RAG

## 🛠️ Tecnologias

| Stack | Tecnologia |
|-------|------------|
| Frontend | React + TypeScript |
| Build Tool | Vite |
| Backend | Supabase (PostgreSQL + Auth) |
| Gráficos | Recharts |
| Estilização | CSS Modules |

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+
- Conta Supabase configurada

### Passos

1. Clone o repositório:
```bash
git clone https://github.com/andrearruda2604/OtavioAi.git
cd OtavioAi
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

4. Edite `.env.local` com suas credenciais:
```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
GEMINI_API_KEY=sua_chave_gemini
```

5. Execute as migrations no Supabase (pasta `/supabase`)

6. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 📁 Estrutura do Projeto

```
OtavioAi/
├── api/           # Endpoints serverless
├── components/    # Componentes reutilizáveis
├── contexts/      # Context providers React
├── lib/           # Utilitários e configuração Supabase
├── pages/         # Páginas da aplicação
├── supabase/      # Migrations SQL
└── types/         # Definições TypeScript
```

## 📜 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run preview` | Preview do build de produção |

## 📖 Documentação

Para documentação técnica detalhada, consulte [DOCUMENTATION.md](./DOCUMENTATION.md).

## 🔐 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) em todas as tabelas
- Sistema de permissões baseado em roles

## 📝 Licença

Este projeto é proprietário e de uso restrito.

---

Desenvolvido com ❤️ por [Andre Arruda](https://github.com/andrearruda2604)
