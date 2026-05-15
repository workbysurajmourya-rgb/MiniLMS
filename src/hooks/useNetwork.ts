/**
 * Custom Hooks for Network and App State
 */

import { useEffect, useState } from "react";
import { useAppStateStore } from "@/src/store/appStateStore";
import NetworkService from "@/src/utils/network";
import NotificationService from "@/src/utils/notifications";

/**
 * Hook to monitor network connectivity
 */
export const useNetworkMonitoring = () => {
  const { isOnline, setIsOnline } = useAppStateStore();
  const [isNetworkInitialized, setIsNetworkInitialized] = useState(false);

  useEffect(() => {
    const initNetworkMonitoring = async () => {
      try {
        await NetworkService.initialize();
        const onlineStatus = await NetworkService.isOnline();
        setIsOnline(onlineStatus);
        setIsNetworkInitialized(true);
      } catch (error) {
        console.error("Error initializing network monitoring:", error);
        setIsNetworkInitialized(true);
      }
    };

    initNetworkMonitoring();

    return () => {
      NetworkService.cleanup();
    };
  }, [setIsOnline]);

  return {
    isOnline,
    isInitialized: isNetworkInitialized,
  };
};

/**
 * Hook to initialize notifications
 */
export const useNotifications = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);

  useEffect(() => {
    const initNotifications = async () => {
      try {
        await NotificationService.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing notifications:", error);
        setIsInitialized(true);
      }
    };

    initNotifications();
  }, []);

  const sendNotification = async (title: string, body: string) => {
    try {
      const id = await NotificationService.sendNotification({
        title,
        body,
      });
      setLastNotificationId(id);
      return id;
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  };

  return {
    isInitialized,
    sendNotification,
    lastNotificationId,
  };
};
