import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Share,
} from "react-native";
import { Stack } from "expo-router";
import { Download, Trash2, Shield, FileText, AlertCircle } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { exportUserData, generateExportFileName, downloadJsonFile } from "@/utils/dataExport";
import { deleteUser } from "firebase/auth";
import { doc, writeBatch } from "firebase/firestore";
import { db, auth } from "@/config/firebase";

export default function PrivacyScreen() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleExportData = async () => {
    if (!user?.uid) {
      Alert.alert("Error", "You must be logged in to export data");
      return;
    }

    try {
      setIsExporting(true);
      console.log("[Privacy] Starting data export");

      const exportData = await exportUserData(user.uid);
      const filename = generateExportFileName(user.email);

      if (Platform.OS === "web") {
        downloadJsonFile(exportData, filename);
        Alert.alert(
          "Export Complete",
          "Your data has been downloaded successfully.",
          [{ text: "OK" }]
        );
      } else {
        const jsonString = JSON.stringify(exportData, null, 2);
        await Share.share({
          message: jsonString,
          title: "Export Your Data",
        });
      }

      console.log("[Privacy] Data export completed");
    } catch (error) {
      console.error("[Privacy] Export error:", error);
      Alert.alert(
        "Export Failed",
        error instanceof Error ? error.message : "Failed to export data. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.uid) {
      Alert.alert("Error", "You must be logged in to delete your account");
      return;
    }

    Alert.alert(
      "Delete Account",
      "This action is permanent and cannot be undone. All your data will be deleted.\n\nAre you sure you want to continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            Alert.alert(
              "Final Confirmation",
              "Type your email to confirm deletion. This is your last chance.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Confirm Delete",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      setIsDeleting(true);
                      console.log("[Privacy] Starting account deletion");

                      const batch = writeBatch(db);

                      const userDoc = doc(db, "users", user.uid);
                      batch.delete(userDoc);

                      const healthDoc = doc(db, "health", user.uid);
                      batch.delete(healthDoc);

                      const gamificationDoc = doc(db, "gamification", user.uid);
                      batch.delete(gamificationDoc);

                      const notificationDoc = doc(db, "notifications", user.uid);
                      batch.delete(notificationDoc);

                      await batch.commit();
                      console.log("[Privacy] Firestore data deleted");

                      const currentUser = auth.currentUser;
                      if (currentUser) {
                        await deleteUser(currentUser);
                        console.log("[Privacy] User auth account deleted");
                      }

                      Alert.alert(
                        "Account Deleted",
                        "Your account and all associated data have been permanently deleted.",
                        [{ text: "OK" }]
                      );
                    } catch (error: any) {
                      console.error("[Privacy] Delete error:", error);
                      
                      if (error.code === "auth/requires-recent-login") {
                        Alert.alert(
                          "Reauthentication Required",
                          "For security reasons, you need to log in again before deleting your account.",
                          [{ text: "OK" }]
                        );
                      } else {
                        Alert.alert(
                          "Deletion Failed",
                          error.message || "Failed to delete account. Please contact support.",
                          [{ text: "OK" }]
                        );
                      }
                    } finally {
                      setIsDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Privacy & Data",
          headerStyle: { backgroundColor: "#1a1a1a" },
          headerTintColor: "#fff",
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={24} color="#4ade80" />
            <Text style={styles.sectionTitle}>Your Privacy Rights</Text>
          </View>
          <Text style={styles.sectionDescription}>
            We respect your privacy and comply with GDPR, CCPA, and other data protection
            regulations. You have full control over your data.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Download size={24} color="#60a5fa" />
            <Text style={styles.sectionTitle}>Export Your Data</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Download a complete copy of all your data in JSON format. This includes your profile,
            health metrics, workout history, and all other personal information.
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.exportButton]}
            onPress={handleExportData}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Download size={20} color="#fff" />
                <Text style={styles.buttonText}>Export My Data</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.helpText}>
            Your data will be exported as a JSON file that you can save or share.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={24} color="#a78bfa" />
            <Text style={styles.sectionTitle}>Data We Collect</Text>
          </View>
          <Text style={styles.sectionDescription}>We collect and store:</Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Account information (email, password hash)</Text>
            <Text style={styles.listItem}>• Health and fitness data you provide</Text>
            <Text style={styles.listItem}>• Workout and meal logs</Text>
            <Text style={styles.listItem}>• Wellness check-ins and reflections</Text>
            <Text style={styles.listItem}>• App usage analytics</Text>
            <Text style={styles.listItem}>• Device information</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertCircle size={24} color="#fbbf24" />
            <Text style={styles.sectionTitle}>How We Use Your Data</Text>
          </View>
          <Text style={styles.sectionDescription}>Your data is used to:</Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Provide personalized health insights</Text>
            <Text style={styles.listItem}>• Generate workout and meal plans</Text>
            <Text style={styles.listItem}>• Track your progress over time</Text>
            <Text style={styles.listItem}>• Send you reminders and notifications</Text>
            <Text style={styles.listItem}>• Improve our services</Text>
          </View>
          <Text style={styles.sectionDescription}>
            We never sell your data to third parties.
          </Text>
        </View>

        <View style={[styles.section, styles.dangerSection]}>
          <View style={styles.sectionHeader}>
            <Trash2 size={24} color="#ef4444" />
            <Text style={[styles.sectionTitle, styles.dangerTitle]}>Delete Account</Text>
          </View>
          <Text style={styles.dangerDescription}>
            Permanently delete your account and all associated data. This action cannot be undone.
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Trash2 size={20} color="#fff" />
                <Text style={styles.buttonText}>Delete My Account</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            For questions about your privacy rights, please contact support.
          </Text>
          <Text style={styles.footerText}>Last updated: {new Date().toLocaleDateString()}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#fff",
  },
  sectionDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: "#a0a0a0",
    marginBottom: 16,
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20,
    color: "#a0a0a0",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  exportButton: {
    backgroundColor: "#60a5fa",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
  },
  helpText: {
    fontSize: 13,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  dangerSection: {
    borderColor: "#ef444440",
    backgroundColor: "#1a0a0a",
  },
  dangerTitle: {
    color: "#ef4444",
  },
  dangerDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: "#ef4444",
    marginBottom: 16,
  },
  footer: {
    marginTop: 20,
    alignItems: "center",
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
});
