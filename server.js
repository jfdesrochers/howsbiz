const express = require('express')
const bodyParser = require('body-parser')
const session = require('express-session')
const MemoryStore = require('memorystore')(session)
const favicon = require('serve-favicon')
const app = express()
const path = require('path')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const {Database} = require('./server/data.js')
const {mailHowsBiz, getAllHBs, mailWeeklyUpdate} = require('./server/mailhowsbiz.js')
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

function authenticated (reqAdmin) {  
    return function (req, res, next) {
        if (req.isAuthenticated()) {
            if (reqAdmin) {
                if (req.session.passport.user.role === '80') {
                    return next()
                }
            } else {
                return next()
            }
        }
        res.sendStatus(401)
    }
}

app.use('/assets', express.static('assets'))
app.use(favicon(path.join(__dirname, 'assets', 'img', 'favicon.ico')))
app.use(session({
    store: new MemoryStore({
        checkPeriod: 86400000
    }),
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

app.post('/createuser', authenticated(true), (req, res, next) => {
    Database.createUser(req.body)
    .then((result) => {
        res.json(result)
    })
    .catch((e) => {
        return next(e)
    })
})

app.get('/listusers', authenticated(true), (req, res, next) => {
    Database.listUsers()
    .then((result) => {
        res.json(result)
    })
    .catch((e) => {
        return next(e)
    })
})

app.post('/dbrequest', authenticated(), (req, res, next) => {
    try {
        Database[req.body.endpoint](req.body.data)
        .then((result) => {
            res.json(result)
        })
        .catch((e) => {
            return next(e)
        })
    } catch(e) {
        return next(e)
    }
})

app.post('/sendemails', authenticated(), (req, res, next) => {
    try {
        mailHowsBiz(req.body)
        res.json({status: 'success'})
    } catch(e) {
        res.json({status: 'error', error: e})
        return next(e)
    }
})

app.get('/view/:key', (req, res, next) => {
    if (!req.params.key) {
        return res.sendStatus(404)
    }
    res.sendFile(path.join(__dirname, 'indexview.html'))
})

app.get('/contents/:key', (req, res, next) => {
    if (!req.params.key) {
        return res.sendStatus(404)
    }
    try {
        let options = JSON.parse(new Buffer(decodeURIComponent(req.params.key), 'base64').toString())
        options['status'] = 'published'
        Database.getHBs(options).then((hbs) => {
            res.send(getAllHBs(hbs))
        })
    } catch(e) {
        return next(e)
    }
})

const port = process.env.PORT || 8080

app.listen(port, function () {
    console.log(`Server started at port ${port}...`)
})