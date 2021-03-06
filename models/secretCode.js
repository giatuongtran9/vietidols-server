import mongoose from 'mongoose'

const secretCode = new mongoose.Schema({
    email: {
        type: String,
        require: true
    },
    code: {
        type: String,
        require: true
    },
    dateCreated: {
        type: Date,
        default: Date.now(),
        expires: 1200
    }
})

export const Code = mongoose.model('Code', secretCode)