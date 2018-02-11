const Mustache = require('mustache')
const fs = require('fs')
const sendMail = require('./sendmail.js')
const env = require('../env.json')
const path = require('path')
const {Database, hbSections} = require('./data.js')

const mergeSections = function(hb) {

}

const mailHowsBiz = function(hb) {
    fs.readFile(path.join(__dirname, 'templates', 'howsbiz.html'), 'utf8', (err, template) => {
        if (err) {
            console.log(err)
        } else {
            let ctx = {hb: hb, tpl: hbSections}
            let html = Mustache.render(template.toString(), ctx)
            Database.emailGetEmails(hb.store).then((emails) => {
                sendMail({
                    from: '"How\'s Biz par J-F Desrochers" <' + env.GMAILADDR + '>',
                    to: 'martine.dessureault@staples.ca,' + emails.map((o) => o['email']).join(','),
                    subject: 'How\'s Biz magasin ' + hb.store + ' semaine ' + hb.week, 
                    text: '', 
                    html: html
                })
            })
        }
    })
}

module.exports = mailHowsBiz