# 🛍️ Grocerun

> **Self-hostable grocery list app for households.**

Grocerun transforms chaotic grocery runs into organized, efficient trips. It leverages your purchase history to suggest items and organizes them by store section.

![License](https://img.shields.io/github/license/chaixdev/grocerun)
![Docker Image Version (latest by date)](https://img.shields.io/github/v/release/chaixdev/grocerun)

## ✨ Features

- **Smart Catalog**: Remembers what you buy and where.
- **Store Layouts**: Define custom sections for your favorite stores (e.g., "Produce" -> "Dairy" -> "Frozen").
- **Mobile First**: Designed to feel like a native app on your phone.
- **Dark Mode**: Easy on the eyes.

## 🚀 Getting Started

### Self-Hosting (Docker)

The easiest way to run Grocerun is with Docker Compose.

1.  Download the [docker-compose.prod.yml](docker-compose.prod.yml).
2.  Configure your `.env` file.
3.  Run `docker compose up -d`.

See the **[Deployment Guide](DEPLOY.md)** for full instructions.

### Development

To run the project locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 📚 Documentation

- **[User Guide](../../wiki/user-guide/README.md)**: App features and usage guide.
- **[Architecture](../../wiki/architecture/README.md)**: System views and constraints.
- **[Developer Workflow](../../wiki/development/agentic-workflow.md)**: AI-assisted development process.

## 🛠️ Tech Stack

- **Frontend**: Vite 6, React 19, TanStack Router, Tailwind CSS
- **Backend**: NestJS 11 REST API
- **Database**: SQLite with Prisma 7
- **Auth**: `oidc-spa` with Google-only OIDC

## 🤝 Contributing

Contributions are welcome. Please check the [developer workflow](../../wiki/development/agentic-workflow.md)
and [coding standards](../../wiki/rules/coding-standards.md) first.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
