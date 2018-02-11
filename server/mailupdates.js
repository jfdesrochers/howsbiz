const {summarize} = require('./utils/sum.js')
const {Database} = require('./data.js')
const {getWeekNo, getAllWeeks} = require('../assets/js/utils/dateutils.js')
const Mustache = require('mustache')
const sendMail = require('./sendmail.js')
const env = require('../env.json')
const fs = require('fs')
const path = require('path')

// load and parse template
const template = fs.readFileSync(path.join(__dirname, 'templates', 'email.html'), 'utf8')
const templateText = fs.readFileSync(path.join(__dirname, 'templates', 'email.txt'), 'utf8')

// initalize email cache and variables
const emailCache = {'districts': {}, 'stores': {}}
const curWeek = String(getWeekNo(true))
const yesterday = new Date()
yesterday.setDate(yesterday.getDate() - 1)

Database.emailGetUsers()
.then(function (users) {
    let promise = users.reduce((pms, user) => {
        return pms.then(() => {
            if (emailCache['districts'][user._id.district] !== undefined) {
                emailCache['districts'][user._id.district].emails.push.apply(emailCache['districts'][user._id.district].emails, user.emails)
                return
            }
            emailCache['districts'][user._id.district] = {sales: [], serv: [], dev: [], emails: user.emails}
            return Database.getHBs({district: user._id.district, week: curWeek, status: 'published'})
            .then((hbs) => {
                hbs.sort((p, n) => {
                    return parseInt(p.store) - parseInt(n.store)
                })
                hbs.map((o) => {
                    if (o.salesCom.length > 0) {
                        emailCache['districts'][user._id.district].sales.push({store: o.store, summary: summarize(o.salesCom)})
                    }
                    if (o.servCom.length > 0) {
                        emailCache['districts'][user._id.district].serv.push({store: o.store, summary: summarize(o.servCom)})
                    }
                    if (o.devCom.length > 0) {
                        emailCache['districts'][user._id.district].dev.push({store: o.store, summary: summarize(o.devCom)})
                    }
                })
            })
        })
        /*.then(() => {
            return Database.getHBs({district: user._id.district, store: user._id.store, week: curWeek, lastupdate: yesterday})
            .then((hbs) => {
                if (hbs.length > 0) {
                    hbs = hbs[0]
                    return Database.emailGetComments({hbid: hbs._id, lastupdate: yesterday})
                    .then((comments) => {
                        console.log(comments)
                    })
                }
            })
        })*/
    }, Promise.resolve())
    promise.then(() => {
        Object.keys(emailCache.districts).forEach((o) => {
            let email = emailCache.districts[o]
            email['week'] = getAllWeeks(true)[parseInt(curWeek)-1][1]
            let html = Mustache.render(template.toString(), email)
            let text = Mustache.render(templateText.toString(), email)
            sendMail({
                from: '"How\'s Biz par J-F Desrochers" <' + env.GMAILADDR + '>',
                to: emailCache.districts[o].emails.join(','), 
                subject: 'Vos How\'s Biz de la semaine ' + curWeek,
                text: text, 
                html: html
            })
        })
    })
})
.catch(function (err) {
    console.log('Error occured : ', err)
})


/*
function sequentialAsyncWithReduce () {
    var values = [1,2,3,4];
    var newValues = [];
    return values.reduce(function(memo, value) {
        return memo.then(function() {
            return asyncOperation(value);
        }).then(function(newValue) {
            // ...
            newValues.push(newValue);
        });
    }, Promise.resolve(null)).then(function() {
        return newValues;
    });
}
*/