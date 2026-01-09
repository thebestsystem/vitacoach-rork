import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import { useAccountability } from "@/contexts/AccountabilityContext";
import { Users, Plus, TrendingUp, Heart, MessageCircle, Send } from "lucide-react-native";
import type { Circle, ProgressUpdate } from "@/types/accountability";
import colors from "@/constants/colors";

export default function CirclesPage() {
  const accountability = useAccountability();
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [newCircleName, setNewCircleName] = useState<string>("");
  const [newCircleDescription, setNewCircleDescription] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [shareContent, setShareContent] = useState<string>("");
  const [isPrivate, setIsPrivate] = useState<boolean>(false);

  const handleCreateCircle = async () => {
    if (!newCircleName.trim()) return;

    try {
      await accountability.createCircle({
        name: newCircleName.trim(),
        description: newCircleDescription.trim() || undefined,
        isPrivate,
      });
      setNewCircleName("");
      setNewCircleDescription("");
      setIsPrivate(false);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create circle:", error);
    }
  };

  const handleInvite = async () => {
    if (!accountability.selectedCircle || !inviteEmail.trim()) return;

    try {
      await accountability.inviteToCircle(accountability.selectedCircle.id, inviteEmail.trim());
      setInviteEmail("");
      setShowInviteModal(false);
    } catch (error) {
      console.error("Failed to invite:", error);
    }
  };

  const handleShare = async () => {
    if (!accountability.selectedCircle || !shareContent.trim()) return;

    try {
      await accountability.shareProgress(
        accountability.selectedCircle.id,
        "milestone",
        shareContent.trim()
      );
      setShareContent("");
      setShowShareModal(false);
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  const handleReaction = async (updateId: string, emoji: string) => {
    try {
      await accountability.addReaction(updateId, emoji);
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  };

  const renderCircleCard = (circle: Circle) => {
    const isSelected = accountability.selectedCircleId === circle.id;

    return (
      <TouchableOpacity
        key={circle.id}
        style={[styles.circleCard, isSelected && styles.circleCardSelected]}
        onPress={() => accountability.selectCircle(isSelected ? null : circle.id)}
        testID={`circle-${circle.id}`}
      >
        <View style={styles.circleHeader}>
          <View style={styles.circleIcon}>
            <Users size={24} color={isSelected ? colors.primary : colors.text} />
          </View>
          <View style={styles.circleInfo}>
            <Text style={[styles.circleName, isSelected && styles.circleNameSelected]}>
              {circle.name}
            </Text>
            <Text style={styles.circleMembers}>{circle.members.length} members</Text>
          </View>
        </View>

        {circle.description && <Text style={styles.circleDescription}>{circle.description}</Text>}

        {isSelected && (
          <View style={styles.circleActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowInviteModal(true)}
              testID="invite-button"
            >
              <Plus size={16} color={colors.primary} />
              <Text style={styles.actionButtonText}>Invite</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowShareModal(true)}
              testID="share-button"
            >
              <TrendingUp size={16} color={colors.primary} />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderProgressUpdate = (update: ProgressUpdate) => {
    const timeAgo = getTimeAgo(update.timestamp);

    return (
      <View key={update.id} style={styles.updateCard} testID={`update-${update.id}`}>
        <View style={styles.updateHeader}>
          <View style={styles.updateUserAvatar}>
            <Text style={styles.updateUserAvatarText}>
              {update.userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.updateUserInfo}>
            <Text style={styles.updateUserName}>{update.userName}</Text>
            <Text style={styles.updateTime}>{timeAgo}</Text>
          </View>
          <View style={[styles.updateTypeBadge, getTypeBadgeStyle(update.type)]}>
            <Text style={styles.updateTypeBadgeText}>{update.type}</Text>
          </View>
        </View>

        <Text style={styles.updateContent}>{update.content}</Text>

        <View style={styles.updateFooter}>
          <View style={styles.reactions}>
            {["🔥", "💪", "👏", "❤️"].map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionButton}
                onPress={() => handleReaction(update.id, emoji)}
                testID={`reaction-${emoji}`}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                <Text style={styles.reactionCount}>
                  {update.reactions.filter((r) => r.emoji === emoji).length || ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.commentCount}>
            <MessageCircle size={16} color={colors.textSecondary} />
            <Text style={styles.commentCountText}>{update.comments.length}</Text>
          </View>
        </View>
      </View>
    );
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case "workout":
        return { backgroundColor: colors.primary + "20" };
      case "meal":
        return { backgroundColor: colors.success + "20" };
      case "checkIn":
        return { backgroundColor: colors.accent + "20" };
      case "milestone":
        return { backgroundColor: colors.warning + "20" };
      default:
        return { backgroundColor: colors.textSecondary + "20" };
    }
  };

  if (accountability.isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Accountability Circles", headerShown: true }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Accountability Circles", headerShown: true }} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Circles</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
              testID="create-circle-button"
            >
              <Plus size={20} color={colors.white} />
            </TouchableOpacity>
          </View>

          {accountability.circles.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>No circles yet</Text>
              <Text style={styles.emptyStateText}>
                Create your first accountability circle and invite friends to join your wellness
                journey
              </Text>
            </View>
          ) : (
            <View style={styles.circlesGrid}>
              {accountability.circles.map((circle) => renderCircleCard(circle))}
            </View>
          )}
        </View>

        {accountability.selectedCircle && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Updates</Text>
            {accountability.progressUpdates.length === 0 ? (
              <View style={styles.emptyState}>
                <Heart size={32} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>No updates yet. Be the first to share!</Text>
              </View>
            ) : (
              <View style={styles.updatesList}>
                {accountability.progressUpdates.map((update) => renderProgressUpdate(update))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Circle</Text>

            <TextInput
              style={styles.input}
              placeholder="Circle name"
              placeholderTextColor={colors.textSecondary}
              value={newCircleName}
              onChangeText={setNewCircleName}
              testID="circle-name-input"
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textSecondary}
              value={newCircleDescription}
              onChangeText={setNewCircleDescription}
              multiline
              numberOfLines={3}
              testID="circle-description-input"
            />

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsPrivate(!isPrivate)}
              testID="private-checkbox"
            >
              <View style={[styles.checkbox, isPrivate && styles.checkboxChecked]}>
                {isPrivate && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Private (invite only)</Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowCreateModal(false)}
                testID="cancel-create-button"
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleCreateCircle}
                testID="confirm-create-button"
              >
                <Text style={styles.modalButtonTextPrimary}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showInviteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invite Friend</Text>

            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={colors.textSecondary}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              testID="invite-email-input"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowInviteModal(false)}
                testID="cancel-invite-button"
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleInvite}
                testID="confirm-invite-button"
              >
                <Text style={styles.modalButtonTextPrimary}>Send Invite</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share Progress</Text>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What would you like to share?"
              placeholderTextColor={colors.textSecondary}
              value={shareContent}
              onChangeText={setShareContent}
              multiline
              numberOfLines={4}
              testID="share-content-input"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowShareModal(false)}
                testID="cancel-share-button"
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleShare}
                testID="confirm-share-button"
              >
                <Send size={16} color={colors.white} />
                <Text style={styles.modalButtonTextPrimary}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: colors.text,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: "center" as const,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center" as const,
    paddingHorizontal: 32,
  },
  circlesGrid: {
    gap: 12,
  },
  circleCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  circleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "08",
  },
  circleHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 8,
  },
  circleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginRight: 12,
  },
  circleInfo: {
    flex: 1,
  },
  circleName: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 2,
  },
  circleNameSelected: {
    color: colors.primary,
  },
  circleMembers: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  circleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  circleActions: {
    flexDirection: "row" as const,
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.primary,
  },
  updatesList: {
    gap: 12,
  },
  updateCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  updateHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  updateUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginRight: 12,
  },
  updateUserAvatarText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.white,
  },
  updateUserInfo: {
    flex: 1,
  },
  updateUserName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
  },
  updateTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  updateTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  updateTypeBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: colors.text,
    textTransform: "uppercase" as const,
  },
  updateContent: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  updateFooter: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  reactions: {
    flexDirection: "row" as const,
    gap: 8,
  },
  reactionButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "600" as const,
  },
  commentCount: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  commentCountText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 20,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top" as const,
  },
  checkboxRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxCheck: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  checkboxLabel: {
    fontSize: 16,
    color: colors.text,
  },
  modalActions: {
    flexDirection: "row" as const,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
  },
  modalButtonSecondary: {
    backgroundColor: colors.backgroundSecondary,
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.white,
  },
});
