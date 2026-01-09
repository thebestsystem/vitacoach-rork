import React from "react";
import { View, StyleSheet, Text, Dimensions } from "react-native";
import { Svg, Rect, Text as SvgText, G } from "react-native-svg";
import colors from "@/constants/colors";

interface DataPoint {
  label: string; // Day (e.g., "Mon")
  mood: number; // 1-10
  stress: number; // 1-10
  energy: number; // 1-10
}

interface WellnessTrendsChartProps {
  data: DataPoint[];
  height?: number;
}

export const WellnessTrendsChart = ({ data, height = 220 }: WellnessTrendsChartProps) => {
  const screenWidth = Dimensions.get("window").width;
  const padding = 20;
  const chartWidth = screenWidth - padding * 2 - 32; // Container padding
  const barWidth = (chartWidth / data.length) * 0.6;
  const spacing = (chartWidth / data.length) * 0.4;

  const maxValue = 10;
  const chartHeight = height - 40; // Space for labels

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Wellness Trends</Text>
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Mood</Text>
        </View>
        <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.legendText}>Energy</Text>
        </View>
        <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
            <Text style={styles.legendText}>Stress</Text>
        </View>
      </View>

      <Svg width={chartWidth} height={height}>
        {/* Y-Axis Lines */}
        {[0, 2.5, 5, 7.5, 10].map((val, i) => {
           const y = chartHeight - (val / maxValue) * chartHeight;
           return (
             <G key={i}>
                <Rect x="0" y={y} width={chartWidth} height="1" fill={colors.border} opacity={0.3} />
             </G>
           );
        })}

        {/* Bars */}
        {data.map((point, index) => {
            const x = index * (barWidth + spacing) + spacing / 2;
            const barSectionWidth = barWidth / 3;

            // Mood Bar
            const moodH = (point.mood / maxValue) * chartHeight;
            const moodY = chartHeight - moodH;

            // Energy Bar
            const energyH = (point.energy / maxValue) * chartHeight;
            const energyY = chartHeight - energyH;

            // Stress Bar
            const stressH = (point.stress / maxValue) * chartHeight;
            const stressY = chartHeight - stressH;

            return (
                <G key={index}>
                    {/* Mood */}
                    <Rect
                        x={x}
                        y={moodY}
                        width={barSectionWidth}
                        height={moodH}
                        fill={colors.primary}
                        rx={2}
                    />
                    {/* Energy */}
                    <Rect
                        x={x + barSectionWidth}
                        y={energyY}
                        width={barSectionWidth}
                        height={energyH}
                        fill={colors.warning}
                        rx={2}
                    />
                    {/* Stress */}
                    <Rect
                        x={x + barSectionWidth * 2}
                        y={stressY}
                        width={barSectionWidth}
                        height={stressH}
                        fill={colors.error}
                        rx={2}
                    />

                    {/* Label */}
                    <SvgText
                        x={x + barWidth / 2}
                        y={height - 10}
                        fontSize="10"
                        fill={colors.textSecondary}
                        textAnchor="middle"
                    >
                        {point.label}
                    </SvgText>
                </G>
            );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  legendContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
});
