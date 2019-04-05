const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')

//allowing seperate files for each api route (so index.js wont look too long and messy)
const router = new express.Router()

//create new task
router.post('/tasks', auth, async (req, res) =>
{
    const task = new Task({
        ...req.body, //ES6 Spread syntax
        owner: req.user._id
    })


    try {
        await task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(400).send(error)
    }
})

//GET /tasks?completed=false
//GET /tasks?limit=10&skip=0 **getting page number 0 with 10 trsults
//GET /tasks?sortBy=createdAt:asc
router.get('/tasks', auth, async (req, res) =>{
    const match = {}
    const sort = {}

    if(req.query.completed){
        match.completed = req.query.completed === 'true' ? true : false
    }

    if(req.query.sortBy)
    {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc'? -1 : 1
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        const tasks = req.user.tasks
        res.send(tasks)
    } catch (error) {
        res.status(500).send(error)
    }
})

//get task
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        const task = await Task.findOne({_id, owner: req.user._id})

        if(!task)
        {
            return res.status(404).send()
        }
        res.send(task)
    } catch (error) {
        res.status(500).send(error)
    }
})

//update-patch task
router.patch('/tasks/:id', auth, async (req, res) =>
{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed',]
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update)
    })

    if(!isValidOperation){
        return res.status(400).send({error: 'invalid updates'})
    }

    try {
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})

        if(!task)
        {
            return res.status(404).send()
        }

        updates.forEach((update) => {
            task[update] = req.body[update]
        })

        task.save()

        res.send(task)
    } catch (error) {
        res.status(400).send(error)
    }
})

//delete task
router.delete('/tasks/:id', auth, async (req, res) =>
{
    try {
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    } catch (error) {
        res.status(500).send(error)
    }
})

//--export--\\
module.exports = router