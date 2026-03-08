import { useState, useEffect } from "react";
import { api } from "../services/api";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const arr = Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength);
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported("Notification" in window && "serviceWorker" in navigator);
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (preferences: string[] = ["all"]): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") return false;

      const { publicKey, enabled } = await api.notifications.getVapidKey();
      if (!enabled || !publicKey) {
        new Notification("NYC Pulse Notifications Enabled! 🗽", {
          body: "You'll get notified about show lotteries and events.",
          icon: "/icons/icon-192.png",
        });
        return true;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await api.notifications.subscribe(subscription.toJSON() as PushSubscriptionJSON, preferences);
      return true;
    } catch (err) {
      console.error("[Notifications] Error:", err);
      return false;
    }
  };

  const showLocalNotification = (title: string, body: string) => {
    if (permission === "granted") {
      new Notification(title, {
        body,
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-72.png",
      });
    }
  };

  return { permission, isSupported, requestPermission, showLocalNotification };
}
