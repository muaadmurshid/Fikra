
interface AttemptFileChange {
  path: string;
  content: string;
}

interface EvaluateLevelAttemptInput {
  submittedCode: string;
  levelTitle?: string;
  fileChanges?: AttemptFileChange[];
}

export interface LevelEvaluationResult {
  result: "PASSED" | "FAILED";
  score: number;
  feedback: string;
}

function fail(feedback: string): LevelEvaluationResult {
  return {
    result: "FAILED",
    score: 40,
    feedback,
  };
}

function pass(feedback: string): LevelEvaluationResult {
  return {
    result: "PASSED",
    score: 100,
    feedback,
  };
}

function evaluateTypeScriptConfiguration(
  fileChanges: AttemptFileChange[]
): LevelEvaluationResult {
  const configFile = fileChanges.find(
    (file) =>
      file.path.replace(/\\/g, "/").toLowerCase() ===
      "tsconfig.json"
  );

  if (!configFile) {
    return fail(
      "This level requires a tsconfig.json file change."
    );
  }

  let config: unknown;

  try {
    config = JSON.parse(configFile.content);
  } catch {
    return fail("tsconfig.json must contain valid JSON.");
  }

  if (
    typeof config !== "object" ||
    config === null ||
    Array.isArray(config)
  ) {
    return fail("tsconfig.json must contain a JSON object.");
  }

  const compilerOptions = (
    config as Record<string, unknown>
  ).compilerOptions;

  if (
    typeof compilerOptions !== "object" ||
    compilerOptions === null ||
    Array.isArray(compilerOptions)
  ) {
    return fail(
      "tsconfig.json must contain a compilerOptions object."
    );
  }

  const options = compilerOptions as Record<string, unknown>;

  if (options.strict !== true) {
    return fail(
      "compilerOptions.strict must be set to true."
    );
  }

  if (
    typeof options.target !== "string" ||
    options.target.trim().length === 0
  ) {
    return fail(
      "compilerOptions.target must be a non-empty string."
    );
  }

  if (
    typeof options.module !== "string" ||
    options.module.trim().length === 0
  ) {
    return fail(
      "compilerOptions.module must be a non-empty string."
    );
  }

  return pass(
    "TypeScript configuration passed the initial structural checks."
  );
}

export function evaluateLevelAttemptMock(
  input: EvaluateLevelAttemptInput
): LevelEvaluationResult {
  const title = (input.levelTitle ?? "").trim().toLowerCase();

  if (title === "configure typescript") {
    return evaluateTypeScriptConfiguration(
      input.fileChanges ?? []
    );
  }

  // Temporary fallback for levels without specific validators.
  const code = input.submittedCode.trim();

  if (
    code.length < 20 ||
    /\bTODO\b/i.test(code) ||
    /\bincomplete\b/i.test(code)
  ) {
    return fail(
      "The submission appears incomplete. Add a more complete implementation."
    );
  }

  return pass(
    "The mock evaluator accepted this submission. No level-specific validation is available yet."
  );
}
