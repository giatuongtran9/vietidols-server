import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'

import authRoutes from './routes/auth.js'

const app = express()
app.use(cors())

dotenv.config()

app.use(bodyParser.json({ limit: "30mb", extended: true}));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true}));

app.use('/auth', authRoutes)

app.get('/', (req, res) => {
    res.send('Hello from VietsIdol API')
})

const PORT = process.env.PORT || 8000

mongoose.connect(process.env.CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
    .catch((error) => console.log(error.message))

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true)