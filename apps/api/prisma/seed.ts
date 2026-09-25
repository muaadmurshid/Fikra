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

async function seedTechnologies() {
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

async function seedRoadmapHints() {
  console.log("Seeding hints for existing coding levels...");

  const roadmaps = await prisma.roadmap.findMany({
    where: {
      isActive: true,
    },
    include: {
      project: {
        select: {
          id: true,
          title: true,
        },
      },
      stages: {
        include: {
          levels: true,
        },
      },
    },
  });

  if (roadmaps.length === 0) {
    console.log(
      "No active roadmaps found. No existing hints need to be seeded."
    );
    return;
  }

  let levelCount = 0;
  let hintCount = 0;

  for (const roadmap of roadmaps) {
    console.log(
      `Adding hints to active roadmap: ${roadmap.project.title}`
    );

    const levels = roadmap.stages.flatMap(
      (stage) => stage.levels
    );

    for (const level of levels) {
      const hints = [
        {
          hintOrder: 1,
          content:
            `Break "${level.title}" into the smallest ` +
            "working implementation first.",
          xpCost: 0,
        },
        {
          hintOrder: 2,
          content:
            "Review the level instructions carefully and use " +
            "the selected project technologies where appropriate.",
          xpCost: 0,
        },
        {
          hintOrder: 3,
          content:
            "Verify the current application still works before " +
            `considering "${level.title}" complete.`,
          xpCost: 0,
        },
      ];

      for (const hint of hints) {
        await prisma.hint.upsert({
          where: {
            levelId_hintOrder: {
              levelId: level.id,
              hintOrder: hint.hintOrder,
            },
          },
          update: {
            content: hint.content,
            xpCost: hint.xpCost,
          },
          create: {
            levelId: level.id,
            hintOrder: hint.hintOrder,
            content: hint.content,
            xpCost: hint.xpCost,
          },
        });

        hintCount++;
      }

      levelCount++;
    }

    console.log(
      `Hints ready for ${levels.length} levels in ${roadmap.project.title}.`
    );
  }

  console.log(
    `Roadmap hints ready: ${levelCount} levels, ${hintCount} hints.`
  );
}

async function main() {
  await seedTechnologies();
  await seedRoadmapHints();

  console.log("Fikra seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });