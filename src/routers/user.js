const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const {sendWelcomeEmail, sendCancelationEmail} = require('../emails/account')


//allowing seperate files for each api route (so index.js wont look too long and messy)
const router = new express.Router()

//----USER----//

//create new user - signUp
router.post('/users', async (req, res) => 
{
     const user = new User(req.body)
     try {        
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
     } catch (error) {
        res.status(400).send(error)
     }
})

//find a user by email and password / login
router.post('/users/login', async (req, res) =>{
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)

        //create token
        const token = await user.generateAuthToken()
        res.send({user , token})
    } catch (error) {
        res.status(400).send()
    }
})

//logout
router.post('/users/logout', auth, async (req, res) =>{
    try {
        req.user.tokens = req.user.tokens.filter((token) =>{
            return token.token !== req.token
        })

        await req.user.save()

        res.send()
    } catch (error) {
        res.status(500).send()
    }
})

//logout *all* tokens
router.post('/users/logoutAll', auth, async (req, res) =>{
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (error) {
        res.status(500).send()
    }
})

//get users
router.get('/users/me', auth, async (req, res) => 
{
    res.send(req.user)
})

//update-patch user
router.patch('/users/me', auth, async (req, res) =>
{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email','password', 'age',]
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update)
    })

    if(!isValidOperation){
        return res.status(400).send({error: 'invalid updates'})
    }

    try {
        updates.forEach((update) => 
        {
            req.user[update] = req.body[update] //user[update] : kind of reflection 
        })

        req.user.save()
        res.send(req.user)

    } catch (error) {
        res.status(400).send(error)
    }
})

//delete user
router.delete('/users/me', auth, async (req, res) =>
{
    try {
        await req.user.remove()
        sendCancelationEmail(req.user.email, req.user.name)
        res.send(req.user)

    } catch (error) {
        res.status(500).send(error)
    }
})

const upload = multer({
    limits: {fileSize: 1000000},
    fileFilter(req, file, cb){
        //if(!(file.originalname.endsWith('jpg') || file.originalname.endsWith('jpeg') || file.originalname.endsWith('png'))){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){

            return cb(new Error('Please upload an image'), false)
        }
        return cb(undefined, true)
    }
})

//upload a profile picture
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) =>
{
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()

}, (error, req, res, next) =>{
    res.status(400).send({error: error.message})
})

//delete profile picture
router.delete('/users/me/avatar', auth, async (req, res) =>
{
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

//get a user profile picture
router.get('/users/:id/avatar', async (req, res) => 
{
    try {
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar)
        {
            throw Error('user not found/ no image')
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (error) {
        res.status(404).send({error: error.message})
    }
})

//--export--\\
module.exports = router