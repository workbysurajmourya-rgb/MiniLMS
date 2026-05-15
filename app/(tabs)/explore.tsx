import { CourseCard } from "@/src/components/CourseCard";
import { getRecommendations } from "@/src/services/aiService";
import { useCourseStore } from "@/src/store/courseStore";
import { Course } from "@/src/types";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExploreScreen() {
  const router = useRouter();
  const { courses, enrolledCourses, bookmarkedCourses, toggleBookmark } = useCourseStore();
  const [aiRecommendations, setAiRecommendations] = useState<Course[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const enrolledCoursesList = courses.filter((c) =>
    enrolledCourses.includes(c.id)
  );

  useEffect(() => {
    if (courses.length === 0) return;
    let cancelled = false;
    setLoadingRecs(true);
    getRecommendations(enrolledCoursesList, courses, 5)
      .then((recs) => {
        if (!cancelled) setAiRecommendations(recs);
      })
      .finally(() => {
        if (!cancelled) setLoadingRecs(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courses.length, enrolledCourses.length]);

  const stats = [
    { label: "Enrolled", value: enrolledCourses.length, icon: "school" as const, color: "#007AFF" },
    { label: "Bookmarked", value: bookmarkedCourses.length, icon: "bookmark" as const, color: "#FF6B6B" },
    { label: "Available", value: courses.length, icon: "library-books" as const, color: "#4CAF50" },
  ];

  const handleCoursePress = (course: Course) => {
    router.push({ pathname: "/course-detail", params: { courseId: course.id } });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F8F8]">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-5 pb-4">
          <Text className="text-3xl font-bold text-gray-900">My Learning</Text>
          <Text className="text-sm text-gray-400 mt-1">Track your progress</Text>
        </View>

        {/* Stats Row */}
        <View className="flex-row px-4 gap-3 mb-6">
          {stats.map((stat) => (
            <View
              key={stat.label}
              className="flex-1 bg-white rounded-2xl py-4 items-center shadow-sm"
              style={{ elevation: 2 }}
            >
              <MaterialIcons name={stat.icon} size={28} color={stat.color} />
              <Text className="text-2xl font-extrabold mt-1.5" style={{ color: stat.color }}>
                {stat.value}
              </Text>
              <Text className="text-xs text-gray-400 mt-0.5">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Enrolled Courses */}
        <View className="pb-6">
          <Text className="text-lg font-bold text-gray-900 px-4 mb-3">Enrolled Courses</Text>
          {enrolledCoursesList.length === 0 ? (
            <View className="items-center py-8 px-4">
              <MaterialIcons name="school" size={48} color="#CCC" />
              <Text className="text-sm text-gray-300 mt-3 mb-4">No enrolled courses yet</Text>
              <TouchableOpacity
                className="bg-primary px-6 py-2.5 rounded-full"
                onPress={() => router.push("/(tabs)")}
              >
                <Text className="text-white font-semibold text-sm">Browse Courses</Text>
              </TouchableOpacity>
            </View>
          ) : (
            enrolledCoursesList.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onPress={handleCoursePress}
                onBookmarkToggle={(id) => toggleBookmark(id)}
                isBookmarked={bookmarkedCourses.includes(course.id)}
                showInstructor
              />
            ))
          )}
        </View>

        {/* AI Recommendations */}
        <View className="pb-8">
          <View className="flex-row items-center px-4 mb-3 gap-1.5">
            <MaterialIcons name="auto-awesome" size={18} color="#007AFF" />
            <Text className="text-lg font-bold text-gray-900">Recommended for You</Text>
          </View>
          {loadingRecs ? (
            <ActivityIndicator color="#007AFF" style={{ marginTop: 8 }} />
          ) : aiRecommendations.length === 0 ? (
            <Text className="text-sm text-gray-300 px-4">No recommendations yet. Enroll in a course to get started!</Text>
          ) : (
            aiRecommendations.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onPress={handleCoursePress}
                onBookmarkToggle={(id) => toggleBookmark(id)}
                isBookmarked={bookmarkedCourses.includes(course.id)}
                showInstructor
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


