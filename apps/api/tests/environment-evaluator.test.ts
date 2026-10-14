
import { evaluateLevelAttemptMock } from "../src/services/mock-level-evaluator.service";

const validExample = [
  "DATABASE_URL=postgresql://localhost:5432/example_db",
  "JWT_SECRET=replace-with-a-secure-secret",
  "PORT=3000",
].join("\n");

interface TestCase {
  name: string;
  content: string;
  expected: "PASSED" | "FAILED";
  path?: string;
}

const cases: TestCase[] = [
  {
    name: "Valid environment example",
    content: validExample,
    expected: "PASSED",
  },
  {
    name: "Missing DATABASE_URL",
    content: [
      "JWT_SECRET=replace-with-a-secure-secret",
      "PORT=3000",
    ].join("\n"),
    expected: "FAILED",
  },
  {
    name: "Missing JWT_SECRET",
    content: [
      "DATABASE_URL=postgresql://localhost:5432/example_db",
      "PORT=3000",
    ].join("\n"),
    expected: "FAILED",
  },
  {
    name: "Duplicate variable",
    content: validExample + "\nPORT=4000",
    expected: "FAILED",
  },
  {
    name: "Invalid port",
    content: validExample.replace("PORT=3000", "PORT=abc"),
    expected: "FAILED",
  },
  {
    name: "Port out of range",
    content: validExample.replace("PORT=3000", "PORT=70000"),
    expected: "FAILED",
  },
  {
    name: "Database URL with credentials",
    content: validExample.replace(
      "postgresql://localhost:5432/example_db",
      "postgresql://user:password@localhost:5432/example_db"
    ),
    expected: "FAILED",
  },
  {
    name: "Unapproved JWT secret",
    content: validExample.replace(
      "replace-with-a-secure-secret",
      "not-an-approved-placeholder"
    ),
    expected: "FAILED",
  },
  {
    name: "Real .env file path",
    path: ".env",
    content: validExample,
    expected: "FAILED",
  },
  {
    name: "Malformed environment line",
    content: validExample + "\nINVALID LINE",
    expected: "FAILED",
  },
  
  {
    name: "Unexpected environment variable",
    content: validExample + "\nOPENAI_API_KEY=example-placeholder",
    expected: "FAILED",
  },
];

let failures = 0;

for (const testCase of cases) {
  const result = evaluateLevelAttemptMock({
    submittedCode: "Environment configuration test submission",
    levelTitle: "Set up environment configuration",
    fileChanges: [
      {
        path: testCase.path ?? ".env.example",
        content: testCase.content,
      },
    ],
  });

  const passed = result.result === testCase.expected;

  if (!passed) {
    failures++;
  }

  console.log(
    `${passed ? "PASS" : "FAIL"} | ${testCase.name} | Expected: ${testCase.expected} | Actual: ${result.result}`
  );
}

if (failures > 0) {
  console.error(`${failures} environment test(s) failed.`);
  process.exitCode = 1;
} else {
  console.log("All environment evaluator tests passed.");
}
