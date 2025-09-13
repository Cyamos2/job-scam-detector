import * as React from "react";
import { Animated, Easing, StyleSheet, Text, Pressable, View } from "react-native";

type Props = {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onHide?: () => void;
  duration?: number; // ms
};

export default function UndoBar({
  visible,
  message,
  actionLabel = "Undo",
  onAction,
  onHide,
  duration = 2500,
}: Props) {
  const y = React.useRef(new Animated.Value(80)).current; // offscreen
  const timer = React.useRef<NodeJS.Timeout | null>(null);

  const hide = React.useCallback(() => {
    Animated.timing(y, {
      toValue: 80,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onHide && onHide());
  }, [y, onHide]);

  React.useEffect(() => {
    if (!visible) return;
    // slide up
    Animated.timing(y, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // auto-hide
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(hide, duration);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [visible, duration, hide, y]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.wrap, { transform: [{ translateY: y }] }]}>
      <View style={styles.snack}>
        <Text style={styles.msg}>{message}</Text>
        {onAction ? (
          <Pressable onPress={onAction} style={styles.btn}>
            <Text style={styles.btnText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 12,
    alignItems: "center",
    zIndex: 50,
  },
  snack: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#111827",
    borderRadius: 999,
  },
  msg: { color: "#fff", fontWeight: "700", marginRight: 12 },
  btn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: "#374151" },
  btnText: { color: "#fff", fontWeight: "800" },
});