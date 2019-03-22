const mongoose = require('mongoose') // load in the mongoose npm libraries

mongoose.connect(process.env.MONGODB_URL , {
    useNewUrlParser: true,
    useCreateIndex: true, // indexes are created to quickly access the data we need to access
    useFindAndModify: false
})

