/**
 * Notification Utilities
 * Handle local notifications for bookmarks and reminders
 */

import { NotificationPayload } from "@/src/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addNotificationResponseReceivedListener,
  AndroidImportance,
  cancelAllScheduledNotificationsAsync,
  cancelScheduledNotificationAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from "expo-notifications";
import { Platform } from "react-native";

const LAST_OPEN_KEY = "last_app_open";
const REMINDER_ID_KEY = "reminder_notification_id";

// Configure how notifications behave when app is in foreground
setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private isInitialized = false;

  /**
   * Initialize notifications – request permission, set up Android channel,
   * register response listener, and schedule the 24-hour reminder.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const { status } = await getPermissionsAsync();

      if (status !== "granted") {
        const { status: newStatus } = await requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: true, allowSound: true },
        });
        if (newStatus !== "granted") {
          return;
        }
      }

      // Android notification channel
      if (Platform.OS === "android") {
        await setNotificationChannelAsync("default", {
          name: "Default",
          importance: AndroidImportance.HIGH,
          sound: "default",
        });
      }

      this.setupResponseListener();
      this.isInitialized = true;

      // Record this open and schedule the 24-hour inactivity reminder
      await this.recordAppOpen();
    } catch {
      // Notifications are non-critical; silently continue
    }
  }

  /**
   * Send an immediate local notification (fires ~1 s after scheduling)
   */
  async sendNotification(payload: NotificationPayload): Promise<string> {
    // Ensure initialized (permissions granted) before scheduling
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (!this.isInitialized) {
      throw new Error("Notification permission not granted");
    }

    const notificationId = await scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
        sound: "default",
        // Android 8+ requires a channel ID matching a created channel
        ...(Platform.OS === "android" && { android: { channelId: "default" } }),
      },
      trigger: {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
      },
    });

    return notificationId;
  }

  /**
   * Schedule a notification after `delaySeconds`
   */
  async sendScheduledNotification(
    payload: NotificationPayload,
    delaySeconds: number
  ): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (!this.isInitialized) {
      throw new Error("Notification permission not granted");
    }

    const notificationId = await scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
        sound: "default",
        ...(Platform.OS === "android" && { android: { channelId: "default" } }),
      },
      trigger: {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: delaySeconds,
      },
    });

    return notificationId;
  }

  /**
   * Record app open time and reschedule the 24-hour inactivity reminder.
   */
  async recordAppOpen(): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_OPEN_KEY, Date.now().toString());

      // Cancel existing reminder
      const existingId = await AsyncStorage.getItem(REMINDER_ID_KEY);
      if (existingId) {
        await this.cancelNotification(existingId);
      }

      // Schedule new 24-hour reminder
      const reminderId = await this.sendScheduledNotification(
        {
          title: "We miss you! 👋",
          body: "You have courses waiting. Come back and keep learning!",
          data: { type: "reminder" },
        },
        86400
      );

      await AsyncStorage.setItem(REMINDER_ID_KEY, reminderId);
    } catch {
      // Non-critical
    }
  }

  /**
   * Cancel a scheduled notification by id
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await cancelScheduledNotificationAsync(notificationId);
    } catch {
      // Ignore
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await cancelAllScheduledNotificationsAsync();
    } catch {
      // Ignore
    }
  }

  /**
   * Register a listener for when the user taps a notification
   */
  private setupResponseListener(): void {
    addNotificationResponseReceivedListener((response) => {
      // Future: navigate to relevant screen based on response.notification.request.content.data
      void response;
    });
  }
}

export default new NotificationService();
