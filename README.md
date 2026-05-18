# PerformX Goal Portal

PerformX is a modern, enterprise-grade goal tracking portal built with Next.js 15, Prisma, PostgreSQL, NextAuth, and Tailwind CSS. It features automated progress calculations, hierarchical role-based access, shared department goals, and an AI-powered insights chatbot.

## Setup Steps

1. **Install Dependencies**
   Ensure you have `pnpm` installed, then run:
   ```bash
   pnpm install
   ```

2. **Start Database**
   Ensure Docker is running and spin up the local PostgreSQL database:
   ```bash
   docker-compose up -d
   ```

3. **Generate Prisma Client & Seed Data**
   Prepare your database schema and seed the initial demo data:
   ```bash
   pnpm db:generate
   pnpm db:push
   pnpm db:seed
   ```

4. **Run the Development Server**
   Start the application:
   ```bash
   pnpm dev
   ```

5. **Start Local AI (Ollama)**
   To enable the Chatbot, make sure Ollama is running locally:
   ```bash
   ollama run tinyllama
   ```

## Demo Logins

The application is pre-seeded with the following roles:

- **Admin Account**
  Email: `admin@atomberg.com`
  Password: `Admin@123`

- **Manager Account**
  Email: `manager@atomberg.com`
  Password: `Manager@123`

- **Employee Account**
  Email: `amit@atomberg.com`
  Password: `Employee@123`
# foxx
