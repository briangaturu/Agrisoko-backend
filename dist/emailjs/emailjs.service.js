"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailWithEmailJS = void 0;
const readRequiredEnv = (name) => {
    const raw = process.env[name];
    const cleaned = raw?.trim().replace(/^['"]|['"]$/g, "");
    if (!cleaned) {
        throw new Error(`${name} is missing. Set it in your environment.`);
    }
    return cleaned;
};
const sendEmailWithEmailJS = async ({ templateParams, serviceId, templateId, }) => {
    const resolvedServiceId = serviceId || readRequiredEnv("EMAILJS_SERVICE_ID");
    const resolvedTemplateId = templateId || readRequiredEnv("EMAILJS_TEMPLATE_ID");
    const publicKey = readRequiredEnv("EMAILJS_PUBLIC_KEY");
    const privateKey = readRequiredEnv("EMAILJS_PRIVATE_KEY");
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            service_id: resolvedServiceId,
            template_id: resolvedTemplateId,
            user_id: publicKey,
            accessToken: privateKey,
            template_params: templateParams,
        }),
    });
    const raw = await response.text();
    if (!response.ok) {
        throw new Error(`EmailJS API error ${response.status}: ${raw}`);
    }
    return raw;
};
exports.sendEmailWithEmailJS = sendEmailWithEmailJS;
