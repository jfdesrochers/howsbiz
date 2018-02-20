const Mustache = require('mustache')
const fs = require('fs')
const sendMail = require('./sendmail.js')
const env = require('../env.json')
const path = require('path')
const {Database, hbSections, hbColorMap, storeList} = require('./data.js')

const hbmaster = fs.readFileSync(path.join(__dirname, 'templates', 'howsbiz.mst'), 'utf8').toString()
const allhbs = fs.readFileSync(path.join(__dirname, 'templates', 'allhbs.mst'), 'utf8').toString()
const hblist = fs.readFileSync(path.join(__dirname, 'templates', 'hblist.mst'), 'utf8').toString()

const mergeSections = function(hb, keepColorNames) {
    return hbSections.map((sect) => {
        return {
            title: sect.title,
            color: keepColorNames ? sect.color : hbColorMap[sect.color],
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
    let hbtmpl = {
        store: hb.store,
        week: hb.week,
        picUrl: hb.picUrl,
        data: mergeSections(hb)
    }
    let html = Mustache.render(hbmaster, hbtmpl)
    Database.emailGetEmails({store: hb.store}).then((emails) => {
        sendMail({
            from: '"How\'s Biz par J-F Desrochers" <' + env.GMAILADDR + '>',
            to: 'martine.dessureault@staples.ca,' + emails.map((o) => o['email']).join(','),
            subject: 'How\'s Biz magasin ' + hb.store + ' semaine ' + hb.week, 
            text: '', 
            html: html
        })
    })
}

module.exports.mailHowsBiz = mailHowsBiz

const getAllHBs = function(hbs) {
    hbs.sort(function (a,b) {
        ia = parseInt(a['store']);
        ib = parseInt(b['store']);
        return (ia < ib) ? -1 : (ia > ib) ? 1 : 0;
    })
    hbs = hbs.map((hb) => {
        return {
            store: hb.store,
            storename: storeList[hb.district][hb.store],
            week: hb.week,
            picUrl: hb.picUrl,
            data: mergeSections(hb, true)
        }
    })
    return Mustache.render(allhbs, {hbs: hbs})
}

module.exports.getAllHBs = getAllHBs

const mailWeeklyUpdate = function(district, week) {
    let hbstmpl = {
        week: week,
        storelist: Object.keys(storeList[district]).slice(1),
        url: 'https://howsbiz.jfdft.com/view/' + new Buffer(JSON.stringify({district: district, week: week})).toString('base64')
    }
    let html = ""
    return Database.countHBs({district: district, week: week, status: 'published'}).then((slist) => {
        hbstmpl['percentcomplete'] = Math.round(slist.length / hbstmpl.storelist.length * 100)
        hbstmpl['percentcolor'] = hbstmpl['percentcomplete'] > 80 ? '#00bc8c' : hbstmpl['percentcomplete'] > 60 ? '#f39c12' : '#e74c3c'
        let stores = {}
        slist.forEach(o => stores[o.store] = true)
        hbstmpl.storelist = hbstmpl.storelist.map((o) => {
            return {storeno: o, presencecolor: o in stores ? '#00bc8c' : '#e74c3c', presenceicon: o in stores ? 'OUI' : 'NON'}
        })
        html = Mustache.render(hblist, hbstmpl)
        return Database.emailGetEmails({district: district})
    }).then((emails) => {
        sendMail({
            from: '"How\'s Biz par J-F Desrochers" <' + env.GMAILADDR + '>',
            to: emails.map((o) => o['email']).join(','), 
            subject: 'Vos How\'s Biz de la semaine ' + week,
            html: html
        })
    })
}

module.exports.mailWeeklyUpdate = mailWeeklyUpdate