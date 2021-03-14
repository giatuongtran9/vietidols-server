import mongoose from 'mongoose'

const UsersSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'user'
    },
    status: {
        type: String,
        default: 'pending'
    },
    dateCreated: {
        type: Date,
        default: Date.now()
    }
  
})

export const Users = mongoose.model('Users', UsersSchema)