
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

function normalizeFilePath(path: string): string {
  return path.replace(/\\/g, "/").toLowerCase();
}

// LEVEL 3: Configure TypeScript
function evaluateTypeScriptConfiguration(
  fileChanges: AttemptFileChange[]
): LevelEvaluationResult {
  const configFile = fileChanges.find(
    (file) => normalizeFilePath(file.path) === "tsconfig.json"
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

// LEVEL 4: Set up environment configuration
function evaluateEnvironmentConfiguration(
  fileChanges: AttemptFileChange[]
): LevelEvaluationResult {
  // This level should only submit a safe example configuration.
  if (
    fileChanges.length !== 1 ||
    normalizeFilePath(fileChanges[0].path) !== ".env.example"
  ) {
    return fail(
      "This level requires only a .env.example file change. Do not submit real .env files or credentials."
    );
  }

  const envFile = fileChanges[0];
  const variables = new Map<string, string>();

  for (const rawLine of envFile.content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = line.match(
      /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/
    );

    if (!match) {
      return fail(
        "Every non-comment line in .env.example must use KEY=value format."
      );
    }

    const key = match[1];
    const value = match[2].trim();

    
    const allowedVariables = new Set([
      "DATABASE_URL",
      "JWT_SECRET",
      "PORT",
    ]);

    if (!allowedVariables.has(key)) {
      return fail(
        `Unsupported environment variable: ${key}. Only DATABASE_URL, JWT_SECRET, and PORT are allowed.`
      );
    }


    if (variables.has(key)) {
      return fail(
        `Duplicate environment variable: ${key}.`
      );
    }

    variables.set(key, value);
  }

  const requiredVariables = [
    "DATABASE_URL",
    "JWT_SECRET",
    "PORT",
  ];

  for (const key of requiredVariables) {
    if (!variables.has(key)) {
      return fail(
        `.env.example is missing the required variable ${key}.`
      );
    }

    if (!variables.get(key)) {
      return fail(
        `${key} must contain a placeholder or example value.`
      );
    }
  }

  // Accept only a known, credential-free example database URL.
  // This is intentionally restrictive for our current test level.
  const databaseUrl = variables.get("DATABASE_URL");

  const allowedDatabaseExamples = new Set([
    "postgresql://localhost:5432/example_db",
    "postgres://localhost:5432/example_db",
    "<DATABASE_URL>",
  ]);

  if (
    !databaseUrl ||
    !allowedDatabaseExamples.has(databaseUrl)
  ) {
    return fail(
      "DATABASE_URL must use an approved example value without credentials."
    );
  }

  // Never accept an arbitrary JWT secret in this example file.
  const jwtSecret = variables.get("JWT_SECRET");

  const allowedSecretPlaceholders = new Set([
    "replace-with-a-secure-secret",
    "your-jwt-secret-here",
    "CHANGE_ME",
    "<JWT_SECRET>",
  ]);

  if (
    !jwtSecret ||
    !allowedSecretPlaceholders.has(jwtSecret)
  ) {
    return fail(
      "JWT_SECRET must use an approved placeholder, not a real secret."
    );
  }

  const port = variables.get("PORT");

  if (!port || !/^\d+$/.test(port)) {
    return fail(
      "PORT must be a numeric example value."
    );
  }

  const portNumber = Number(port);

  if (
    !Number.isInteger(portNumber) ||
    portNumber < 1 ||
    portNumber > 65535
  ) {
    return fail(
      "PORT must be between 1 and 65535."
    );
  }

  return pass(
    "Environment configuration passed the initial structural checks."
  );
}

// MAIN EVALUATOR
export function evaluateLevelAttemptMock(
  input: EvaluateLevelAttemptInput
): LevelEvaluationResult {
  const title = (input.levelTitle ?? "")
    .trim()
    .toLowerCase();

  if (title === "configure typescript") {
    return evaluateTypeScriptConfiguration(
      input.fileChanges ?? []
    );
  }

  if (title === "set up environment configuration") {
    return evaluateEnvironmentConfiguration(
      input.fileChanges ?? []
    );
  }

  // Temporary mock fallback for levels without a specific validator.
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
