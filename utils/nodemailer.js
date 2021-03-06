import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const emailService = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});

export default emailService
