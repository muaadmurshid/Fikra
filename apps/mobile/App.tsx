
import { useCallback, useEffect, useState } from "react";
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
import * as SecureStore from "expo-secure-store";

import LoginScreen from "./src/screens/LoginScreen";
import ProjectsScreen from "./src/screens/ProjectsScreen";
import {
  FikraUser,
  getCurrentUser,
  loginUser,
} from "./src/services/api";

type Tab = "Home" | "Projects" | "Roadmap" | "Profile";

const TABS: Tab[] = ["Home", "Projects", "Roadmap", "Profile"];
const TOKEN_KEY = "fikra_access_token";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("Home");
  const [authLoading, setAuthLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<FikraUser | null>(null);

  const [apiLoading, setApiLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [apiMessage, setApiMessage] = useState("");

  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      // Still clear the in-memory session.
    }

    setToken(null);
    setUser(null);
    setActiveTab("Home");
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const savedToken =
          await SecureStore.getItemAsync(TOKEN_KEY);

        if (!savedToken) {
          return;
        }

        const currentUser = await getCurrentUser(savedToken);

        if (!cancelled) {
          setToken(savedToken);
          setUser(currentUser);
        }
      } catch {
        try {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        } catch {
          // Ignore storage cleanup failures.
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const checkApi = async () => {
      if (!API_URL) {
        setApiMessage("API URL is not configured");
        setApiLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/health`);

        if (!response.ok) {
          throw new Error("API request failed");
        }

        const data = await response.json();

        if (!cancelled) {
          setConnected(data.success === true);
          setApiMessage(data.message);
        }
      } catch {
        if (!cancelled) {
          setConnected(false);
          setApiMessage("Unable to connect to Fikra API");
        }
      } finally {
        if (!cancelled) {
          setApiLoading(false);
        }
      }
    };

    void checkApi();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = async (
    email: string,
    password: string
  ) => {
    const result = await loginUser(email, password);

    if (!result.success || !result.accessToken) {
      throw new Error("Login failed. Please try again.");
    }

    await SecureStore.setItemAsync(
      TOKEN_KEY,
      result.accessToken
    );

    setToken(result.accessToken);
    setUser(result.user);
    setActiveTab("Home");
  };

  const handleSessionExpired = useCallback(() => {
    void logout();
  }, [logout]);

  if (authLoading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingScreen}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>
            Starting Fikra...
          </Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!token || !user) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" />
          <LoginScreen onLogin={handleLogin} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

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
            <Text style={styles.avatarText}>
              {(user.displayName || user.username || "F")
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>
        </View>

        {activeTab === "Projects" ? (
          <ProjectsScreen
            token={token}
            onSessionExpired={handleSessionExpired}
          />
        ) : activeTab === "Home" ? (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
          >
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>
                WELCOME BACK
              </Text>

              <Text style={styles.heroTitle}>
                Hello, {user.displayName || user.username}!
              </Text>

              <Text style={styles.heroDescription}>
                Turn your ideas into real software, one level
                at a time.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>
              Your progress
            </Text>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {user.xp} XP earned
              </Text>

              <Text style={styles.cardDescription}>
                Developer level {user.level}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>
              Platform status
            </Text>

            <View style={styles.card}>
              {apiLoading ? (
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
          </ScrollView>
        ) : activeTab === "Profile" ? (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
          >
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderTitle}>
                My Profile
              </Text>

              <Text style={styles.cardDescription}>
                {user.displayName || user.username}
              </Text>

              <Text style={styles.cardDescription}>
                {user.email}
              </Text>

              <Text style={styles.cardDescription}>
                Level {user.level} · {user.xp} XP
              </Text>

              <Pressable
                style={styles.logoutButton}
                onPress={() => void logout()}
              >
                <Text style={styles.logoutText}>
                  Log out
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
          >
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderTitle}>
                Roadmap
              </Text>

              <Text style={styles.cardDescription}>
                Your project roadmap will appear here in
                an upcoming step.
              </Text>
            </View>
          </ScrollView>
        )}

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
  loadingScreen: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 16,
    fontSize: 15,
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
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
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
    alignItems: "center",
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },
  logoutButton: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 24,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
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
