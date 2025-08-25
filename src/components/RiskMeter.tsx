import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { theme } from '../theme';

export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface RiskMeterProps {
  score: number;        // 0–100 (adjusted)
  level: RiskLevel;
  baseScore?: number;   // optional: content-only score
  bonusLabel?: string;  // e.g., "+18 domain-age bonus"
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function scoreToColor(score: number) {
  const clamp = Math.max(0, Math.min(100, score));
  if (clamp <= 50) {
    const t = clamp / 50;
    const g = { r: 46, g: 201, b: 113 }; // #2EC971
    const y = { r: 255, g: 176, b: 32 }; // #FFB020
    const r = Math.round(lerp(g.r, y.r, t));
    const g2 = Math.round(lerp(g.g, y.g, t));
    const b = Math.round(lerp(g.b, y.b, t));
    return `rgb(${r}, ${g2}, ${b})`;
  } else {
    const t = (clamp - 50) / 50;
    const y = { r: 255, g: 176, b: 32 };
    const d = { r: 242, g: 85, b: 85 };  // #F25555
    const r = Math.round(lerp(y.r, d.r, t));
    const g2 = Math.round(lerp(y.g, d.g, t));
    const b = Math.round(lerp(y.b, d.b, t));
    return `rgb(${r}, ${g2}, ${b})`;
  }
}

const RiskMeter: React.FC<RiskMeterProps> = ({ score, level, baseScore, bonusLabel }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.max(0, Math.min(100, score)),
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [score]);

  const widthInterpolate = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const bgColor = scoreToColor(score);

  return (
    <View>
      <View style={styles.labelsRow}>
        <Text style={styles.labelText}>0</Text>
        <Text style={styles.labelText}>50</Text>
        <Text style={styles.labelText}>100</Text>
      </View>

      <View
        style={styles.meterOuter}
        accessibilityRole="progressbar"
        accessibilityValue={{ now: score, min: 0, max: 100 }}
      >
        <Animated.View
          style={[styles.meterInner, { width: widthInterpolate, backgroundColor: bgColor }]}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.badge}>
          Score: {score}
          {bonusLabel ? ` (${bonusLabel})` : ''}
          {typeof baseScore === 'number' ? ` · Base: ${baseScore}` : ''}
        </Text>
        <Text
          style={[
            styles.level,
            level === 'High'
              ? { color: theme.colors.danger }
              : level === 'Medium'
              ? { color: theme.colors.warning }
              : { color: theme.colors.success },
          ]}
        >
          {level} risk
        </Text>
      </View>
    </View>
  );
};

export default RiskMeter;

const styles = StyleSheet.create({
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  labelText: { color: theme.colors.hint, fontSize: 12 },
  meterOuter: {
    height: 14,
    borderRadius: 999,
    backgroundColor: '#182245',
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  meterInner: { height: '100%', borderRadius: 999 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' },
  badge: { color: theme.colors.text },
  level: { fontWeight: '800' },
});