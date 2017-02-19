const express = require('express')
const bodyParser = require('body-parser')
const session = require('express-session')
const favicon = require('serve-favicon')
const app = express()
const path = require('path')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const {Database} = require('./server/data.js')
const env = require('./env.json')

passport.use(new LocalStrategy(
    function(username, password, done) {
        let userdata = {
            username: username,
            password: password
        }
        Database.loginUser(userdata)
        .then((user) => {
            delete user.password
            done(null, user)
        })
        .catch((err) => {
            if (err.errcode == 'e_badpassword') {
                done(null, false)
            } else {
                done(err)
            }
        })
    }
))

passport.serializeUser(function(user, done) {
  done(null, user)
})

passport.deserializeUser(function(user, done) {
  done(null, user)
});

function authenticated () {  
    return function (req, res, next) {
        if (req.isAuthenticated()) {
            return next()
        }
        res.sendStatus(401)
    }
}

app.use('/assets', express.static('assets'))
app.use(favicon(path.join(__dirname, 'assets', 'img', 'favicon.ico')))
app.use(session({
    secret: env.SESSIONSECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(bodyParser.json({limit: '5mb'}))
app.use(passport.initialize())
app.use(passport.session())

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
})

app.post('/login', passport.authenticate('local'), (req, res) => {
    res.json(req.user)
})

app.post('/createuser', (req, res) => {
    Database.createUser(req.body)
    .then((result) => {
        res.json(result)
    })
    .catch((e) => {
        throw e
    })
})

app.post('/dbrequest', authenticated(), (req, res) => {
    try {
        Database[req.body.endpoint](req.body.data)
        .then((result) => {
            res.json(result)
        })
        .catch((e) => {
            throw e
        })
    } catch(e) {
        throw e
    }
})

app.listen(8080)