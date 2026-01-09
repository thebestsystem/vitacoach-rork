import React, { useMemo, memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Line, Circle, Path, Text as SvgText } from "react-native-svg";
import colors from "@/constants/colors";

interface DataPoint {
  date: string;
  value: number;
}

interface ProgressChartProps {
  data: DataPoint[];
  title: string;
  unit?: string;
  color?: string;
  height?: number;
}

const ProgressChart = memo(function ProgressChart({ 
  data, 
  title, 
  unit = "", 
  color = colors.primary,
  height = 200 
}: ProgressChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return null;

    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const values = sortedData.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    const padding = 40;
    const chartWidth = 320;
    const chartHeight = height - padding * 2;
    const pointSpacing = chartWidth / Math.max(sortedData.length - 1, 1);

    const points = sortedData.map((point, index) => {
      const x = padding + index * pointSpacing;
      const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight;
      return { x, y, value: point.value, date: point.date };
    });

    const pathData = points
      .map((point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`;
        return `L ${point.x} ${point.y}`;
      })
      .join(" ");

    return {
      points,
      pathData,
      minValue,
      maxValue,
      range,
      chartWidth: chartWidth + padding * 2,
      chartHeight: height,
      padding,
    };
  }, [data, height]);

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const avgValue = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
    
    return { minValue, maxValue, avgValue };
  }, [data]);

  const formatDate = useMemo(() => (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  }, []);

  if (!chartData || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.emptyState, { height }]}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </View>
    );
  }

  const { points, pathData, minValue, maxValue, chartWidth, chartHeight, padding } = chartData;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Svg width={chartWidth} height={chartHeight} style={styles.chart}>
        <Line
          x1={padding}
          y1={chartHeight - padding}
          x2={chartWidth - padding}
          y2={chartHeight - padding}
          stroke={colors.border}
          strokeWidth="1"
        />

        <Line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={chartHeight - padding}
          stroke={colors.border}
          strokeWidth="1"
        />

        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = padding + (chartHeight - padding * 2) * (1 - ratio);
          const value = minValue + (maxValue - minValue) * ratio;
          return (
            <SvgText
              key={index}
              x={padding - 10}
              y={y + 5}
              fontSize="10"
              fill={colors.textTertiary}
              textAnchor="end"
            >
              {Math.round(value)}
            </SvgText>
          );
        })}

        <Path
          d={pathData}
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) => {
          const showLabel = index === 0 || index === points.length - 1 || points.length <= 7;
          return (
            <React.Fragment key={index}>
              <Circle cx={point.x} cy={point.y} r="5" fill={color} />
              <Circle cx={point.x} cy={point.y} r="8" fill={color} opacity="0.2" />
              
              {showLabel && (
                <SvgText
                  x={point.x}
                  y={chartHeight - padding + 20}
                  fontSize="10"
                  fill={colors.textSecondary}
                  textAnchor="middle"
                >
                  {formatDate(point.date)}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>

      {stats && (
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Min</Text>
            <Text style={styles.statValue}>
              {Math.round(stats.minValue)}{unit}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Max</Text>
            <Text style={styles.statValue}>
              {Math.round(stats.maxValue)}{unit}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Avg</Text>
            <Text style={styles.statValue}>
              {stats.avgValue}{unit}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
});

export default ProgressChart;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 16,
  },
  chart: {
    alignSelf: "center" as const,
  },
  emptyState: {
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: "500" as const,
  },
  stats: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    alignItems: "center" as const,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500" as const,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
  },
});
