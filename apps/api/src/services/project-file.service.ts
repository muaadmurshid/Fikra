import path from "path";

type ProjectFileTransaction = any;

export interface SaveProjectFileInput {
  projectId: string;
  userId: string;
  levelId?: string;
  path: string;
  content: string;
  language?: string;
  changeSummary?: string;
  generatedByAi?: boolean;
}

export function normalizeProjectPath(value: string) {
  return value
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/");
}

export function isValidProjectPath(value: string) {
  return Boolean(
    value &&
      value !== "." &&
      value !== ".." &&
      !value.startsWith("../") &&
      !value.includes("/../")
  );
}

export async function saveProjectFileVersion(
  tx: ProjectFileTransaction,
  input: SaveProjectFileInput
) {
  const normalizedPath = normalizeProjectPath(input.path);

  if (!isValidProjectPath(normalizedPath)) {
    throw new Error("INVALID_PROJECT_FILE_PATH");
  }

  const fileName = path.posix.basename(normalizedPath);

  const existingFile = await tx.projectFile.findUnique({
    where: {
      projectId_path: {
        projectId: input.projectId,
        path: normalizedPath,
      },
    },
    include: {
      versions: {
        orderBy: {
          versionNumber: "desc",
        },
        take: 1,
      },
    },
  });

  if (!existingFile) {
    const file = await tx.projectFile.create({
      data: {
        projectId: input.projectId,
        path: normalizedPath,
        fileName,
        language: input.language,
        isDeleted: false,
      },
    });

    const version = await tx.projectFileVersion.create({
      data: {
        fileId: file.id,
        userId: input.userId,
        levelId: input.levelId,
        versionNumber: 1,
        content: input.content,
        changeType: "CREATED",
        changeSummary:
          input.changeSummary ?? "Created project file.",
        generatedByAi: input.generatedByAi ?? false,
      },
    });

    return {
      file,
      version,
    };
  }

  const latestVersion = existingFile.versions[0];

  const nextVersionNumber =
    (latestVersion?.versionNumber ?? 0) + 1;

  const file = await tx.projectFile.update({
    where: {
      id: existingFile.id,
    },
    data: {
      fileName,
      language: input.language ?? existingFile.language,
      isDeleted: false,
    },
  });

  const version = await tx.projectFileVersion.create({
    data: {
      fileId: existingFile.id,
      userId: input.userId,
      levelId: input.levelId,
      versionNumber: nextVersionNumber,
      content: input.content,
      changeType: existingFile.isDeleted
        ? "RESTORED"
        : "UPDATED",
      changeSummary:
        input.changeSummary ??
        (existingFile.isDeleted
          ? "Restored project file."
          : "Updated project file."),
      generatedByAi: input.generatedByAi ?? false,
    },
  });

  return {
    file,
    version,
  };
}