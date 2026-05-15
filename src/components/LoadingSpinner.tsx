/**
 * Loading Spinner Component
 */

import React from "react";
import { ActivityIndicator, View, ViewProps, Text } from "react-native";

interface LoadingSpinnerProps extends ViewProps {
  size?: "small" | "large";
  color?: string;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "large",
  color = "#007AFF",
  message,
  style,
  ...props
}) => {
  return (
    <View
      style={[
        {
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        },
        style,
      ]}
      {...props}
    >
      <ActivityIndicator size={size} color={color} />
      {message && (
        <View style={{ marginTop: 12 }}>
          <Text style={{ color: "#666", fontSize: 14, textAlign: "center" }}>
            {message}
          </Text>
        </View>
      )}
    </View>
  );
};
