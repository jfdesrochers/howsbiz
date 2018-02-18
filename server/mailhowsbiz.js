const Mustache = require('mustache')
const fs = require('fs')
const sendMail = require('./sendmail.js')
const env = require('../env.json')
const path = require('path')
const {Database, hbSections, hbColorMap} = require('./data.js')

const mergeSections = function(hb) {
    return hbSections.map((sect) => {
        return {
            title: sect.title,
            color: hbColorMap[sect.color],
            subsections: sect.subsections.map((subsect) => {
                return {
                    title: subsect.title,
                    comment: hb.data[subsect.name] && hb.data[subsect.name]['comment'] || 'Aucun Commentaire.',
                    contributions: hb.data[subsect.name] && `Par: ${hb.data[subsect.name]['contributions'].join(', ')}` || ''
                }
            })
        }
    })
}

const mailHowsBiz = function(hb) {
    fs.readFile(path.join(__dirname, 'templates', 'howsbiz.mst'), 'utf8', (err, template) => {
        if (err) {
            console.log(err)
        } else {
            let hbtmpl = {
                store: hb.store,
                week: hb.week,
                picUrl: hb.picUrl,
                data: mergeSections(hb)
            }
            let html = Mustache.render(template.toString(), hbtmpl)
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