import mongoose from 'mongoose'

const Token = new mongoose.Schema({
    email: {
        type: String,
        require: true
    },
    token: {
        type: String,
        require: true
    },
    dateCreated: {
        type: Date,
        default: Date.now(),
        expires: 1200
    }
})

export const ResetToken = mongoose.model('ResetToken', Token)