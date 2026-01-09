import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Send,
  User,
} from "lucide-react-native";
import { BlurView } from "expo-blur";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useHealth } from "@/contexts/HealthContext";
import { getBaseUrl } from "@/utils/baseUrl";

// Mock Coach Data
const COACH = {
  name: "VitaCoach",
  specialty: "Coach IA Personnel",
  image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
  status: "online"
};

export default function CoachSessionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { userProfile, healthMetrics } = useHealth();

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [sessionState, setSessionState] = useState<"waiting" | "connecting" | "active" | "ended">("waiting");
  const [sessionTime, setSessionTime] = useState(0);

  // AI Chat Hook
  const [inputText, setInputText] = useState("");
  const [chatMessages, setChatMessages] = useState<{id: string, role: 'user' | 'assistant', content: string}[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Bonjour ${user?.displayName || userProfile?.name || 'Champion'} ! Je suis votre coach personnel IA. Comment vous sentez-vous aujourd'hui ?`
    }
  ]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (sessionState === "active") {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionState]);

  // Simulate connection flow
  useEffect(() => {
    if (sessionState === "waiting") {
      const timer = setTimeout(() => {
        setSessionState("connecting");
        setTimeout(() => setSessionState("active"), 1500);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [sessionState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setSessionState("ended");
    Alert.alert(
      "Session Terminée",
      "Excellent travail aujourd'hui ! Votre coach va vous envoyer un résumé.",
      [{ text: "Fermer", onPress: () => router.back() }]
    );
  };

  const onSendMessage = async () => {
      if (!inputText.trim()) return;
      
      const userMessage = {
        id: `user_${Date.now()}`,
        role: 'user' as const,
        content: inputText
      };
      
      setChatMessages(prev => [...prev, userMessage]);
      setInputText("");
      
      try {
        const response = await fetch(`${getBaseUrl()}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...chatMessages, userMessage],
            userName: user?.displayName,
            userGoals: userProfile?.goals?.join(", "),
            userRole: userProfile?.role,
            healthContext: {
              steps: healthMetrics?.steps,
              sleep: healthMetrics?.sleep,
              mood: healthMetrics?.mood
            }
          })
        });
        
        if (!response.ok) throw new Error('Échec de l\'envoi du message');
        
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            assistantContent += decoder.decode(value);
          }
        }
        
        setChatMessages(prev => [...prev, {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: assistantContent
        }]);
      } catch (error) {
        console.error("Chat Error:", error);
        Alert.alert("Problème de connexion", "Impossible de se connecter au coach. Veuillez réessayer.");
      }
  };

  if (sessionState === "ended") {
     return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Main Video Area (Coach) */}
      <View style={styles.videoContainer}>
        {sessionState === "active" ? (
           <Image source={{ uri: COACH.image }} style={styles.coachVideo} />
        ) : (
           <View style={styles.placeholderVideo}>
              <User size={64} color={colors.textSecondary} />
              <Text style={styles.statusText}>
                {sessionState === "waiting" ? "Connexion au coach..." : "Connexion en cours..."}
              </Text>
           </View>
        )}

        {/* User Mini View */}
        {isVideoEnabled && (
           <View style={[styles.userVideo, { top: insets.top + 20 }]}>
              {/* This would be the Camera component in a real app */}
              <View style={styles.userVideoPlaceholder}>
                 <Text style={styles.userVideoText}>Vous</Text>
              </View>
           </View>
        )}
      </View>

      {/* Overlay UI */}
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={styles.header}>
            <View style={styles.coachInfo}>
               <Text style={styles.coachName}>{COACH.name}</Text>
               <Text style={styles.sessionType}>Session Coaching Personnalisée</Text>
            </View>
            <View style={styles.timerBadge}>
               <View style={styles.recordingDot} />
               <Text style={styles.timerText}>{formatTime(sessionTime)}</Text>
            </View>
        </View>

        {showChat && (
           <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.chatOverlayWrapper}
           >
               <BlurView intensity={80} tint="dark" style={styles.chatOverlay}>
                  <ScrollView style={styles.chatList} contentContainerStyle={{ paddingBottom: 10 }}>
                     {chatMessages.map(msg => (
                        <View key={msg.id} style={[
                            styles.chatBubble,
                            msg.role === 'user' ? styles.userBubble : styles.coachBubble
                        ]}>
                            <Text style={styles.chatText}>{msg.content}</Text>
                        </View>
                     ))}
                  </ScrollView>
                  <View style={styles.chatInputContainer}>
                     <TextInput
                        style={styles.chatInput}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Écrivez votre message..."
                        placeholderTextColor="#999"
                        onSubmitEditing={onSendMessage}
                     />
                     <TouchableOpacity onPress={onSendMessage} style={styles.sendButton}>
                        <Send size={20} color="#FFF" />
                     </TouchableOpacity>
                  </View>
               </BlurView>
           </KeyboardAvoidingView>
        )}

        <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity
               style={[styles.controlButton, !isMicEnabled && styles.controlButtonDisabled]}
               onPress={() => setIsMicEnabled(!isMicEnabled)}
            >
               {isMicEnabled ? <Mic size={24} color="#FFF" /> : <MicOff size={24} color="#FFF" />}
            </TouchableOpacity>

            <TouchableOpacity
               style={[styles.controlButton, !isVideoEnabled && styles.controlButtonDisabled]}
               onPress={() => setIsVideoEnabled(!isVideoEnabled)}
            >
               {isVideoEnabled ? <Video size={24} color="#FFF" /> : <VideoOff size={24} color="#FFF" />}
            </TouchableOpacity>

            <TouchableOpacity
               style={[styles.controlButton, showChat && styles.controlButtonActive]}
               onPress={() => setShowChat(!showChat)}
            >
               <MessageSquare size={24} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity
               style={styles.endCallButton}
               onPress={handleEndCall}
            >
               <PhoneOff size={32} color="#FFF" />
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoContainer: {
    flex: 1,
    position: "relative",
  },
  coachVideo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderVideo: {
    flex: 1,
    backgroundColor: "#1F2937",
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    color: "#9CA3AF",
    marginTop: 16,
    fontSize: 18,
  },
  userVideo: {
    position: "absolute",
    right: 20,
    width: 100,
    height: 140,
    borderRadius: 12,
    backgroundColor: "#333",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  userVideoPlaceholder: {
    flex: 1,
    backgroundColor: "#4B5563",
    justifyContent: "center",
    alignItems: "center",
  },
  userVideoText: {
    color: "#FFF",
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
  },
  coachInfo: {
    gap: 4,
  },
  coachName: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sessionType: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  timerText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  controlButtonDisabled: {
    backgroundColor: "#EF4444",
  },
  controlButtonActive: {
    backgroundColor: colors.primary,
  },
  endCallButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  chatOverlayWrapper: {
    position: "absolute",
    bottom: 140,
    left: 20,
    right: 20,
    height: 300,
  },
  chatOverlay: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  chatList: {
    flex: 1,
    padding: 16,
  },
  chatBubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: "80%",
  },
  userBubble: {
    backgroundColor: colors.primary,
    alignSelf: "flex-end",
  },
  coachBubble: {
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
  },
  chatText: {
    color: "#FFF",
    fontSize: 14,
  },
  chatInputContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  chatInput: {
    flex: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 16,
    color: "#FFF",
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});
