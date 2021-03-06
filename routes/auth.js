import express from 'express'
import jwt from 'jsonwebtoken'
import cryptoRandomString from 'crypto-random-string'
import dotenv from 'dotenv'
import { Users } from '../models/Users.js'
import { Code } from '../models/secretCode.js'
import emailService from '../utils/nodemailer.js'

const router = express.Router()
dotenv.config()
//SignUp
router.post('/signup',
    async (req, res) => {

        try {
            let user = await Users.findOne({ name: req.body.name})

            if (user) {
                return res.status(400).json({ errors: 'Email is registered already'})
            }

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

        const isMatch = user.password === req.body.password ? true : false

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

export default router
