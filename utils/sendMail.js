import emailService from "./nodemailer.js";
import dotenv from "dotenv";
import cryptoRandomString, { async } from "crypto-random-string";
import { Code } from "../models/secretCode.js";

dotenv.config();

// send activation email
export const sendActivationEmail = async(name, id) =>{
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

// send reset password email
export const sendResetPasswordEmail= async(useremail,token) =>{
  try{    
      const resetPasswordURL = `${process.env.CLIENT_URL}/resetuserpassword?token=${token}&username=${useremail}` 
      const mailOption = {
          from: process.env.EMAIL_USERNAME,
          to: useremail,
          subject: "VietIdols reset your password",
          text: `Please click on the following link within the next 20 minutes to reset your account password on VietIdols ${resetPasswordURL} 
                  If you didn't reset your password then you can ignore this email!`,
          html: `<p>Please click on the following link within the next 20 minutes to reset your account password on VietIdols: <strong><a href="${resetPasswordURL}" target="_blank">Link</a></strong> 
                  If you didn't reset your password then you can ignore this email!</p>`
      }
      console.log("send email reset password to user")
      await emailService.sendMail(mailOption)

  }
  catch (error){
      console.log("error happen at sendReset Password email "+error)
      throw 'error happen at sendReset Password email '+error;
  }
}



