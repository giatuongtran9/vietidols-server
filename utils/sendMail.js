import emailService from "./nodemailer.js";
import dotenv from "dotenv";

dotenv.config();

const sendMail = async (name, id, secretCode) => {
  const mailOption = {
    from: process.env.EMAIL_USERNAME,
    to: name,
    subject: "Activation Link to VietIdols",
    text: `Please click on the following link within the next 20 minutes to activate your account on VietIdols: ${process.env.CLIENT_URL}/verify-account/${id}/${secretCode}`,
    html: `<p>Please click on the following link within the next 20 minutes to activate your account on VietIdols: <a href="${process.env.CLIENT_URL}/verify-account/${id}/${secretCode}" target="_blank">Click here!</a></p>`,
  };

  await emailService.sendMail(mailOption);
};

export default sendMail;
