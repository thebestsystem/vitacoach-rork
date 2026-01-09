import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Zap, ChevronRight } from "lucide-react-native";

export function RecalibrationAlertCard() {
  const handlePress = () => {
    router.push("/plan-recalibration" as any);
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Zap size={24} color="#FFF" fill="#3B82F6" />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>🎯 Recalibrage recommandé</Text>
        <Text style={styles.subtitle}>
          Vos données biométriques suggèrent des ajustements pour vos plans
        </Text>
      </View>
      
      <ChevronRight size={20} color="#6B7280" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#3B82F6",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
});
