import { Router, Request, Response } from "express";
import { saveSubscription, getVapidPublicKey } from "../services/notifications.js";

const router = Router();

router.get("/vapid-key", (_req: Request, res: Response) => {
  const key = getVapidPublicKey();
  if (!key) {
    return res.json({ publicKey: null, enabled: false });
  }
  return res.json({ publicKey: key, enabled: true });
});

router.post("/subscribe", async (req: Request, res: Response) => {
  try {
    const { subscription, preferences = ["all"] } = req.body;
    if (!subscription) {
      return res.status(400).json({ error: "subscription is required" });
    }
    const id = await saveSubscription(subscription, preferences);
    return res.json({ id, message: "Subscribed to notifications" });
  } catch (err) {
    console.error("[Notifications] Subscribe error:", err);
    return res.status(500).json({ error: "Failed to save subscription" });
  }
});

export default router;
