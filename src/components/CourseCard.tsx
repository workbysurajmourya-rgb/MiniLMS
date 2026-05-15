import { Course } from "@/src/types";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { memo, useState } from "react";
import {
  Text,
  TouchableOpacity,
  View
} from "react-native";

const PLACEHOLDER = require("@/assets/placeholder.png");
const BLURHASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

interface CourseCardProps {
  course: Course;
  onPress?: (course: Course) => void;
  onBookmarkToggle?: (courseId: string, isBookmarked: boolean) => void;
  isBookmarked?: boolean;
  showInstructor?: boolean;
  style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
}

const CourseCardInner: React.FC<CourseCardProps> = ({
  course,
  onPress,
  onBookmarkToggle,
  isBookmarked = false,
  showInstructor = true,
  style,
}) => {
  const displayPrice = course.price ? `$${course.price.toFixed(2)}` : "FREE";
  const [thumbError, setThumbError] = useState(false);

  return (
    <TouchableOpacity
      className="bg-white rounded-xl mb-4 mx-4 overflow-hidden"
      style={[
        {
          elevation: 3,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        style,
      ]}
      onPress={() => onPress?.(course)}
      activeOpacity={0.7}
    >
      {/* Thumbnail */}
      <View className="relative w-full h-[180px] bg-gray-200">
        <Image
          source={course.thumbnail ? { uri: course.thumbnail } : PLACEHOLDER}
          style={{ width: "100%", height: "100%" }}
          placeholder={{ blurhash: BLURHASH }}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
        <View className="absolute bottom-3 left-3 bg-primary px-2 py-1 rounded-md">
          <Text className="text-white text-sm font-bold">{displayPrice}</Text>
        </View>
        <TouchableOpacity
          className="absolute top-3 right-3 bg-black/40 w-10 h-10 rounded-full items-center justify-center"
          onPress={() => onBookmarkToggle?.(course.id, !isBookmarked)}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={24}
            color={isBookmarked ? "#FF6B6B" : "#FFFFFF"}
          />
        </TouchableOpacity>
      </View>

      {/* Card body */}
      <View className="p-3">
        <Text className="text-base font-bold text-gray-900 mb-1" numberOfLines={2}>
          {course.title}
        </Text>

        {showInstructor && course.instructor && (
          <View className="flex-row items-center mb-1.5 gap-2">
            <Image
              source={
                course.instructor.image
                  ? { uri: course.instructor.image }
                  : PLACEHOLDER
              }
              style={{ width: 24, height: 24, borderRadius: 12 }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            <Text className="text-xs text-gray-500 flex-1" numberOfLines={1}>
              {`${course.instructor.firstName} ${course.instructor.lastName}`}
            </Text>
          </View>
        )}

        <Text className="text-xs text-gray-400 leading-4 mb-2" numberOfLines={2}>
          {course.description}
        </Text>

        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-1">
            <MaterialIcons name="star" size={16} color="#FFB81C" />
            <Text className="text-xs text-gray-600 font-semibold">
              {course.rating?.toFixed(1) ?? "4.5"}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <MaterialIcons name="people" size={16} color="#666" />
            <Text className="text-xs text-gray-600">
              {course.enrolledCount ?? 0}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const CourseCard = memo(CourseCardInner);


