const {MongoClient, ObjectID} = require('mongodb')
const env = require('./env.json')
const SummaryTool = require('node-summary')
const h2p = require('html2plaintext')

MongoClient.connect(env.DBURL)
.then(function(db) {
    let hbs = db.collection('howsbiz')
    let query = {'district': '19', 'week': '3', 'store': '325'}
    hbs.find(query).toArray()
    .then(function (hb) {
        db.close()
        SummaryTool.getSortedSentences(h2p(hb[0].devCom.replace(/<h[1-6]>.+<\/h[1-6]>/gi, '')), 2, (err, summary) => {
            console.log(summary.join(' [...] '))
        })
    })
    .catch(function (err) {
        db.close()
        throw err
    })

})
.catch(function (err) {
    throw err
})