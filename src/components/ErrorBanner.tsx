/**
 * Error Banner Component
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ViewProps,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface ErrorBannerProps extends ViewProps {
  message?: string;
  onDismiss?: () => void;
  duration?: number;
  severity?: "error" | "warning" | "info";
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onDismiss,
  duration = 5000,
  severity = "error",
  style,
  ...props
}) => {
  const [visible, setVisible] = useState(!!message);
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (message) {
      setVisible(true);

      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, duration]);

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      onDismiss?.();
    });
  };

  if (!visible || !message) return null;

  const bgColor =
    severity === "error"
      ? "#FFE5E5"
      : severity === "warning"
        ? "#FFF3CD"
        : "#E3F2FD";

  const borderColor =
    severity === "error"
      ? "#FF6B6B"
      : severity === "warning"
        ? "#FFC107"
        : "#2196F3";

  const textColor =
    severity === "error"
      ? "#C41C3B"
      : severity === "warning"
        ? "#856404"
        : "#0D47A1";

  const iconName =
    severity === "error"
      ? "error"
      : severity === "warning"
        ? "warning"
        : "info";

  return (
    <Animated.View
      style={[{ opacity: fadeAnim }, style]}
      {...props}
    >
      <View
        style={{
          backgroundColor: bgColor,
          borderLeftWidth: 4,
          borderLeftColor: borderColor,
          padding: 12,
          marginHorizontal: 16,
          marginVertical: 8,
          borderRadius: 6,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          <MaterialIcons name={iconName} size={24} color={textColor} />
          <Text
            style={{
              marginLeft: 12,
              flex: 1,
              color: textColor,
              fontSize: 14,
              fontWeight: "500",
            }}
            numberOfLines={2}
          >
            {message}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleDismiss}
          style={{ padding: 4, marginLeft: 8 }}
        >
          <MaterialIcons name="close" size={20} color={textColor} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};
