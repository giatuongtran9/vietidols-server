import express from 'express'
import jwt from 'jsonwebtoken'
import { Users } from '../models/Users.js'

const router = express.Router()

//SignUp
router.post('/signup',
    async (req, res) => {

        try {
            let user = await Users.findOne({ name: req.body.name})

            if (user) {
                return res.status(400).json({ errors: 'User already exists'})
            }

            user = new Users({
                name: req.body.name,
                password: req.body.password
            })

            await user.save()

            res.send({ message: 'User was registered successfully'})
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

export default router
