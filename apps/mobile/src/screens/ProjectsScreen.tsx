
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  FikraProject,
  getProjects,
} from "../services/api";

type ProjectsScreenProps = {
  token: string;
  onSessionExpired: () => void;
};

export default function ProjectsScreen({
  token,
  onSessionExpired,
}: ProjectsScreenProps) {
  const [projects, setProjects] = useState<FikraProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadProjects = useCallback(async () => {
    try {
      setError("");

      const data = await getProjects(token);
      setProjects(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load projects.";

      if (message.includes("session has expired")) {
        onSessionExpired();
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, onSessionExpired]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadProjects();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      <Text style={styles.title}>My Projects</Text>

      <Text style={styles.subtitle}>
        Continue building your software projects.
      </Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#4F46E5"
          />
          <Text style={styles.infoText}>
            Loading your projects...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.messageCard}>
          <Text style={styles.errorTitle}>
            Unable to load projects
          </Text>

          <Text style={styles.infoText}>
            {error}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => void loadProjects()}
          >
            <Text style={styles.retryText}>
              Try again
            </Text>
          </Pressable>
        </View>
      ) : projects.length === 0 ? (
        <View style={styles.messageCard}>
          <Text style={styles.emptyTitle}>
            No projects yet
          </Text>

          <Text style={styles.infoText}>
            Your software projects will appear here.
          </Text>
        </View>
      ) : (
        projects.map((project) => (
          <View
            key={project.id}
            style={styles.projectCard}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.projectTitle}>
                {project.title}
              </Text>

              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {project.status.replace(/_/g, " ")}
                </Text>
              </View>
            </View>

            <Text style={styles.description}>
              {project.description || "No description provided."}
            </Text>

            <Text style={styles.projectId}>
              Project ID: {project.id}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 6,
    marginBottom: 24,
  },
  center: {
    alignItems: "center",
    paddingVertical: 40,
  },
  infoText: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
    textAlign: "center",
  },
  messageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#B91C1C",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  retryButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginTop: 20,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  projectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  projectTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  statusBadge: {
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  statusText: {
    color: "#4338CA",
    fontSize: 10,
    fontWeight: "800",
  },
  description: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 21,
    marginTop: 12,
  },
  projectId: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 16,
  },
});
