interface EvaluateLevelAttemptInput {
  submittedCode: string;
}

export interface LevelEvaluationResult {
  result: "PASSED" | "FAILED";
  score: number;
  feedback: string;
}

export function evaluateLevelAttemptMock(
  input: EvaluateLevelAttemptInput
): LevelEvaluationResult {
  const code = input.submittedCode.trim();

  const looksIncomplete =
    code.length < 20 ||
    /\bTODO\b/i.test(code) ||
    /\bincomplete\b/i.test(code);

  if (looksIncomplete) {
    return {
      result: "FAILED",
      score: 40,
      feedback:
        "The mock evaluator considers this submission incomplete. Add a more complete implementation and try again.",
    };
  }

  return {
    result: "PASSED",
    score: 100,
    feedback:
      "The mock evaluator accepted this submission.",
  };
}