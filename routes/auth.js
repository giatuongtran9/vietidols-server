import express from 'express'
import jwt from 'jsonwebtoken'
import cryptoRandomString from 'crypto-random-string'
import dotenv from 'dotenv'
import { Users } from '../models/Users.js'
import { Code } from '../models/secretCode.js'
import { ResetToken } from '../models/Token.js'
import emailService from '../utils/nodemailer.js'
import bcrypt from 'bcrypt'
const router = express.Router()

const saltRounds = 10
dotenv.config()
//SignUp
router.post('/signup',
    async (req, res) => {

        try {
            let user = await Users.findOne({ name: req.body.name})

            if (user) {
                return res.status(400).json({ errors: 'Email is registered already'})
            }

            let hashPass = bcrypt.hashSync(req.body.password,saltRounds)
            console.log("password before has "+req.body.password)
            console.log("password after hash "+hashPass)
            user = new Users({
                name: req.body.name,
                password: hashPass
            })
            const newUser = new Users({
                name: req.body.name,
                password: req.body.password
            })

            const users = await newUser.save()
            
            const secretCode = cryptoRandomString({ length: 6 })

            const newCode = new Code({
                code: secretCode,
                email: users.name
            })

            await newCode.save()

            const mailOption = {
                from: process.env.EMAIL_USERNAME,
                to: users.name,
                subject: "Activation Link to VietIdols",
                text: `Please click on the following link within the next 20 minutes to activate your account on VietIdols: ${process.env.BASE_URL}/auth/verify-account/${users._id}/${secretCode}`,
                html: `<p>Please click on the following link within the next 20 minutes to activate your account on VietIdols: <strong><a href="${process.env.BASE_URL}/auth/verify-account/${users._id}/${secretCode}" target="_blank">Link</a></strong></p>`
            }

            await emailService.sendMail(mailOption)

            res.json({
                userRole: users.role,
                userId: users._id,
                userStatus: users.status
            })
        } catch (error) {
            res.status(404).json({ errors: error.message})
        }
    }
)

//SignIn
router.post('/signin', async (req, res) => {
    try {
        let user = await Users.findOne({name: req.body.name})
        
        if (!user) {
            return res.status(400).json({ errors: 'Invalid Credentials'})
        }

      // const isMatch = user.password === req.body.password ? true : false
       // using bcypt to compare the haspassword
       const isMatch = bcrypt.compareSync(req.body.password,user.password)
        if (!isMatch) {
            return res.status(401).json({ errors: 'Invalid Credentials'})
        }

        const payload = {
            user: {
                id: user.id
            }
        }

        var token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h'})

        res.status(200).send({
            id: user.id,
            name: user.name,
            role: user.role,
            token: token
        })
    } catch (error) {
        res.status(404).json({ errors: error.message})
    }
})


// Verify user's email 
router.get('/verify-account/:userId/:secretCode', async (req, res) => {
    try {
        const user = await Users.findById(req.params.userId)

        const user_secretCode = await Code.findOne({
            email: user.name,
            code: req.params.secretCode
        })

        if (!user) {
            res.sendStatus(401)
        } else {
            await user.updateOne({
                name: user.name,
                status: 'active'
            })

            await Code.deleteMany({ email: user.name })

            res.redirect(`https://vietidols`)
        }
    } catch (error) {
        res.status(404).json({ errors: error.message})
    }
})


//Reset the password we will use gmail to 
router.post('/forgotpassword', async (req, res) => {
    try {
        let user = await Users.findOne({name: req.body.name})
        
        if (!user) {
            return res.status(400).json({ errors: 'We can not find the username '+req.body.name+' on our system'})
        }
        let token = await ResetToken.findOne({email: req.body.name})
        if (token) await token.deleteOne();
        let resetPasswordToken = cryptoRandomString({ length: 32 })
        const hashToken = bcrypt.hashSync(resetPasswordToken,saltRounds)
        const newToken = new ResetToken({
            email: req.body.name,
            token : hashToken
        })
        await newToken.save()
        await sendresetPasswordEmail(newToken.email,resetPasswordToken)

        res.status(200).send({
            name: newToken.email,
            token: resetPasswordToken
        })

    } catch (error) {
        res.status(404).json({ errors: error.message})
    }
})

router.post('/resetuserpassword', async (req, res) => {
    try {
        let user = await Users.findOne({name: req.body.name})
        
        if (!user) {
            return res.status(400).json({ errors: 'We can not find the username '+req.body.name+' on our system'})
        }
        let token = await UserToken.findOne({email: req.body.name})
        const isMatch = bcrypt.compareSync(req.body.token,token.token)
        if (!isMatch) {
            return res.status(401).json({ errors: 'Invalid Reset Password Token'})
        }
        let hashpass = bcrypt.hashSync(req.body.password,saltRounds)
        
        await Users.updateOne(
            { _id: user._id },
            { $set: { password:hashpass } }
            )

        res.status(200).send({
            id: user.id,
            name: user.name
        })

    } catch (error) {
        res.status(404).json({ errors: error.message})
    }
})

async function sendresetPasswordEmail(useremail,token){
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


export default router
