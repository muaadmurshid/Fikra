
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type LoginScreenProps = {
  onLogin: (email: string, password: string) => Promise<void>;
};

export default function LoginScreen({
  onLogin,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (loading) {
      return;
    }

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await onLogin(email.trim(), password);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>FIKRA</Text>

        <Text style={styles.title}>Welcome back</Text>

        <Text style={styles.subtitle}>
          Sign in to continue building your projects.
        </Text>

        <Text style={styles.label}>Email</Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          editable={!loading}
        />

        <Text style={styles.label}>Password</Text>

        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          editable={!loading}
          onSubmitEditing={handleLogin}
        />

        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <Pressable
          style={[
            styles.loginButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleLogin}
          disabled={loading}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>
              Sign in
            </Text>
          )}
        </Pressable>

        <Text style={styles.footer}>
          Build real software. Earn XP. Level up.
        </Text>
      </View>
    </KeyboardAvoidingView>
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
    padding: 24,
  },
  logo: {
    fontSize: 30,
    fontWeight: "800",
    color: "#4338CA",
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 26,
    lineHeight: 21,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: "#0F172A",
    marginBottom: 18,
  },
  error: {
    color: "#B91C1C",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    minHeight: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  disabledButton: {
    opacity: 0.65,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
    marginTop: 24,
  },
});
