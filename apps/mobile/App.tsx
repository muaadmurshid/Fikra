
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";

type HealthResponse = {
  success: boolean;
  message: string;
  timestamp: string;
};

type Tab = "Home" | "Projects" | "Roadmap" | "Profile";

const TABS: Tab[] = ["Home", "Projects", "Roadmap", "Profile"];

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("Home");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [apiMessage, setApiMessage] = useState("");

  useEffect(() => {
    const checkApi = async () => {
      if (!API_URL) {
        setApiMessage("API URL is not configured");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/health`);

        if (!response.ok) {
          throw new Error("API request failed");
        }

        const data: HealthResponse = await response.json();

        setConnected(data.success);
        setApiMessage(data.message);
      } catch (error) {
        console.error("API connection error:", error);
        setConnected(false);
        setApiMessage("Unable to connect to Fikra API");
      } finally {
        setLoading(false);
      }
    };

    checkApi();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={styles.container}
        edges={["top", "bottom"]}
      >
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>FIKRA</Text>
            <Text style={styles.headerSubtitle}>
              Build software. Level up.
            </Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>F</Text>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {activeTab === "Home" ? (
            <>
              <View style={styles.hero}>
                <Text style={styles.eyebrow}>
                  YOUR DEVELOPMENT JOURNEY
                </Text>

                <Text style={styles.heroTitle}>
                  Turn ideas into real software.
                </Text>

                <Text style={styles.heroDescription}>
                  Learn by building projects, completing coding
                  challenges, and unlocking new levels.
                </Text>
              </View>

              <Text style={styles.sectionTitle}>
                Platform status
              </Text>

              <View style={styles.card}>
                {loading ? (
                  <View style={styles.statusRow}>
                    <ActivityIndicator color="#6366F1" />

                    <Text style={styles.statusText}>
                      Connecting to Fikra API...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        connected
                          ? styles.connectedDot
                          : styles.disconnectedDot,
                      ]}
                    />

                    <View style={styles.statusDetails}>
                      <Text style={styles.cardTitle}>
                        {connected
                          ? "API connected"
                          : "API unavailable"}
                      </Text>

                      <Text style={styles.cardDescription}>
                        {apiMessage}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <Text style={styles.sectionTitle}>
                How Fikra works
              </Text>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  1. Start with an idea
                </Text>

                <Text style={styles.cardDescription}>
                  Describe the software you want to create.
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  2. Follow your roadmap
                </Text>

                <Text style={styles.cardDescription}>
                  Build your project through structured levels.
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  3. Earn XP and unlock progress
                </Text>

                <Text style={styles.cardDescription}>
                  Complete validated coding challenges to advance.
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderTitle}>
                {activeTab}
              </Text>

              <Text style={styles.placeholderDescription}>
                The {activeTab.toLowerCase()} screen will be
                connected to Fikra's features in an upcoming step.
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const selected = activeTab === tab;

            return (
              <Pressable
                key={tab}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tab,
                  selected && styles.activeTab,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    selected && styles.activeTabText,
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },

  header: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  brand: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 2,
  },

  headerSubtitle: {
    color: "#CBD5E1",
    fontSize: 12,
    marginTop: 4,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  content: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 36,
  },

  hero: {
    backgroundColor: "#312E81",
    borderRadius: 20,
    padding: 24,
    marginBottom: 26,
  },

  eyebrow: {
    color: "#C7D2FE",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    lineHeight: 34,
  },

  heroDescription: {
    color: "#E0E7FF",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 14,
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  cardDescription: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 14,
  },

  connectedDot: {
    backgroundColor: "#16A34A",
  },

  disconnectedDot: {
    backgroundColor: "#DC2626",
  },

  statusDetails: {
    flex: 1,
  },

  statusText: {
    color: "#475569",
    fontSize: 14,
    marginLeft: 12,
  },

  placeholderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    minHeight: 220,
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },

  placeholderDescription: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    color: "#64748B",
  },

  tabBar: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },

  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },

  activeTab: {
    backgroundColor: "#EEF2FF",
  },

  tabText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },

  activeTabText: {
    color: "#4338CA",
    fontWeight: "800",
  },
});
