import nodemailer from "nodemailer"
import dotenv from "dotenv";

dotenv.config()


//Create transporter
const transporter = nodemailer.createTransport({
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


export const sendNotificationEmail = async (email: string, subject: string,fullName:string, message: string) => {
    try {
        const transporter = nodemailer.createTransport({
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
        }

        const mailResponse = await transporter.sendMail(mailOptions);

        if (mailResponse.accepted.length > 0) {
            return "Notification email sent Successfully"
        } else if (mailResponse.rejected.length > 0) {
            return "Notification email not sent, please try again"
        } else {
            return "Email server error"
        }

    } catch (error) {
        return "Email server error"
    }
}