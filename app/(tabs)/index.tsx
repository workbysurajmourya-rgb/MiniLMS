import {
  CourseCard,
  ErrorBanner,
  LoadingSpinner,
  OfflineBanner,
} from "@/src/components";
import { smartSearch } from "@/src/services/aiService";
import { useAppStateStore } from "@/src/store/appStateStore";
import { useCourseStore } from "@/src/store/courseStore";
import { Course } from "@/src/types";
import ErrorHandler from "@/src/utils/errors";
import NotificationService from "@/src/utils/notifications";
import { MaterialIcons } from "@expo/vector-icons";
import { LegendList, LegendListRenderItemProps } from "@legendapp/list";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const {
    courses,
    isLoading,
    error,
    bookmarkedCourses,
    hasMore,
    page,
    fetchCourses,
    searchCourses,
    toggleBookmark,
    setError,
  } = useCourseStore();

  const { isOnline, searchQuery, setSearchQuery, errorMessage, setErrorMessage } =
    useAppStateStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [aiResults, setAiResults] = useState<Course[] | null>(null);
  const [inputValue, setInputValue] = useState(searchQuery);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      if (courses.length === 0) {
        loadInitialCourses();
      }
    }, [])
  );

  const loadInitialCourses = useCallback(async () => {
    try {
      await fetchCourses(1, 10);
    } catch (err) {
      const apiError = ErrorHandler.handleApiError(err);
      setErrorMessage(ErrorHandler.getUserMessage(apiError));
    }
  }, [fetchCourses, setErrorMessage]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchCourses(1, 10);
    } catch (error) {
      const apiError = ErrorHandler.handleApiError(error);
      setErrorMessage(ErrorHandler.getUserMessage(apiError));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore || isLoading) return;
    setIsLoadingMore(true);
    try {
      await fetchCourses(page + 1, 10);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const runSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setAiResults(null);
      await loadInitialCourses();
      return;
    }
    try {
      const [, semantic] = await Promise.all([
        searchCourses(query),
        smartSearch(query, courses),
      ]);
      setAiResults(semantic.length > 0 ? semantic : null);
    } catch (error) {
      const apiError = ErrorHandler.handleApiError(error);
      setErrorMessage(ErrorHandler.getUserMessage(apiError));
    }
  }, [courses]);

  const handleInputChange = (text: string) => {
    setInputValue(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => runSearch(text), 400);
  };

  useEffect(() => () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  }, []);

  // Use AI results when available, otherwise fall back to store courses
  const displayedCourses = aiResults ?? courses;

  const handleBookmarkToggle = useCallback(async (courseId: string, isBookmarked: boolean) => {
    toggleBookmark(courseId);
    if (isBookmarked) {
      const newCount = bookmarkedCourses.length + 1;
      if (newCount === 5) {
        try {
          await NotificationService.sendNotification({
            title: "Great progress! 🎓",
            body: "You have bookmarked 5 courses. Keep exploring!",
            data: { type: "bookmark_milestone" },
          });
        } catch {
          // non-critical
        }
      }
    }
  }, [toggleBookmark, bookmarkedCourses.length]);

  const handleCoursePress = useCallback((course: Course) => {
    router.push({ pathname: "/course-detail", params: { courseId: course.id } });
  }, [router]);

  const renderCourseItem = useCallback(({ item }: LegendListRenderItemProps<Course>) => (
    <CourseCard
      course={item}
      onPress={handleCoursePress}
      onBookmarkToggle={handleBookmarkToggle}
      isBookmarked={bookmarkedCourses.includes(item.id)}
      showInstructor
    />
  ), [handleCoursePress, handleBookmarkToggle, bookmarkedCourses]);

  const renderFooter = () =>
    isLoadingMore && hasMore ? <LoadingSpinner size="small" message="Loading more..." /> : null;

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-16">
      <MaterialIcons name="school" size={64} color="#CCC" />
      <Text className="text-lg font-semibold text-gray-800 mt-4">No Courses Found</Text>
      <Text className="text-sm text-gray-400 mt-2 text-center">
        {searchQuery ? "Try searching with different keywords" : "Pull down to refresh"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8F8F8]">
      <OfflineBanner isOnline={isOnline} />

      {(error || errorMessage) && (
        <ErrorBanner
          message={error || errorMessage || undefined}
          onDismiss={() => setError(null)}
          severity="error"
        />
      )}

      {/* Search Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3">
          <MaterialIcons name="search" size={20} color="#999" />
          <TextInput
            className="flex-1 py-2.5 px-3 text-sm text-gray-800"
            placeholder="Search courses..."
            placeholderTextColor="#CCC"
            value={inputValue}
            onChangeText={handleInputChange}
            editable={!isLoading}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {inputValue.length > 0 && (
            <MaterialIcons
              name="close"
              size={18}
              color="#999"
              onPress={() => { setInputValue(""); runSearch(""); }}
            />
          )}
        </View>
      </View>

      {isLoading && courses.length === 0 ? (
        <LoadingSpinner message="Loading courses..." />
      ) : (
        <LegendList
          data={displayedCourses}
          renderItem={renderCourseItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={260}
          recycleItems
          extraData={bookmarkedCourses}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={displayedCourses.length === 0 ? { flexGrow: 1 } : { paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

