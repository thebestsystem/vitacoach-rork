import { useRouter } from "expo-router";
import { LogIn } from "lucide-react-native";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
      router.replace("/");
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Login Failed",
        error instanceof Error ? error.message : "An error occurred during login"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push("/auth/signup" as any);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <LogIn size={64} color={colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your wellness journey</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              testID="email-input"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              testID="password-input"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            testID="login-button"
          >
            <Text style={styles.buttonText}>
              {loading ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSignUp}
            testID="signup-nav-button"
          >
            <Text style={styles.secondaryButtonText}>Create New Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center" as const,
    marginTop: 40,
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center" as const,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  divider: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: colors.textTertiary,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
