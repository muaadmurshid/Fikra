import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const technologies = [
  {
    name: "TypeScript",
    category: "LANGUAGE" as const,
    description:
      "A typed superset of JavaScript for building safer and more maintainable applications.",
  },
  {
    name: "JavaScript",
    category: "LANGUAGE" as const,
    description:
      "A programming language widely used for web, mobile, and server-side development.",
  },
  {
    name: "React Native",
    category: "MOBILE" as const,
    description:
      "A framework for building native mobile applications using React.",
  },
  {
    name: "Expo",
    category: "MOBILE" as const,
    description:
      "A platform and toolchain that simplifies React Native application development.",
  },
  {
    name: "React",
    category: "FRONTEND" as const,
    description:
      "A library for building component-based user interfaces.",
  },
  {
    name: "Node.js",
    category: "BACKEND" as const,
    description:
      "A JavaScript runtime commonly used to build backend services and APIs.",
  },
  {
    name: "Express",
    category: "FRAMEWORK" as const,
    description:
      "A lightweight web framework for building Node.js HTTP APIs and services.",
  },
  {
    name: "PostgreSQL",
    category: "DATABASE" as const,
    description:
      "A relational database system designed for reliable and structured application data.",
  },
  {
    name: "Prisma",
    category: "LIBRARY" as const,
    description:
      "A type-safe ORM and database toolkit for TypeScript and Node.js.",
  },
];

async function main() {
  console.log("Seeding Fikra technology catalog...");

  for (const technology of technologies) {
    await prisma.technology.upsert({
      where: {
        name: technology.name,
      },
      update: {
        category: technology.category,
        description: technology.description,
      },
      create: technology,
    });

    console.log(`Seeded: ${technology.name}`);
  }

  console.log(
    `Technology catalog ready: ${technologies.length} technologies.`
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });