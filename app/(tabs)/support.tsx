import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  HelpCircle,
  MessageCircle,
  Mail,
  Book,
  ChevronDown,
  ChevronUp,
  Send,
  ExternalLink,
} from "lucide-react-native";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/ui/Toast";

type TabType = "faq" | "contact" | "guides";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface GuideItem {
  id: string;
  title: string;
  description: string;
  content: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: "1",
    question: "How do I track my workouts?",
    answer:
      "Navigate to the Home tab and tap 'Log Exercise'. Select the exercise type, duration, and intensity. Your workout will be automatically saved and synced to your dashboard.",
    category: "Workouts",
  },
  {
    id: "2",
    question: "How do meal plans work?",
    answer:
      "Our AI coach generates personalized meal plans based on your goals, dietary preferences, and restrictions. Go to Plans tab to view your daily meal suggestions.",
    category: "Nutrition",
  },
  {
    id: "3",
    question: "What are achievements and how do I unlock them?",
    answer:
      "Achievements are milestones you unlock by completing wellness activities. Check your progress in the Progress tab. Each achievement awards points and badges.",
    category: "Gamification",
  },
  {
    id: "4",
    question: "How does the AI coach work?",
    answer:
      "The AI coach analyzes your health data, goals, and progress to provide personalized recommendations. Chat with your coach anytime in the Coach tab.",
    category: "Coach",
  },
  {
    id: "5",
    question: "Can I change my subscription plan?",
    answer:
      "Yes! Go to Profile > Subscription to view available plans and upgrade or downgrade. Changes take effect immediately and pricing is prorated.",
    category: "Subscription",
  },
  {
    id: "6",
    question: "Is my health data private and secure?",
    answer:
      "Absolutely. Your data is encrypted end-to-end and stored securely. We never share your personal health information with third parties. You can delete your data anytime.",
    category: "Privacy",
  },
  {
    id: "7",
    question: "How do I sync data across devices?",
    answer:
      "Your data automatically syncs when you're logged in with your account. Make sure you have a stable internet connection for real-time syncing.",
    category: "Technical",
  },
  {
    id: "8",
    question: "What should I do if I miss a workout?",
    answer:
      "Don't worry! Life happens. The app adjusts your plan automatically. You can reschedule workouts in the Plans tab or ask your AI coach for alternative options.",
    category: "Workouts",
  },
];

const GUIDES_DATA: GuideItem[] = [
  {
    id: "1",
    title: "Getting Started Guide",
    description: "Complete overview of the app features and how to use them",
    content:
      "Welcome to your wellness journey! This guide will help you understand all features:\n\n1. Dashboard: Your wellness metrics at a glance\n2. Coach: Chat with AI for personalized guidance\n3. Plans: View workout and meal schedules\n4. Progress: Track your achievements and stats\n5. Profile: Manage settings and preferences",
  },
  {
    id: "2",
    title: "Setting Up Your Profile",
    description: "Customize your profile for personalized recommendations",
    content:
      "To get the best experience:\n\n1. Complete onboarding with accurate information\n2. Set realistic goals (lose weight, build muscle, etc.)\n3. Add dietary preferences and restrictions\n4. Connect health tracking devices if available\n5. Update your fitness level honestly",
  },
  {
    id: "3",
    title: "Maximizing Your Workouts",
    description: "Tips for effective workout tracking and planning",
    content:
      "Get the most from your workouts:\n\n1. Log exercises immediately after completing them\n2. Rate intensity honestly for better AI recommendations\n3. Track recovery time between sessions\n4. Follow AI-generated warm-up and cool-down routines\n5. Listen to your body and adjust as needed",
  },
  {
    id: "4",
    title: "Understanding Your Dashboard",
    description: "Navigate your wellness metrics like a pro",
    content:
      "Your dashboard shows:\n\n• Energy Forecast: Predicted energy levels throughout the day\n• Recovery Score: How well you're recovering from activities\n• Wellness Streaks: Consecutive days of healthy habits\n• Mood Trends: Emotional wellness patterns\n• Health Insights: AI-powered recommendations",
  },
];

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>("faq");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<GuideItem | null>(null);
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmitContact = async () => {
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      showError("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("[Support] Contact form submitted:", {
        userId: user?.uid,
        email: user?.email,
        subject: contactForm.subject,
        message: contactForm.message,
        timestamp: new Date().toISOString(),
      });

      showSuccess("Message sent! We'll respond within 24 hours.");
      setContactForm({ subject: "", message: "" });
    } catch (error) {
      console.error("[Support] Error submitting contact form:", error);
      showError("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFAQTab = () => {
    const categories = Array.from(new Set(FAQ_DATA.map((faq) => faq.category)));

    return (
      <View style={styles.tabContent}>
        {categories.map((category) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {FAQ_DATA.filter((faq) => faq.category === category).map((faq) => (
              <TouchableOpacity
                key={faq.id}
                style={styles.faqItem}
                onPress={() =>
                  setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)
                }
                activeOpacity={0.7}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  {expandedFAQ === faq.id ? (
                    <ChevronUp size={20} color={colors.primary} strokeWidth={2} />
                  ) : (
                    <ChevronDown size={20} color={colors.textTertiary} strokeWidth={2} />
                  )}
                </View>
                {expandedFAQ === faq.id && (
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <TouchableOpacity
          style={styles.needMoreHelpCard}
          onPress={() => setActiveTab("contact")}
        >
          <MessageCircle size={24} color={colors.primary} strokeWidth={2} />
          <View style={styles.needMoreHelpText}>
            <Text style={styles.needMoreHelpTitle}>Still need help?</Text>
            <Text style={styles.needMoreHelpSubtitle}>Contact our support team</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderContactTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.contactHeader}>
          <Mail size={32} color={colors.primary} strokeWidth={2} />
          <Text style={styles.contactTitle}>Contact Support</Text>
          <Text style={styles.contactSubtitle}>
            We typically respond within 24 hours
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Your Email</Text>
          <View style={styles.inputDisabled}>
            <Text style={styles.inputDisabledText}>{user?.email || "Not logged in"}</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            value={contactForm.subject}
            onChangeText={(text) =>
              setContactForm({ ...contactForm, subject: text })
            }
            placeholder="What do you need help with?"
            placeholderTextColor={colors.textTertiary}
            editable={!isSubmitting}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={contactForm.message}
            onChangeText={(text) =>
              setContactForm({ ...contactForm, message: text })
            }
            placeholder="Describe your issue or question in detail..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!isSubmitting}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmitContact}
          disabled={isSubmitting}
          activeOpacity={0.7}
        >
          {isSubmitting ? (
            <Text style={styles.submitButtonText}>Sending...</Text>
          ) : (
            <>
              <Send size={20} color={colors.surface} strokeWidth={2} />
              <Text style={styles.submitButtonText}>Send Message</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.alternativeContact}>
          <Text style={styles.alternativeTitle}>Other ways to reach us:</Text>
          <TouchableOpacity
            style={styles.alternativeItem}
            onPress={() => Linking.openURL("mailto:support@wellnessapp.com")}
          >
            <Mail size={18} color={colors.primary} strokeWidth={2} />
            <Text style={styles.alternativeText}>support@wellnessapp.com</Text>
            <ExternalLink size={16} color={colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderGuidesTab = () => {
    if (selectedGuide) {
      return (
        <View style={styles.tabContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedGuide(null)}
          >
            <Text style={styles.backButtonText}>← Back to Guides</Text>
          </TouchableOpacity>

          <View style={styles.guideDetail}>
            <Text style={styles.guideDetailTitle}>{selectedGuide.title}</Text>
            <Text style={styles.guideDetailContent}>{selectedGuide.content}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <View style={styles.guidesHeader}>
          <Book size={32} color={colors.primary} strokeWidth={2} />
          <Text style={styles.guidesTitle}>Help Guides</Text>
          <Text style={styles.guidesSubtitle}>
            Learn how to make the most of your wellness journey
          </Text>
        </View>

        {GUIDES_DATA.map((guide) => (
          <TouchableOpacity
            key={guide.id}
            style={styles.guideCard}
            onPress={() => setSelectedGuide(guide)}
            activeOpacity={0.7}
          >
            <View style={styles.guideIconContainer}>
              <Book size={24} color={colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.guideContent}>
              <Text style={styles.guideTitle}>{guide.title}</Text>
              <Text style={styles.guideDescription}>{guide.description}</Text>
            </View>
            <ChevronDown
              size={20}
              color={colors.textTertiary}
              strokeWidth={2}
              style={{ transform: [{ rotate: "-90deg" }] }}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "faq":
        return renderFAQTab();
      case "contact":
        return renderContactTab();
      case "guides":
        return renderGuidesTab();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <HelpCircle size={24} color={colors.primary} strokeWidth={2} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Support & Help</Text>
            <Text style={styles.headerSubtitle}>We&apos;re here to help</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "faq" && styles.tabActive]}
          onPress={() => setActiveTab("faq")}
          activeOpacity={0.7}
        >
          <HelpCircle
            size={20}
            color={activeTab === "faq" ? colors.primary : colors.textTertiary}
            strokeWidth={2}
          />
          <Text
            style={[styles.tabText, activeTab === "faq" && styles.tabTextActive]}
          >
            FAQ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "contact" && styles.tabActive]}
          onPress={() => setActiveTab("contact")}
          activeOpacity={0.7}
        >
          <Mail
            size={20}
            color={activeTab === "contact" ? colors.primary : colors.textTertiary}
            strokeWidth={2}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "contact" && styles.tabTextActive,
            ]}
          >
            Contact
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "guides" && styles.tabActive]}
          onPress={() => setActiveTab("guides")}
          activeOpacity={0.7}
        >
          <Book
            size={20}
            color={activeTab === "guides" ? colors.primary : colors.textTertiary}
            strokeWidth={2}
          />
          <Text
            style={[styles.tabText, activeTab === "guides" && styles.tabTextActive]}
          >
            Guides
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primaryLight}20` as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500" as const,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: "row" as const,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 12,
  },
  tab: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent" as const,
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tabContent: {
    gap: 16,
  },
  categorySection: {
    gap: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
    marginTop: 8,
  },
  faqItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600" as const,
    color: colors.text,
    lineHeight: 22,
  },
  faqAnswer: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  needMoreHelpCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: `${colors.primary}10` as const,
    borderRadius: 12,
    padding: 16,
    gap: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: `${colors.primary}30` as const,
  },
  needMoreHelpText: {
    flex: 1,
  },
  needMoreHelpTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 2,
  },
  needMoreHelpSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  contactHeader: {
    alignItems: "center" as const,
    paddingVertical: 24,
    gap: 8,
  },
  contactTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: colors.text,
  },
  contactSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  formSection: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputDisabled: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputDisabledText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  textArea: {
    minHeight: 120,
  },
  submitButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.surface,
  },
  alternativeContact: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  alternativeTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  alternativeItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  alternativeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500" as const,
    color: colors.primary,
  },
  guidesHeader: {
    alignItems: "center" as const,
    paddingVertical: 24,
    gap: 8,
  },
  guidesTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: colors.text,
  },
  guidesSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center" as const,
    paddingHorizontal: 20,
  },
  guideCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  guideIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15` as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  guideContent: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 4,
  },
  guideDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.primary,
  },
  guideDetail: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  guideDetailTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 16,
  },
  guideDetailContent: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});
