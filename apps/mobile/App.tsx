import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type HealthResponse = {
  success: boolean;
  message: string;
  timestamp: string;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_URL is not configured. Check apps/mobile/.env"
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [apiMessage, setApiMessage] = useState("");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await fetch(`${API_URL}/api/health`);

        if (!response.ok) {
          throw new Error("API request failed");
        }

        const data: HealthResponse = await response.json();

        setApiMessage(data.message);
        setConnected(data.success);
      } catch (error) {
        console.error("API connection error:", error);

        setApiMessage("Unable to connect to Fikra API");
        setConnected(false);
      } finally {
        setLoading(false);
      }
    };

    checkApi();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>FIKRA</Text>

        <Text style={styles.title}>
          Gamified Software Development
        </Text>

        <Text style={styles.subtitle}>
          Build real software by completing coding levels.
        </Text>

        {loading ? (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" />

            <Text style={styles.statusText}>
              Connecting to Fikra API...
            </Text>
          </View>
        ) : (
          <View style={styles.statusContainer}>
            <Text style={styles.statusIcon}>
              {connected ? "✓" : "✕"}
            </Text>

            <Text style={styles.statusText}>
              {apiMessage}
            </Text>
          </View>
        )}

        <Text style={styles.foundation}>
          Mobile + API Foundation
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    padding: 24,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
  },

  logo: {
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },

  statusContainer: {
    alignItems: "center",
    marginTop: 30,
    padding: 20,
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
  },

  statusIcon: {
    fontSize: 38,
    fontWeight: "700",
  },

  statusText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },

  foundation: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 13,
  },
});