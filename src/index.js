const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()
const port = process.env.PORT

//auto parse income json files to js objects
app.use(express.json())

//allowing seperate files for each api route (so index.js wont look too long and messy)
app.use(userRouter)
app.use(taskRouter)

app.get('', (req, res) =>
{
    res.send('welcome to task manager api, created by Gal Efraty')
})

//server flag
app.listen(port, () => {
    console.log('Server is up on port '+ port)
})