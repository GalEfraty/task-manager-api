const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = mongoose.Schema({
    name: {
            type: String,
            required: true,
            trim: true
    },
    email:{
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value))
            {
                throw Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value){
            if(value.toLowerCase().includes('password'))
            {
                throw Error('password cannot contain "password".')
            }
        }
    },
    age: 
    {
        type: Number,
        default: 0,
        validator(value)
        {
            if(value < 0)
            {
                throw Error('Age must be a positive number')
            }
        }
    },
    tokens: [{
            token: 
            {
                type: String,
                required: true
            }
        }
    ],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

//virtual property: this property desnt store in the DB, its a relationship between 2 entities: User and Task
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

//get a public profile of the instance of User (without the password and tokens)
/*in this function we override the toJSON method that mongoose use
to a method that extracts the private properties of the User model
behinde the scene when we call res.send(user) mongoose call that function*/
userSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

//create token **//methods: methods of a specific instance of the schema
userSchema.methods.generateAuthToken = async function(){
    const user = this
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({token})
    await user.save()

    return token
}

//find user by email and password **//statics = the schema methods
userSchema.statics.findByCredentials = async (email, password) =>
{
    const user = await User.findOne({email})
    if (!user)
    {
        throw Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch){
        throw Error('Unable to login')
    }

    return user
}

//Express Middlewhere: hash the plain text password before saving
userSchema.pre('save', async function (next){
    const user = this

    if(user.isModified('password')) //gonna be true if its a new user or updated
    {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()//when the process is done - do the saving
})

//Express Middlewhere: delete the user's tasks when user remove
userSchema.pre('remove', async function(next){
    const user = this
    await Task.deleteMany({owner: user._id})
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User
