const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const Task = require('../models/task')

router.post('/tasks', auth, async (req, res) => {
    // const task = new Task(req.body)
    const task = new Task ({
        ...req.body, // copies all the properties from body over to this object
        owner: req.user._id // the person that just authenticated
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch(e) {
        res.status(400).send(e)
    }
})
// GET /tasks?completed=true
// GET /tasks?limit=6&skip=4
// GET /tasks?sortBy=createdAt-asc
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

module.exports = router