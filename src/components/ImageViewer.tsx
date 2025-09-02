// src/components/ImageViewer.tsx
import React from "react";
import { Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";

type Props = {
  uri: string;
  visible: boolean;
  onClose: () => void;
};

const { width, height } = Dimensions.get("window");

export default function ImageViewer({ uri, visible, onClose }: Props) {
  if (!visible) return null;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const pan = Gesture.Pan()
    .onChange((e) => {
      translateX.value += e.changeX;
      translateY.value += e.changeY;
    });

  const pinch = Gesture.Pinch()
    .onChange((e) => {
      // clamp a bit to avoid zero/negative scale
      const next = Math.max(0.5, Math.min(4, scale.value * e.scale));
      scale.value = next;
    })
    .onEnd(() => {
      // gently spring back if tiny overshoot
      scale.value = withTiming(Math.max(0.8, Math.min(4, scale.value)));
    });

  const composed = Gesture.Simultaneous(pan, pinch);

  const imageStyle = useAnimatedStyle(() => {
    // IMPORTANT: give reanimated a proper RN transform array
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value }
      ],
    } as const; // <- helps TS narrow to the RN transform tuple
  });

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "black",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Animated.Image
          source={{ uri }}
          resizeMode="contain"
          style={[
            { width, height }, // base ImageStyle
            imageStyle as any    // avoid deep generic mismatch noise
          ]}
        />
        {/* optional: tap to close area */}
        <Animated.View
          style={{ position: "absolute", top: 40, right: 24 }}
          onTouchEnd={onClose}
        />
      </Animated.View>
    </GestureDetector>
  );
}