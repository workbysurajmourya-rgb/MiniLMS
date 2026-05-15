/**
 * Login Screen
 */

import { ErrorBanner, OfflineBanner } from "@/src/components";
import { useAppStateStore } from "@/src/store/appStateStore";
import { useAuthStore } from "@/src/store/authStore";
import ErrorHandler from "@/src/utils/errors";
import { LoginFormData, loginSchema } from "@/src/utils/validation";
import { MaterialIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import * as LocalAuthentication from "expo-local-authentication";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error: authError } = useAuthStore();
  const { isOnline, errorMessage, setErrorMessage } = useAppStateStore();
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    })();
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    if (!isOnline) {
      setErrorMessage("You are offline. Please check your connection.");
      return;
    }
    try {
      await login(data.email, data.password);
      router.replace("/(tabs)");
    } catch (error) {
      const apiError = ErrorHandler.handleApiError(error);
      setErrorMessage(ErrorHandler.getUserMessage(apiError));
    }
  };

  const handleBiometricLogin = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to sign in",
      fallbackLabel: "Use Password",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });

    if (result.success) {

      const { token, isAuthenticated } = useAuthStore.getState();
      if (token && isAuthenticated) {
        router.replace("/(tabs)");
      } else {
        Alert.alert(
          "No Saved Session",
          "Please sign in with your email and password first to enable biometric login."
        );
      }
    } else if (result.error !== "user_cancel" && result.error !== "system_cancel") {
      Alert.alert("Authentication Failed", "Biometric verification was not successful.");
    }
  };

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

        {/* Header */}
        <View className="mb-10">
          <Text className="text-3xl font-bold text-gray-900">Welcome Back</Text>
          <Text className="text-base text-gray-400 mt-2">Sign in to your LMS account</Text>
        </View>

        <View className="mb-6">
          {/* Email */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-800 mb-2">Email Address</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50">
                  <MaterialIcons name="email" size={20} color="#999" style={{ marginLeft: 12 }} />
                  <TextInput
                    className="flex-1 py-3 px-3 text-base text-gray-800"
                    placeholder="you@example.com"
                    placeholderTextColor="#CCC"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>
              )}
            />
            {errors.email && (
              <Text className="text-red-500 text-xs mt-1">{errors.email.message}</Text>
            )}
          </View>

          {/* Password */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-800 mb-2">Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50">
                  <MaterialIcons name="lock" size={20} color="#999" style={{ marginLeft: 12 }} />
                  <TextInput
                    className="flex-1 py-3 px-3 text-base text-gray-800"
                    placeholder="Enter your password"
                    placeholderTextColor="#CCC"
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="p-3"
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility" : "visibility-off"}
                      size={20}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && (
              <Text className="text-red-500 text-xs mt-1">{errors.password.message}</Text>
            )}
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            className={`py-3.5 rounded-xl items-center justify-center mt-2 ${
              isLoading ? "opacity-60 bg-primary" : "bg-primary"
            }`}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-semibold">Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity className="items-center mt-4">
            <Text className="text-primary text-sm font-medium">Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Biometric Login */}
        {biometricAvailable && (
          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl mb-6"
            onPress={handleBiometricLogin}
            activeOpacity={0.7}
          >
            <MaterialIcons name="fingerprint" size={24} color="#007AFF" />
            <Text className="text-primary font-medium">Sign in with Biometrics</Text>
          </TouchableOpacity>
        )}

        {/* Register Link */}
        <View className="flex-row justify-center items-center mt-auto">
          <Text className="text-sm text-gray-500">Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text className="text-sm font-semibold text-primary">Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
