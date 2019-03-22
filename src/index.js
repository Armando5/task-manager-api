const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express() // store our express application
const port = process.env.PORT

app.use(express.json())// parse incoming json to an object so we can access it in our request handlers(req.body)
app.use(userRouter) // register router with our existing app
app.use(taskRouter)

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})

// How populate works ??
/* const Task = require('./models/task')
const User = require('./models/user') */

/* const main = async () => { */
    /* const task = await Task.findById('5c9252076558fd1f087ad9af')
    await task.populate('owner').execPopulate() // populate data from a relationship(find the user associate with that task)
    console.log(task.owner) */

/*     const user = await User.findById('5c924c80b05426315830efcf')
    await user.populate('myTasks').execPopulate()
    console.log(user.myTasks)
}
main() */