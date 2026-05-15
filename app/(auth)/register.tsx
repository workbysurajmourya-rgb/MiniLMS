/**
 * Register Screen
 */

import { ErrorBanner, OfflineBanner } from "@/src/components";
import { useAppStateStore } from "@/src/store/appStateStore";
import { useAuthStore } from "@/src/store/authStore";
import ErrorHandler from "@/src/utils/errors";
import { RegisterFormData, registerSchema } from "@/src/utils/validation";
import { MaterialIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error: authError } = useAuthStore();
  const { isOnline, errorMessage, setErrorMessage } = useAppStateStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", firstName: "", lastName: "", confirmPassword: "" },
  });

  const onSubmit = async (data: RegisterFormData) => {
    if (!isOnline) {
      setErrorMessage("You are offline. Please check your connection.");
      return;
    }
    try {
      await register(data.email, data.password, data.firstName, data.lastName);
      router.replace("/(tabs)");
    } catch (error) {
      const apiError = ErrorHandler.handleApiError(error);
      setErrorMessage(ErrorHandler.getUserMessage(apiError));
    }
  };

  const Field = ({
    label,
    name,
    placeholder,
    icon,
    secure,
    showToggle,
    toggleVisible,
    onToggle,
    keyboardType,
    error: fieldError,
  }: {
    label: string;
    name: keyof RegisterFormData;
    placeholder: string;
    icon: React.ComponentProps<typeof MaterialIcons>["name"];
    secure?: boolean;
    showToggle?: boolean;
    toggleVisible?: boolean;
    onToggle?: () => void;
    keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
    error?: string;
  }) => (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-800 mb-2">{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50">
            <MaterialIcons name={icon} size={20} color="#999" style={{ marginLeft: 12 }} />
            <TextInput
              className="flex-1 py-3 px-3 text-base text-gray-800"
              placeholder={placeholder}
              placeholderTextColor="#CCC"
              value={value}
              onChangeText={onChange}
              secureTextEntry={secure && !toggleVisible}
              keyboardType={keyboardType}
              autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
              editable={!isLoading}
            />
            {showToggle && (
              <TouchableOpacity onPress={onToggle} className="p-3">
                <MaterialIcons
                  name={toggleVisible ? "visibility" : "visibility-off"}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      />
      {fieldError && <Text className="text-red-500 text-xs mt-1">{fieldError}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <OfflineBanner isOnline={isOnline} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {(authError || errorMessage) && (
          <ErrorBanner
            message={authError || errorMessage || undefined}
            onDismiss={() => setErrorMessage(null)}
            severity="error"
          />
        )}

        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900">Create Account</Text>
          <Text className="text-base text-gray-400 mt-2">Join our learning community</Text>
        </View>

        <View className="mb-6">
          <Field label="First Name" name="firstName" placeholder="John" icon="person" />
          <Field label="Last Name" name="lastName" placeholder="Doe" icon="person" />
          <Field
            label="Email Address"
            name="email"
            placeholder="you@example.com"
            icon="email"
            keyboardType="email-address"
            error={errors.email?.message}
          />
          <Field
            label="Password"
            name="password"
            placeholder="••••••••"
            icon="lock"
            secure
            showToggle
            toggleVisible={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
            error={errors.password?.message}
          />
          <Field
            label="Confirm Password"
            name="confirmPassword"
            placeholder="••••••••"
            icon="lock"
            secure
            showToggle
            toggleVisible={showConfirmPassword}
            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
            error={errors.confirmPassword?.message}
          />

          <TouchableOpacity
            className={`py-3.5 rounded-xl items-center justify-center mt-2 ${isLoading ? "opacity-60 bg-primary" : "bg-primary"}`}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-semibold">Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center items-center mt-auto">
          <Text className="text-sm text-gray-500">Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-sm font-semibold text-primary">Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

