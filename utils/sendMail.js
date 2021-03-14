import emailService from "./nodemailer.js";
import dotenv from "dotenv";
import cryptoRandomString from "crypto-random-string";
import { Code } from "../models/secretCode.js";

dotenv.config();

const sendMail = async (name, id) => {
  const secretCode = cryptoRandomString({ length: 6 });

  const newCode = new Code({
    code: secretCode,
    email: name,
  });

  await newCode.save();

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
