# 🛍️ Grocerun

> **Self-hostable, real-time grocery list app for households.**

Grocerun transforms chaotic grocery runs into organized, efficient trips. It leverages your purchase history to suggest items, organizes them by store section, and syncs instantly across devices.

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

- **[User Guide](wiki/user-guide/features.md)**: How to use Grocerun.
- **[Self-Hosting](wiki/user-guide/self-hosting.md)**: Detailed deployment instructions.
- **[Developer Guide](wiki/developer-guide/devops-philosophy.md)**: Architecture and contribution.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Shadcn UI
- **Backend**: Next.js Server Actions
- **Database**: PostgreSQL (Prisma ORM)
- **Auth**: NextAuth.js (Google OAuth)

## 🤝 Contributing

Contributions are welcome! Please check the [Developer Guide](wiki/developer-guide/devops-philosophy.md) for our development philosophy.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
