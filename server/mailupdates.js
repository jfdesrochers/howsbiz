const {summarize} = require('./utils/sum.js')
const {Database} = require('./data.js')
const {getWeekNo, getAllWeeks} = require('../assets/js/utils/dateutils.js')
const Mustache = require('mustache')
const fs = require('fs')

// load and parse template
const template = fs.readFileSync('./templates/email.html', 'utf8')
Mustache.parse(template)
const templateText = fs.readFileSync('./templates/email.txt', 'utf8')
Mustache.parse(templateText)

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
                return
            }
            emailCache['districts'][user._id.district] = []
            return Database.getHBs({district: user._id.district, week: curWeek})
            .then((hbs) => {
                return Database.emailGetStores({district: user._id.district, week: curWeek})
                .then((stores) => {
                    hbs.filter((o) => {
                        return (stores.indexOf(o.store) === -1)
                    }).map((o) => {
                        emailCache['districts'][user._id.district].push({store: o.store, summary: summarize([o.salesCom, o.servCom, o.devCom]).join(' [...] ')})
                        stores.push(o.store)
                    })
                    Database.emailSetStores({district: user._id.district, week: curWeek, storeList: stores})
                })
            })
        })
        .then(() => {
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
        })
    }, Promise.resolve())
    promise.then(() => {
        console.log(emailCache)
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