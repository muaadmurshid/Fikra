import { ProjectAnalysisOutput } from "../schemas/ai.schema";

export async function analyzeProjectIdeaMock(
  title: string,
  description: string
): Promise<ProjectAnalysisOutput> {
  return {
    summary:
      `${title} is a software project based on the following idea: ${description}`,

    problemStatement:
      "Users need a more organized way to manage important activities, priorities, and progress within the problem area described by the project.",

    targetUsers: [
      "Primary users described by the project idea",
      "Users who need better organization and progress tracking",
    ],

    coreFeatures: [
      "User-friendly project-specific dashboard",
      "Create and manage relevant items",
      "Track progress and completion",
      "Organize upcoming priorities",
      "View important information in one place",
    ],

    goals: [
      "Provide a simple and intuitive user experience",
      "Help users organize their activities",
      "Make progress easy to understand",
      "Reduce the chance of missing important tasks or deadlines",
    ],

    constraints: [
      "The application should work well on mobile devices",
      "User data should be stored securely",
      "The interface should remain simple for new users",
    ],

    assumptions: [
      "Users will create an account before using personalized features",
      "Users will manually provide the information required by the application",
      "Internet connectivity may be required for synchronized data",
    ],

    clarificationQuestions: [
      {
        question:
          "Should users be able to use the application across multiple devices?",
        reason:
          "This affects authentication, synchronization, and backend architecture.",
      },
      {
        question:
          "Should the application send reminders or notifications?",
        reason:
          "Notifications affect mobile permissions, scheduling, and backend requirements.",
      },
      {
        question:
          "Do users need to collaborate or share information with other users?",
        reason:
          "Collaboration would significantly affect the data model and authorization design.",
      },
      {
        question:
          "Should any features work without an internet connection?",
        reason:
          "Offline support affects local storage and synchronization architecture.",
      },
    ],

    suggestions: [
      {
        title: "Progress dashboard",
        description:
          "Provide a dashboard that highlights current progress and the most important next actions.",
        reason:
          "This gives users an immediate understanding of what requires attention.",
      },
      {
        title: "Prioritized upcoming items",
        description:
          "Organize upcoming items by urgency and importance rather than showing only a basic list.",
        reason:
          "Prioritization makes the product more useful for users managing multiple responsibilities.",
      },
      {
        title: "Simple onboarding",
        description:
          "Introduce the application's core workflow through a short first-use experience.",
        reason:
          "A focused onboarding flow can help new users understand the product quickly.",
      },
    ],
  };
}