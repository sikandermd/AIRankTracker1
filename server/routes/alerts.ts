import { Router } from "express";
import { storage } from "../storage";
import { insertAlertSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

const router = Router();

// GET /api/alerts - Get all alerts
router.get("/", async (req, res) => {
  try {
    const alerts = await storage.getAllAlerts();
    res.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

// GET /api/alerts/:id - Get single alert
router.get("/:id", async (req, res) => {
  try {
    const alert = await storage.getAlert(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }
    res.json(alert);
  } catch (error) {
    console.error("Error fetching alert:", error);
    res.status(500).json({ error: "Failed to fetch alert" });
  }
});

// POST /api/alerts - Create new alert
router.post("/", async (req, res) => {
  try {
    const validatedData = insertAlertSchema.parse(req.body);
    const alert = await storage.createAlert(validatedData);
    res.status(201).json(alert);
  } catch (error: any) {
    console.error("Error creating alert:", error);
    
    if (error.name === "ZodError") {
      const validationError = fromZodError(error);
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validationError.message 
      });
    }
    
    res.status(500).json({ error: "Failed to create alert" });
  }
});

// PUT /api/alerts/:id - Update alert
router.put("/:id", async (req, res) => {
  try {
    const alert = await storage.getAlert(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    const validatedData = insertAlertSchema.partial().parse(req.body);
    const updatedAlert = await storage.updateAlert(req.params.id, validatedData);
    res.json(updatedAlert);
  } catch (error: any) {
    console.error("Error updating alert:", error);
    
    if (error.name === "ZodError") {
      const validationError = fromZodError(error);
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validationError.message 
      });
    }
    
    res.status(500).json({ error: "Failed to update alert" });
  }
});

// DELETE /api/alerts/:id - Delete alert
router.delete("/:id", async (req, res) => {
  try {
    const alert = await storage.getAlert(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    await storage.deleteAlert(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting alert:", error);
    res.status(500).json({ error: "Failed to delete alert" });
  }
});

// GET /api/alerts/:id/logs - Get alert logs
router.get("/:id/logs", async (req, res) => {
  try {
    const alert = await storage.getAlert(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    const logs = await storage.getAlertLogs(req.params.id);
    res.json(logs);
  } catch (error) {
    console.error("Error fetching alert logs:", error);
    res.status(500).json({ error: "Failed to fetch alert logs" });
  }
});

export default router;