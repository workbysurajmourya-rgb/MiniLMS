/**
 * Course Detail Screen with WebView
 * Implements bidirectional Native ↔ WebView communication
 */

import { LoadingSpinner, OfflineBanner } from "@/src/components";
import { useAppStateStore } from "@/src/store/appStateStore";
import { useCourseStore } from "@/src/store/courseStore";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
    Alert,
    FlatList,
    ScrollView,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView, { WebViewMessageEvent } from "react-native-webview";
const BLURHASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

// WebView message types
interface WebViewMessage {
  type: "ENROLL" | "BOOKMARK" | "READY";
  payload?: Record<string, unknown>;
}

export default function CourseDetailScreen() {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const {
    courses,
    selectedCourse,
    bookmarkedCourses,
    enrolledCourses,
    fetchCourseDetails,
    toggleBookmark,
    toggleEnrollment,
    isLoading,
  } = useCourseStore();
  const { isOnline } = useAppStateStore();
  const [showWebView, setShowWebView] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const webViewRef = useRef<WebView>(null);

  React.useEffect(() => {
    if (courseId && !selectedCourse) {
      fetchCourseDetails(courseId);
    }
  }, [courseId, selectedCourse, fetchCourseDetails]);

  const course = selectedCourse ?? courses.find((c) => c.id === courseId);
  const isBookmarked = course ? bookmarkedCourses.includes(course.id) : false;
  const isEnrolled = course ? enrolledCourses.includes(course.id) : false;
  const imageList: string[] = course
    ? [
        ...(course.images ?? []),
        ...(course.thumbnail && !course.images?.includes(course.thumbnail) ? [course.thumbnail] : []),
      ].filter(Boolean)
    : [];

  if (isLoading || !course) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F8F8]">
        <LoadingSpinner message="Loading course details..." />
      </SafeAreaView>
    );
  }

  // Send updated state to WebView whenever relevant state changes
  const injectCourseState = useCallback(() => {
    if (!webViewRef.current) return;
    const state = {
      courseId: course.id,
      title: course.title,
      isEnrolled,
      isBookmarked,
      price: course.price ?? 0,
      rating: course.rating ?? 4.5,
      enrolledCount: course.enrolledCount ?? 0,
    };
    webViewRef.current.injectJavaScript(
      `window.__updateCourseState && window.__updateCourseState(${JSON.stringify(state)}); true;`
    );
  }, [course, isEnrolled, isBookmarked]);

  const handleEnroll = useCallback(() => {
    if (!isOnline) {
      Alert.alert("Offline", "Internet connection required to enroll.");
      return;
    }

    if (isEnrolled) {
      Alert.alert(
        "Unenroll",
        "Are you sure you want to unenroll from this course?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Unenroll",
            style: "destructive",
            onPress: () => {
              toggleEnrollment(course.id);
              injectCourseState();
            },
          },
        ]
      );
    } else {
      toggleEnrollment(course.id);
      injectCourseState();
      Alert.alert("Success", "You have enrolled in this course!");
    }
  }, [course, isEnrolled, isOnline, toggleEnrollment, injectCourseState]);

  // Handle messages posted from WebView via window.ReactNativeWebView.postMessage
  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg: WebViewMessage = JSON.parse(event.nativeEvent.data);
        switch (msg.type) {
          case "READY":
            injectCourseState();
            break;
          case "ENROLL":
            handleEnroll();
            break;
          case "BOOKMARK":
            toggleBookmark(course.id);
            break;
        }
      } catch {
        // Malformed message – ignore
      }
    },
    [course, injectCourseState, handleEnroll, toggleBookmark]
  );

  // HTML template with bidirectional JS ↔ Native communication
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Course Content</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f0f4f8;
          color: #333;
          padding: 16px;
          padding-bottom: 32px;
        }
        .card {
          background: #fff;
          border-radius: 14px;
          padding: 18px;
          margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .badge {
          display: inline-block;
          background: #e8f1ff;
          color: #007AFF;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          margin-bottom: 10px;
        }
        h1 { font-size: 22px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; }
        p  { font-size: 14px; color: #666; line-height: 1.7; }
        .stats { display: flex; gap: 16px; margin-top: 12px; }
        .stat  { text-align: center; flex: 1; }
        .stat-value { font-size: 20px; font-weight: 700; color: #007AFF; }
        .stat-label { font-size: 11px; color: #888; margin-top: 2px; }
        h2 { font-size: 17px; font-weight: 700; color: #1a1a1a; margin-bottom: 10px; }
        ul { padding-left: 18px; }
        li { font-size: 14px; color: #555; line-height: 2; }
        .btn {
          display: block;
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          margin-bottom: 10px;
          transition: opacity 0.2s;
        }
        .btn:active { opacity: 0.75; }
        #enrollBtn  { background: #007AFF; color: #fff; }
        #enrollBtn.enrolled { background: #34C759; }
        #bookmarkBtn { background: #fff; color: #007AFF; border: 2px solid #007AFF; }
        #bookmarkBtn.bookmarked { background: #fff0f0; color: #FF3B30; border-color: #FF3B30; }
        .status-bar {
          text-align: center;
          font-size: 12px;
          color: #aaa;
          margin-top: 8px;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge" id="priceBadge">Loading...</span>
        <h1 id="courseTitle">Loading course...</h1>
        <p id="courseDesc">${course.description.replace(/'/g, "\\'").replace(/\n/g, " ")}</p>
        <div class="stats">
          <div class="stat">
            <div class="stat-value" id="ratingVal">—</div>
            <div class="stat-label">Rating</div>
          </div>
          <div class="stat">
            <div class="stat-value" id="enrolledVal">—</div>
            <div class="stat-label">Enrolled</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>What You'll Learn</h2>
        <ul>
          <li>In-depth understanding of core concepts</li>
          <li>Practical, hands-on exercises</li>
          <li>Real-world project walkthroughs</li>
          <li>Industry best practices &amp; patterns</li>
          <li>Community &amp; instructor support</li>
        </ul>
      </div>

      <div class="card">
        <button id="enrollBtn"   class="btn" onclick="handleEnroll()">Enroll Now</button>
        <button id="bookmarkBtn" class="btn" onclick="handleBookmark()">Bookmark</button>
        <div class="status-bar" id="statusBar">Powered by MiniLMS</div>
      </div>

      <script>
        // Called by Native app to push latest state into the WebView
        window.__updateCourseState = function(state) {
          document.getElementById('courseTitle').textContent  = state.title;
          document.getElementById('ratingVal').textContent    = state.rating.toFixed(1) + ' ★';
          document.getElementById('enrolledVal').textContent  = state.enrolledCount;
          document.getElementById('priceBadge').textContent   = state.price > 0 ? '$' + state.price.toFixed(2) : 'FREE';

          var enrollBtn = document.getElementById('enrollBtn');
          enrollBtn.textContent = state.isEnrolled ? '✓  Enrolled' : 'Enroll Now';
          enrollBtn.className   = 'btn' + (state.isEnrolled ? ' enrolled' : '');

          var bmBtn = document.getElementById('bookmarkBtn');
          bmBtn.textContent  = state.isBookmarked ? '🔖 Bookmarked' : 'Bookmark';
          bmBtn.className    = 'btn' + (state.isBookmarked ? ' bookmarked' : '');
        };

        function postMsg(type, payload) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload || {} }));
        }

        function handleEnroll()   { postMsg('ENROLL');   }
        function handleBookmark() { postMsg('BOOKMARK'); }

        // Notify native that the page is ready so it can inject initial state
        document.addEventListener('DOMContentLoaded', function() {
          postMsg('READY');
        });
      </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView className="flex-1 bg-[#F8F8F8]">
      <OfflineBanner isOnline={isOnline} />

      {!showWebView ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Swipable image gallery */}
          {imageList.length > 0 ? (
            <View className="bg-gray-200" style={{ height: 240 }}>
              <FlatList
                data={imageList}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => i.toString()}
                onScroll={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setActiveImageIndex(idx);
                }}
                scrollEventThrottle={16}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item }}
                    style={{ width: SCREEN_WIDTH, height: 240 }}
                    contentFit="cover"
                    placeholder={{ blurhash: BLURHASH }}
                    cachePolicy="memory-disk"
                    transition={200}
                  />
                )}
              />
              {imageList.length > 1 && (
                <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1.5">
                  {imageList.map((_, i) => (
                    <View
                      key={i}
                      style={{
                        width: i === activeImageIndex ? 20 : 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: i === activeImageIndex ? "#007AFF" : "rgba(255,255,255,0.7)",
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : null}

          <View className="px-4">
          <View className="flex-row justify-between items-center mt-3 mb-3">
            <Text className="text-2xl font-bold text-primary">{course.price ? `$${course.price}` : "FREE"}</Text>
            <TouchableOpacity
              className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center"
              onPress={() => toggleBookmark(course.id)}
            >
              <MaterialIcons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={28}
                color={isBookmarked ? "#FF6B6B" : "#007AFF"}
              />
            </TouchableOpacity>
          </View>

          <Text className="text-2xl font-bold text-gray-900 mb-3">{course.title}</Text>

          {course.instructor && (
            <View className="flex-row items-center mb-4 gap-2">
              {course.instructor.image ? (
                <Image
                  source={{ uri: course.instructor.image }}
                  style={{ width: 32, height: 32, borderRadius: 16 }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : (
                <MaterialIcons name="person" size={20} color="#666" />
              )}
              <Text className="text-sm text-gray-600 font-medium">
                {`${course.instructor.firstName} ${course.instructor.lastName}`}
              </Text>
            </View>
          )}

          <View className="flex-row gap-4 mb-5">
            <View className="flex-row items-center gap-1.5">
              <MaterialIcons name="star" size={16} color="#FFB81C" />
              <Text className="text-sm text-gray-600">
                {course.rating?.toFixed(1) || "4.5"} Rating
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <MaterialIcons name="people" size={16} color="#666" />
              <Text className="text-sm text-gray-600">
                {course.enrolledCount || 0} Enrolled
              </Text>
            </View>
          </View>

          <View className="bg-white rounded-xl p-4 mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">Description</Text>
            <Text className="text-sm text-gray-600 leading-5">{course.description}</Text>
          </View>

          <View className="bg-white rounded-xl p-4 mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">What You'll Learn</Text>
            <View className="gap-2">
              <Text className="text-sm text-gray-600 ml-4 leading-5">Comprehensive understanding of the subject</Text>
              <Text className="text-sm text-gray-600 ml-4 leading-5">Practical skills and techniques</Text>
              <Text className="text-sm text-gray-600 ml-4 leading-5">Real-world applications</Text>
              <Text className="text-sm text-gray-600 ml-4 leading-5">Industry best practices</Text>
            </View>
          </View>

          <TouchableOpacity
            className={`flex-row items-center justify-center py-3.5 rounded-lg gap-2 mb-3 ${isEnrolled ? "bg-green-500" : "bg-primary"}`}
            onPress={handleEnroll}
            activeOpacity={0.7}
          >
            <MaterialIcons name={isEnrolled ? "check" : "add"} size={20} color="#FFFFFF" />
            <Text className="text-white text-base font-semibold">
              {isEnrolled ? "Enrolled" : "Enroll Now"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white flex-row items-center justify-center py-3.5 rounded-lg border border-primary gap-2"
            onPress={() => setShowWebView(true)}
          >
            <MaterialIcons name="preview" size={20} color="#007AFF" />
            <Text className="text-primary text-base font-semibold">View Course Content</Text>
          </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1">
          <TouchableOpacity
            className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white items-center justify-center"
            style={{ elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}
            onPress={() => setShowWebView(false)}
          >
            <MaterialIcons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <WebView
            ref={webViewRef}
            source={{ html: htmlContent }}
            style={{ flex: 1 }}
            startInLoadingState
            renderLoading={() => <LoadingSpinner size="small" />}
            onMessage={handleWebViewMessage}
            onError={() => Alert.alert("Error", "Failed to load course content.")}
            javaScriptEnabled
            domStorageEnabled
            scalesPageToFit={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
