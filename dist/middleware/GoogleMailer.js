"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
//Create transporter
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    secure: true,
    auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_PASSWORD
    }
});
// transporter.sendMail({
//     from: `My NodeMailer ${process.env.EMAIL_SENDER}`,
//     to:'wachira.denis@teach2give.com',
//     subject: "Test Email",
//     text: "Hello from your SMTP MAILER"
// },(err,info)=>{
//     if(err) return console.error(err);
//     console.log('Email Sent: ', info.response)
// })
const sendNotificationEmail = async (email, subject, fullName, message) => {
    try {
        const transporter = nodemailer_1.default.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            secure: true,
            auth: {
                user: process.env.EMAIL_SENDER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        const mailOptions = {
            from: process.env.EMAIL_SENDER,
            to: email,
            subject: subject,
            text: `Hey ${message}\n`,
            html: `<html>
        <head>
        <style>
            .email-container {
              font-family: Arial, sans-serif;
              background-color: #f9f9f9;
              padding: 20px;
              border-radius: 5px;
            }            
          </style>
        </head>
        <body>
            <div class="email-container">
            <h2>${subject}</h2>
            <p>Hey ${fullName}, ${message}</p>
             <p>Enjoy Our Services!</p> 
            </div>
        </body>
        </html>
        `,
        };
        const mailResponse = await transporter.sendMail(mailOptions);
        if (mailResponse.accepted.length > 0) {
            return "Notification email sent Successfully";
        }
        else if (mailResponse.rejected.length > 0) {
            return "Notification email not sent, please try again";
        }
        else {
            return "Email server error";
        }
    }
    catch (error) {
        return "Email server error";
    }
};
exports.sendNotificationEmail = sendNotificationEmail;
