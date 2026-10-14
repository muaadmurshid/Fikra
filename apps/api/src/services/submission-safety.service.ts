
interface SubmissionFileChange {
  path: string;
  content: string;
}

interface SubmissionSafetyInput {
  submittedCode: string;
  levelTitle?: string;
  fileChanges: SubmissionFileChange[];
}

export interface SubmissionSafetyResult {
  safe: boolean;
  message?: string;
}

function reject(message: string): SubmissionSafetyResult {
  return {
    safe: false,
    message,
  };
}

export function validateSubmissionSafety(
  input: SubmissionSafetyInput
): SubmissionSafetyResult {
  const title = (input.levelTitle ?? "").trim().toLowerCase();

  const normalizedPaths = new Set<string>();

  for (const file of input.fileChanges) {
    const path = file.path.replace(/\\/g, "/").toLowerCase();

    if (
      path.startsWith("/") ||
      /^[a-z]:\//i.test(path) ||
      path.split("/").some((part) => part === "..")
    ) {
      return reject("Absolute paths and path traversal are not allowed.");
    }

    if (normalizedPaths.has(path)) {
      return reject("Duplicate file paths are not allowed.");
    }

    normalizedPaths.add(path);

    const filename = path.split("/").pop() ?? "";

    if (
      filename === ".env" ||
      (filename.startsWith(".env.") &&
        filename !== ".env.example")
    ) {
      return reject(
        "Real environment configuration files cannot be submitted."
      );
    }
  }

  if (title === "set up environment configuration") {
    if (
      input.fileChanges.length !== 1 ||
      input.fileChanges[0].path.replace(/\\/g, "/").toLowerCase() !==
        ".env.example"
    ) {
      return reject(
        "Level 4 requires only a .env.example file."
      );
    }

    // The level-specific evaluator will validate its contents.
  }

  // Reject some common private-key and token formats.
  // This is a limited safeguard, not comprehensive secret detection.
  const contents = [
    input.submittedCode,
    ...input.fileChanges.map((file) => file.content),
  ];

  for (const content of contents) {
    if (
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i.test(content)
    ) {
      return reject("Private keys cannot be submitted.");
    }

    if (/ghp_[A-Za-z0-9]{36}/.test(content)) {
      return reject("A GitHub token pattern was detected.");
    }

    if (/sk-proj-[A-Za-z0-9_-]{20,}/.test(content)) {
      return reject("An API key pattern was detected.");
    }
  }

  return { safe: true };
}
