import {
    CourseCard,
    OfflineBanner,
} from "@/src/components";
import { useAppStateStore } from "@/src/store/appStateStore";
import { useCourseStore } from "@/src/store/courseStore";
import { MaterialIcons } from "@expo/vector-icons";
import { LegendList } from "@legendapp/list";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BookmarksScreen() {
  const router = useRouter();
  const { courses, bookmarkedCourses, toggleBookmark, fetchCourses } =
    useCourseStore();
  const { isOnline } = useAppStateStore();

  useFocusEffect(
    React.useCallback(() => {
      if (courses.length === 0) {
        fetchCourses(1, 50);
      }
    }, [])
  );

  const bookmarkedCoursesList = courses.filter((course) =>
    bookmarkedCourses.includes(course.id)
  );

  const renderEmptyState = useCallback(() => (
    <View className="flex-1 items-center justify-center py-16">
      <MaterialIcons name="bookmark-outline" size={64} color="#CCC" />
      <Text className="text-lg font-semibold text-gray-800 mt-4">No Bookmarked Courses</Text>
      <Text className="text-sm text-gray-400 mt-2">Bookmark courses to view them here</Text>
    </View>
  ), []);

  return (
    <SafeAreaView className="flex-1 bg-[#F8F8F8]">
      <OfflineBanner isOnline={isOnline} />
      <LegendList
        data={bookmarkedCoursesList}
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            onPress={(course) => router.push({ pathname: "/course-detail", params: { courseId: course.id } })}
            onBookmarkToggle={(courseId) => toggleBookmark(courseId)}
            isBookmarked={true}
          />
        )}
        keyExtractor={(item) => item.id}
        estimatedItemSize={260}
        recycleItems
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={bookmarkedCoursesList.length === 0 ? { flexGrow: 1 } : { paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

