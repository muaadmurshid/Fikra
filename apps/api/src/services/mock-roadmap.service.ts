type RoadmapLevel = {
  title: string;
  description: string;
  instructions: string;
  difficulty:
    | "BEGINNER"
    | "EASY"
    | "MEDIUM"
    | "HARD"
    | "ADVANCED";
  xpReward: number;
};

type RoadmapStage = {
  title: string;
  description: string;
  levels: RoadmapLevel[];
};

export type MockRoadmap = {
  title: string;
  description: string;
  stages: RoadmapStage[];
};

const stageDefinitions = [
  {
    title: "Project Foundation",
    description:
      "Set up the application structure and establish the core development foundation.",
    topics: [
      "Initialize the project",
      "Organize the source structure",
      "Configure TypeScript",
      "Set up environment configuration",
      "Create the mobile application shell",
      "Create the backend API shell",
      "Connect mobile and API development environments",
      "Add shared validation patterns",
      "Create application error handling",
      "Verify the complete development setup",
    ],
  },
  {
    title: "Authentication and User Experience",
    description:
      "Build the user identity and initial application experience.",
    topics: [
      "Design the user model",
      "Build user registration",
      "Secure stored passwords",
      "Build user login",
      "Create authentication tokens",
      "Protect backend routes",
      "Create the mobile login screen",
      "Create the mobile registration screen",
      "Persist the authenticated session",
      "Build the authenticated home screen",
    ],
  },
  {
    title: "Study Management Core",
    description:
      "Build StudyFlow's primary course and academic planning features.",
    topics: [
      "Design the course data model",
      "Create course API endpoints",
      "Build the course list screen",
      "Build course creation",
      "Design assignment data",
      "Create assignment API endpoints",
      "Build assignment management",
      "Design exam data",
      "Build exam management",
      "Connect courses, assignments, and exams",
    ],
  },
  {
    title: "Planning and Progress",
    description:
      "Add study planning, progress tracking, and next-action features.",
    topics: [
      "Design study sessions",
      "Create study session endpoints",
      "Build the study planner",
      "Track assignment completion",
      "Track study session completion",
      "Calculate course progress",
      "Build progress indicators",
      "Prioritize upcoming work",
      "Create the next-study recommendation view",
      "Build the progress dashboard",
    ],
  },
  {
    title: "Reminders and Offline Experience",
    description:
      "Add reminders and resilient mobile behavior based on the clarified requirements.",
    topics: [
      "Design reminder preferences",
      "Request notification permissions",
      "Schedule assignment reminders",
      "Schedule exam reminders",
      "Schedule study-session reminders",
      "Design offline storage",
      "Cache important study data",
      "Queue offline progress changes",
      "Synchronize reconnected data",
      "Handle synchronization conflicts",
    ],
  },
  {
    title: "Quality and Release",
    description:
      "Strengthen, test, and prepare the completed StudyFlow application.",
    topics: [
      "Validate API inputs",
      "Improve authorization checks",
      "Improve application error states",
      "Add loading and empty states",
      "Test authentication flows",
      "Test study management flows",
      "Test offline synchronization",
      "Improve application accessibility",
      "Prepare production configuration",
      "Complete the StudyFlow release build",
    ],
  },
];

export function generateMockRoadmap(
  projectTitle: string,
  selectedTechnologies: string[]
): MockRoadmap {
  const technologyText = selectedTechnologies.join(", ");

  return {
    title: `${projectTitle} Development Roadmap`,
    description:
      `A 60-level progressive development roadmap for ${projectTitle} using ${technologyText}.`,

    stages: stageDefinitions.map((stage, stageIndex) => ({
      title: stage.title,
      description: stage.description,

      levels: stage.topics.map((topic, levelIndex) => {
        const globalLevel =
          stageIndex * 10 + levelIndex + 1;

        let difficulty: RoadmapLevel["difficulty"];

        if (globalLevel <= 10) {
          difficulty = "BEGINNER";
        } else if (globalLevel <= 25) {
          difficulty = "EASY";
        } else if (globalLevel <= 40) {
          difficulty = "MEDIUM";
        } else if (globalLevel <= 52) {
          difficulty = "HARD";
        } else {
          difficulty = "ADVANCED";
        }

        return {
          title: topic,

          description:
            `Level ${globalLevel}: ${topic} for ${projectTitle}.`,

          instructions:
            `Implement "${topic}" as the next incremental part of ${projectTitle}. ` +
            `Use the selected project technologies where appropriate. ` +
            `Keep the application working before moving to the next level.`,

          difficulty,

          xpReward: 100 + (globalLevel - 1) * 10,
        };
      }),
    })),
  };
}