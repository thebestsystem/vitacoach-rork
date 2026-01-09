import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { 
  Users, 
  Search, 
  Shield, 
  TrendingUp, 
  Database,
  Ban,
  CheckCircle,
  XCircle,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, doc, updateDoc, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/config/firebase";

interface AdminUser {
  uid: string;
  email: string;
  role: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  createdAt: string;
}

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  freeUsers: number;
  premiumUsers: number;
}

export default function AdminScreen() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const usersQuery = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      console.log("[Admin] Fetching users");
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("createdAt", "desc"), limit(100));
      const snapshot = await getDocs(q);
      
      const users: AdminUser[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          uid: doc.id,
          email: data.email || "N/A",
          role: data.role || "user",
          subscriptionPlan: data.subscriptionPlan || "free",
          subscriptionStatus: data.subscriptionStatus || "inactive",
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      
      console.log("[Admin] Fetched users:", users.length);
      return users;
    },
    enabled: isAdmin,
    staleTime: 1000 * 60 * 5,
  });

  const statsQuery = useQuery({
    queryKey: ["adminStats", usersQuery.data],
    queryFn: async () => {
      const users = usersQuery.data || [];
      
      const stats: AdminStats = {
        totalUsers: users.length,
        activeSubscriptions: users.filter(u => u.subscriptionStatus === "active").length,
        freeUsers: users.filter(u => u.subscriptionPlan === "free").length,
        premiumUsers: users.filter(u => ["pro", "premium"].includes(u.subscriptionPlan)).length,
      };
      
      return stats;
    },
    enabled: isAdmin && !!usersQuery.data,
  });

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: "Admin",
            headerStyle: { backgroundColor: "#1a1a1a" },
            headerTintColor: "#fff",
          }}
        />
        <View style={styles.unauthorizedContainer}>
          <Ban size={64} color="#ef4444" />
          <Text style={styles.unauthorizedTitle}>Access Denied</Text>
          <Text style={styles.unauthorizedText}>
            You don&apos;t have permission to access the admin panel.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const filteredUsers = usersQuery.data?.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.uid.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: newRole });
      usersQuery.refetch();
      Alert.alert("Success", `User role updated to ${newRole}`);
    } catch (error) {
      console.error("[Admin] Error updating user role:", error);
      Alert.alert("Error", "Failed to update user role");
    }
  };

  const handleUpdateSubscription = async (userId: string, plan: string, status: string) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        subscriptionPlan: plan,
        subscriptionStatus: status,
      });
      usersQuery.refetch();
      Alert.alert("Success", "Subscription updated successfully");
    } catch (error) {
      console.error("[Admin] Error updating subscription:", error);
      Alert.alert("Error", "Failed to update subscription");
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Admin Dashboard",
          headerStyle: { backgroundColor: "#1a1a1a" },
          headerTintColor: "#fff",
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Shield size={32} color="#fbbf24" />
          <Text style={styles.headerTitle}>Admin Panel</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Users size={24} color="#60a5fa" />
            <Text style={styles.statValue}>{statsQuery.data?.totalUsers || 0}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          
          <View style={styles.statCard}>
            <TrendingUp size={24} color="#4ade80" />
            <Text style={styles.statValue}>{statsQuery.data?.activeSubscriptions || 0}</Text>
            <Text style={styles.statLabel}>Active Subs</Text>
          </View>
          
          <View style={styles.statCard}>
            <Database size={24} color="#a78bfa" />
            <Text style={styles.statValue}>{statsQuery.data?.premiumUsers || 0}</Text>
            <Text style={styles.statLabel}>Premium</Text>
          </View>
        </View>

        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>User Management</Text>
          <View style={styles.searchContainer}>
            <Search size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by email or ID..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {usersQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#60a5fa" />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : (
          <View style={styles.usersList}>
            {filteredUsers.map((user) => (
              <TouchableOpacity
                key={user.uid}
                style={styles.userCard}
                onPress={() => setSelectedUser(selectedUser?.uid === user.uid ? null : user)}
              >
                <View style={styles.userHeader}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <Text style={styles.userMeta}>
                      {user.subscriptionPlan} • {user.subscriptionStatus}
                    </Text>
                  </View>
                  <View style={[
                    styles.roleBadge,
                    { backgroundColor: user.role === "admin" ? "#fbbf24" : "#60a5fa" }
                  ]}>
                    <Text style={styles.roleBadgeText}>{user.role}</Text>
                  </View>
                </View>

                {selectedUser?.uid === user.uid && (
                  <View style={styles.userActions}>
                    <Text style={styles.actionsTitle}>Actions:</Text>
                    
                    <View style={styles.actionRow}>
                      <Text style={styles.actionLabel}>Role:</Text>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            user.role === "user" && styles.actionButtonActive
                          ]}
                          onPress={() => handleUpdateUserRole(user.uid, "user")}
                        >
                          <Text style={styles.actionButtonText}>User</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            user.role === "admin" && styles.actionButtonActive
                          ]}
                          onPress={() => handleUpdateUserRole(user.uid, "admin")}
                        >
                          <Text style={styles.actionButtonText}>Admin</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.actionRow}>
                      <Text style={styles.actionLabel}>Plan:</Text>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            user.subscriptionPlan === "free" && styles.actionButtonActive
                          ]}
                          onPress={() => handleUpdateSubscription(user.uid, "free", user.subscriptionStatus)}
                        >
                          <Text style={styles.actionButtonText}>Free</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            user.subscriptionPlan === "pro" && styles.actionButtonActive
                          ]}
                          onPress={() => handleUpdateSubscription(user.uid, "pro", "active")}
                        >
                          <Text style={styles.actionButtonText}>Pro</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            user.subscriptionPlan === "premium" && styles.actionButtonActive
                          ]}
                          onPress={() => handleUpdateSubscription(user.uid, "premium", "active")}
                        >
                          <Text style={styles.actionButtonText}>Premium</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.actionRow}>
                      <Text style={styles.actionLabel}>Status:</Text>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            user.subscriptionStatus === "active" && styles.actionButtonActive
                          ]}
                          onPress={() => handleUpdateSubscription(user.uid, user.subscriptionPlan, "active")}
                        >
                          <CheckCircle size={16} color="#fff" />
                          <Text style={styles.actionButtonText}>Active</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            user.subscriptionStatus === "canceled" && styles.actionButtonActive
                          ]}
                          onPress={() => handleUpdateSubscription(user.uid, user.subscriptionPlan, "canceled")}
                        >
                          <XCircle size={16} color="#fff" />
                          <Text style={styles.actionButtonText}>Canceled</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.userIdText}>User ID: {user.uid}</Text>
                    <Text style={styles.userDateText}>
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {filteredUsers.length === 0 && (
              <View style={styles.emptyContainer}>
                <Users size={48} color="#666" />
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            )}
          </View>
        )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#fff",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#fff",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  searchSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#fff",
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
    marginBottom: 4,
  },
  userMeta: {
    fontSize: 14,
    color: "#666",
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#fff",
    textTransform: "uppercase" as const,
  },
  userActions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
    gap: 12,
  },
  actionsTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#fff",
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionLabel: {
    fontSize: 14,
    color: "#a0a0a0",
    width: 60,
  },
  actionButtons: {
    flexDirection: "row",
    flex: 1,
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    flex: 1,
  },
  actionButtonActive: {
    backgroundColor: "#60a5fa",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#fff",
  },
  userIdText: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
  },
  userDateText: {
    fontSize: 12,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  unauthorizedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  unauthorizedTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#ef4444",
    marginTop: 20,
  },
  unauthorizedText: {
    fontSize: 16,
    color: "#a0a0a0",
    textAlign: "center",
    marginTop: 12,
  },
  backButton: {
    backgroundColor: "#60a5fa",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
  },
});
