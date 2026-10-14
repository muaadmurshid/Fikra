
import { validateSubmissionSafety } from "../src/services/submission-safety.service";

interface TestCase {
  name: string;
  submittedCode: string;
  levelTitle: string;
  fileChanges: {
    path: string;
    content: string;
  }[];
  expectedSafe: boolean;
}

const safeEnvExample = [
  "DATABASE_URL=postgresql://localhost:5432/example_db",
  "JWT_SECRET=replace-with-a-secure-secret",
  "PORT=3000",
].join("\n");

const cases: TestCase[] = [
  {
    name: "Safe TypeScript submission",
    submittedCode: "export const greeting = 'Hello Fikra';",
    levelTitle: "Configure TypeScript",
    fileChanges: [
      {
        path: "src/index.ts",
        content: "export const greeting = 'Hello';",
      },
    ],
    expectedSafe: true,
  },
  {
    name: "Safe Level 4 environment example",
    submittedCode: "Added example environment configuration.",
    levelTitle: "Set up environment configuration",
    fileChanges: [
      {
        path: ".env.example",
        content: safeEnvExample,
      },
    ],
    expectedSafe: true,
  },
  {
    name: "Reject real .env file",
    submittedCode: "Environment configuration",
    levelTitle: "Set up environment configuration",
    fileChanges: [
      {
        path: ".env",
        content: safeEnvExample,
      },
    ],
    expectedSafe: false,
  },
  {
    name: "Reject .env.production",
    submittedCode: "Environment configuration",
    levelTitle: "Another level",
    fileChanges: [
      {
        path: ".env.production",
        content: "PORT=3000",
      },
    ],
    expectedSafe: false,
  },
  {
    name: "Reject path traversal",
    submittedCode: "Attempt with invalid file path",
    levelTitle: "Another level",
    fileChanges: [
      {
        path: "../secrets.txt",
        content: "Example text",
      },
    ],
    expectedSafe: false,
  },
  {
    name: "Reject absolute Windows path",
    submittedCode: "Attempt with absolute file path",
    levelTitle: "Another level",
    fileChanges: [
      {
        path: "C:\\secrets\\config.txt",
        content: "Example text",
      },
    ],
    expectedSafe: false,
  },
  {
    name: "Reject duplicate paths",
    submittedCode: "Attempt with duplicate file paths",
    levelTitle: "Another level",
    fileChanges: [
      {
        path: "src/index.ts",
        content: "export const a = 1;",
      },
      {
        path: "src/index.ts",
        content: "export const b = 2;",
      },
    ],
    expectedSafe: false,
  },
  {
    name: "Reject private key",
    submittedCode:
      "-----BEGIN PRIVATE KEY-----\nexample\n-----END PRIVATE KEY-----",
    levelTitle: "Another level",
    fileChanges: [],
    expectedSafe: false,
  },
  {
    name: "Reject GitHub token pattern",
    submittedCode: "ghp_" + "A".repeat(36),
    levelTitle: "Another level",
    fileChanges: [],
    expectedSafe: false,
  },
  {
    name: "Reject API key pattern",
    submittedCode: "sk-proj-" + "A".repeat(24),
    levelTitle: "Another level",
    fileChanges: [],
    expectedSafe: false,
  },
  {
    name: "Reject extra files in Level 4",
    submittedCode: "Environment configuration",
    levelTitle: "Set up environment configuration",
    fileChanges: [
      {
        path: ".env.example",
        content: safeEnvExample,
      },
      {
        path: "src/index.ts",
        content: "export const a = 1;",
      },
    ],
    expectedSafe: false,
  },
];

let failures = 0;

for (const testCase of cases) {
  const result = validateSubmissionSafety({
    submittedCode: testCase.submittedCode,
    levelTitle: testCase.levelTitle,
    fileChanges: testCase.fileChanges,
  });

  const passed = result.safe === testCase.expectedSafe;

  if (!passed) {
    failures++;
  }

  console.log(
    `${passed ? "PASS" : "FAIL"} | ${testCase.name} | Expected safe: ${testCase.expectedSafe} | Actual safe: ${result.safe}`
  );
}

if (failures > 0) {
  console.error(`${failures} submission safety test(s) failed.`);
  process.exitCode = 1;
} else {
  console.log("All submission safety tests passed.");
}
