const express = require('express')
const sharp = require('sharp')
const multer = require('multer')
const User = require('../models/user')
const auth = require('../middleware/auth')
const {sendWelcomeEmail, sendCancelEmail} = require('../emails/account') // use destrcuturing
const router = new express.Router()

router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    } catch (e) {
        res.status(400).send(e)
    }
})

        /* user.save().then(() => {
            res.status(201).send(user)
        }).catch((e) => {
            res.status(400).send(e)
        }) */

        router.post('/users/login', async (req, res) => {
            try {
                const user = await User.findByCredentials(req.body.email, req.body.password) // this will call whatever is defined on userSchema.statics.findByCredentials in user model
                const token = await user.generateAuthToken()
                res.send({user, token})
            } catch (e) {
                res.status(400).send()
            }
        })

        router.post('/users/logout', auth , async (req, res) => {
            try {
                // delete the token we used to login from the tokens array
                req.user.tokens = req.user.tokens.filter((token) => { // fill out the tokens array with the tokens we are not looking for
                    return token.token !== req.token // filter out the authentication token we were looking for and remove it
                })

                await req.user.save() // save the changes (changed array)
                res.send()
            } catch(e) {
                res.status(500).send()
            }
        })
        
        router.post('/users/logoutAll', auth, async (req,res) => {
            try{
                req.user.tokens = []
                await req.user.save()
                res.send()
            } catch(e) {
                res.status(500).send()
            }
        })
        
        router.get('/users/me', auth, async (req, res) => {
            res.send(req.user)
        })

router.patch('/users/me', auth, async (req,res) => {
        // req.body is an object with all of those updates
        const updates = Object.keys(req.body) // convert our object into an array of its properties
        const allowUpdates = ['name', 'email', 'password', 'age'] // list out the individual properties we would like someone to be able to change
        const isValidOperation = updates.every((update) => allowUpdates.includes(update)) // equal to: return allowUpdates.includes(update))
        
        if(!isValidOperation){
            return res.status(400).send({error: 'Invalid updates'})
        }

    try {
        // make sure the middleware fires up consistenly 
        // we do it in the old way because we use save() method, the same we use in user.js/models userSchema.pre('save'.....)

        updates.forEach((update) => req.user[update] = req.body[update]) //shorthand arrow function
        await req.user.save()
        res.send(req.user)
    } catch(e) {
        res.status(400).send(e)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try{
        await req.user.remove()
        sendCancelEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})  
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('You must upload an image'))
        }
        cb(undefined, true)
    }
})
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
},(error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.delete('/users/me/avatar', auth, async (req,res) => {
    if(!req.user.avatar){
       return res.status(404).send()
    }
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async(req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw new Error()
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch(e) {
        res.status(404).send()
    }
})

module.exports = router