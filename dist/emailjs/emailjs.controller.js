"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const emailjs_service_1 = require("./emailjs.service");
const sendEmail = async (req, res) => {
    try {
        const { templateParams, serviceId, templateId } = req.body;
        if (!templateParams || typeof templateParams !== "object") {
            return res.status(400).json({
                error: "templateParams object is required",
            });
        }
        await (0, emailjs_service_1.sendEmailWithEmailJS)({
            templateParams,
            serviceId,
            templateId,
        });
        return res.json({
            message: "Email sent successfully via EmailJS",
        });
    }
    catch (err) {
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
exports.sendEmail = sendEmail;
