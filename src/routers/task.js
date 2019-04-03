const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()


router.post('/tasks', auth, async (req, res) => {
    const task = new Task ({
        ...req.body, 
        owner: req.user._id 
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch(e) {
        res.status(400).send(e)
    }
})
router.get('/tasks', auth, async (req,res) => {  
    const match = {}
    const sort = {}

    if(req.query.completed === 'true' || req.query.completed === 'false'){
        match.completed = req.query.completed === 'true'
    }

    if(req.query.sortBy){
        const parts = req.query.sortBy.split('-')
        sort[parts[0]] = parts[1] === 'asc' ? 1 : -1
    }

    try {
        //const tasks = await Task.find({owner: req.user._id})
        await req.user.populate({
            path: 'myTasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.myTasks)
    } catch(e) {
        res.status(500).send()
    }
})

router.get('/tasks/:id', auth, async (req,res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOne({_id, owner: req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    } catch(e) {
        res.status(500).send()
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send({error : 'Invaild Updates'})
    }

    try {
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id })

        if(!task){
            return res.status(404).send()
        }
        updates.forEach((update) => task[update] = req.body[update])
        await task.save() 
        res.send(task)
    } catch(e) {
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req,res) => {
    try{
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id })
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    } catch(e) {
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

router.post('/tasks/:id/avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        const task = await Task.findOne({_id : req.params.id, owner: req.user._id})
        const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
        task.avatar = buffer
        await task.save()
        res.send()
    } catch (e) {
        res.status(404).send()
    }
},(error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.delete('/tasks/:id/avatar', auth, async (req,res) => {
    try{
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
        if(!task || !task.avatar){
            throw new Error()
        }
        task.avatar = undefined
        await task.save()
        res.send()
    } catch(e) {
        res.status(404).send()
    }
})

router.get('/tasks/:id/avatar', async(req, res) => {
    try {
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
        if(!task || !task.avatar){
            throw new Error()
        }
        res.set('Content-Type', 'image/png')
        res.send(task.avatar)
    } catch(e) {
        res.status(404).send()
    }
})

module.exports = router