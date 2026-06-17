import { Request, Response } from "express";
import { sendEmailWithEmailJS } from "./emailjs.service";

export const sendEmail = async (req: Request, res: Response) => {
  try {
    const { templateParams, serviceId, templateId } = req.body;

    if (!templateParams || typeof templateParams !== "object") {
      return res.status(400).json({
        error: "templateParams object is required",
      });
    }

    await sendEmailWithEmailJS({
      templateParams,
      serviceId,
      templateId,
    });

    return res.json({
      message: "Email sent successfully via EmailJS",
    });
  } catch (err: any) {
    console.error("emailjs send error:", err.message);

    if (err.message?.includes("EMAILJS_")) {
      return res.status(503).json({
        error: err.message,
      });
    }

    return res.status(500).json({
      error: err.message || "Failed to send email",
    });
  }
};
