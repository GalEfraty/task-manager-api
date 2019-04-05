//node src/db/mongoose.js

/*LOCAL ENVIROMENT DEV ONLY:: RUN TERMINAL MONGO CONNECTION:: 
    C:\Users\USER\mongodb\bin\mongod.exe --dbpath=C:\Users\USER\mongodb-data
*/
const mongoose = require('mongoose')


mongoose.connect(process.env.MONGODB_URL, 
{
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
})





