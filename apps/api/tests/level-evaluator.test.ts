
import { evaluateLevelAttemptMock } from "../src/services/mock-level-evaluator.service";


const cases = [
  {
    name: "Valid TypeScript configuration",
    content: JSON.stringify({
      compilerOptions: {
        strict: true,
        target: "ES2022",
        module: "NodeNext",
      },
    }),
    expected: "PASSED",
  },
  {
    name: "Invalid JSON",
    content: '{"compilerOptions":',
    expected: "FAILED",
  },
  {
    name: "Missing compilerOptions",
    content: '{"name":"test"}',
    expected: "FAILED",
  },
  {
    name: "Strict mode disabled",
    content: JSON.stringify({
      compilerOptions: {
        strict: false,
        target: "ES2022",
        module: "NodeNext",
      },
    }),
    expected: "FAILED",
  },
  {
    name: "Missing target",
    content: JSON.stringify({
      compilerOptions: {
        strict: true,
        module: "NodeNext",
      },
    }),
    expected: "FAILED",
  },
];

let failures = 0;

for (const testCase of cases) {
  const result = evaluateLevelAttemptMock({
    submittedCode: "Testing TypeScript configuration",
    levelTitle: "Configure TypeScript",
    fileChanges: [
      {
        path: "tsconfig.json",
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

  console.log(`  Feedback: ${result.feedback}`);
}

if (failures > 0) {
  console.error(`${failures} evaluator test(s) failed.`);
  process.exitCode = 1;
} else {
  console.log("All evaluator tests passed.");
}
