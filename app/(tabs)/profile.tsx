import { OfflineBanner } from "@/src/components";
import { useAppStateStore } from "@/src/store/appStateStore";
import { useAuthStore } from "@/src/store/authStore";
import { useCourseStore } from "@/src/store/courseStore";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuthStore();
  const { isOnline } = useAppStateStore();
  const { enrolledCourses, bookmarkedCourses, courses } = useCourseStore();

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              router.replace("/(auth)/login");
            } catch {
              Alert.alert("Error", "Failed to logout");
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F8F8] items-center justify-center">
        <Text className="text-gray-500">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  const stats = [
    { label: "Enrolled", value: enrolledCourses.length, icon: "school" as const, color: "#007AFF" },
    { label: "Bookmarked", value: bookmarkedCourses.length, icon: "bookmark" as const, color: "#FF6B6B" },
    { label: "Available", value: courses.length, icon: "library-books" as const, color: "#4CAF50" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F8F8F8]">
      <OfflineBanner isOnline={isOnline} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}>
        {/* Avatar & Name */}
        <View className="items-center mb-6 pb-6 border-b border-gray-200">
          <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mb-4">
            <MaterialIcons name="person" size={80} color="#007AFF" />
          </View>
          <Text className="text-2xl font-bold text-gray-900">{user.name || "User"}</Text>
          <Text className="text-sm text-gray-400 mt-1">{user.email}</Text>
        </View>

        {/* Stats Row */}
        <View className="flex-row gap-3 mb-6">
          {stats.map((stat) => (
            <View
              key={stat.label}
              className="flex-1 bg-white rounded-2xl py-3.5 items-center"
              style={{ elevation: 2 }}
            >
              <MaterialIcons name={stat.icon} size={24} color={stat.color} />
              <Text className="text-xl font-extrabold mt-1" style={{ color: stat.color }}>{stat.value}</Text>
              <Text className="text-xs text-gray-400 mt-0.5">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Account Info */}
        <View className="bg-white rounded-2xl p-4 mb-6">
          <Text className="text-base font-semibold text-gray-900 mb-4">Account Information</Text>
          {[
            { icon: "email" as const, label: "Email", value: user.email },
            { icon: "person" as const, label: "Name", value: user.username || "Not provided" },
            {
              icon: "calendar-today" as const,
              label: "Member Since",
              value: new Date(user.createdAt).toLocaleDateString(),
            },
          ].map((item) => (
            <View key={item.label} className="flex-row items-center mb-4">
              <MaterialIcons name={item.icon} size={20} color="#666" />
              <View className="ml-3 flex-1">
                <Text className="text-xs text-gray-400 mb-1">{item.label}</Text>
                <Text className="text-sm text-gray-800 font-medium">{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          className={`flex-row items-center justify-center py-3.5 rounded-xl gap-2 ${
            isLoading ? "opacity-60 bg-red-600" : "bg-red-600"
          }`}
          onPress={handleLogout}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons name="logout" size={20} color="#FFFFFF" />
              <Text className="text-white text-base font-semibold">Logout</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
