import express from 'express'
import jwt from 'jsonwebtoken'
import { Users } from '../models/Users'
import { check, validationResult } from 'express-validator'

const router = express.Router()

//SignUp
router.post('/signup',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('password', 'Please enter a password with 3 or more characters').isLength({min: 3})
    ],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

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
            return res.status(400).json({ errors: 'Invalid Credentials'})
        }

        const payload = {
            user: {
                id: user.id
            }
        }

        var token = jwt.sign(payload, 'MySecret', { expiresIn: '1h'})

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
