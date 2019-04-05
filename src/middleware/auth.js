const jwt = require('jsonwebtoken')
const User = require('../models/user')


//Express middleware, note:
{/*
this function we pass to app.use() going to execute and run 
between request coming to the server and the route handler run the req.
the func has acces to the information as the route handler :(req, res)
and another argument called 'next' 
we should call next() if the next thing should run - without next(), the router wont execute.
*/}

const auth = async (req, res, next) =>
{
    try {
        const token = req.header('Authorization').replace('Bearer','').trim()
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findOne({_id: decoded._id, 'tokens.token': token}) 
        {/*'tokens.token': => this will look for a user 
        that has that given token value in one of the items in token array */}

        if(!user){
            throw new Error()
        }

        req.token = token
        req.user = user
        next()
    } catch (error) {
        res.status(401).send({error: 'Please authenticate.'})
    }
}

module.exports = auth