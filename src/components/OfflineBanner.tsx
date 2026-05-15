/**
 * Offline Banner Component
 */

import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface OfflineBannerProps {
  isOnline: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline }) => {
  if (isOnline) return null;

  return (
    <View className="bg-danger px-4 py-2.5 flex-row items-center justify-center gap-2">
      <MaterialIcons name="wifi-off" size={18} color="#FFFFFF" />
      <Text className="text-white text-sm font-semibold">No Internet Connection</Text>
    </View>
  );
};
