import express from 'express'
import jwt from 'jsonwebtoken'
import cryptoRandomString from 'crypto-random-string'
import dotenv from 'dotenv'
import { Users } from '../models/Users.js'
import { Code } from '../models/secretCode.js'
import {sendActivationEmail,sendResetPasswordEmail} from "../utils/sendMail.js";
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
         
            const newUser = new Users({
                name: req.body.name,
                password: hashPass
            })

            const users = await newUser.save()
      
            await sendActivationEmail(users.name, users._id);
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
router.get("/verify-account/:userId/:secretCode", async (req, res) => {
  try {
    const user = await Users.findById(req.params.userId);

    const user_secretCode = await Code.findOne({
      email: user.name,
      code: req.params.secretCode,
    });

    if (!user || !user_secretCode) {
      res.sendStatus(401);
    } else {
      await user.updateOne({
        name: user.name,
        status: "active",
      });

      await Code.deleteMany({ email: user.name });

      res.sendStatus(200);
    }
  } catch (error) {
    res.status(404).json({ errors: error.message });
  }
});

router.get("/send-link/:userId", async (req, res) => {
  try {
    const user = await Users.findById(req.params.userId);
    console.log(user);

    if (!user) {
      res.sendStatus(401);
    } else {
      await sendMail(user.name, user._id);
      res.sendStatus(200);
    }
  } catch (error) {
    res.status(404).json({ errors: error.message });
  }
});


//Reset the password we will use gmail to 
router.post('/forgotpassword', async (req, res) => {
    try {
        let user = await Users.findOne({name: req.body.name})
        
        if (!user) {
            return res.status(400).json({ errors: 'We can not find the username '+req.body.name+' on our system'})
        }
        let token = await Code.findOne({email: req.body.name})
        if (token) await token.deleteOne();
        let resetPasswordToken = cryptoRandomString({ length: 32 })
        const hashToken = bcrypt.hashSync(resetPasswordToken,saltRounds)
        const newToken = new Code({
            email: req.body.name,
            code : hashToken
        })
        await newToken.save()
        await sendResetPasswordEmail(newToken.email,resetPasswordToken)

        res.status(200).send({
            email: newToken.email,
            code: resetPasswordToken
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
        let token = await Code.findOne({email: req.body.name})
        const isMatch = bcrypt.compareSync(req.body.token,token.code)
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


export default router;
