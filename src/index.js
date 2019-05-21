const app = reqire('./app')
const port = process.env.PORT

//server flag
app.listen(port, () => {
    console.log('Server is up on port '+ port)
})