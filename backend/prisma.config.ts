import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "src/prisma/schema.prisma",
  datasource: {
    // Application traffic can use a pooled URL, while schema commands should
    // prefer the direct Neon/PostgreSQL connection when one is supplied.
    url: process.env.DATABASE_URL_UNPOOLED ?? env("DATABASE_URL"),
  },
  migrations: {
    path: "src/prisma/migrations",
    seed: "ts-node src/prisma/seed.ts",
  },
});
