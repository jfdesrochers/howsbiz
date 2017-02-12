const m = require('mithril')
const Property = require('../utils/Property.js')
const {UniqueRandom, ModalWindow} = require('../utils/misc.js')
const {getWeekNo, getAllWeeks} = require('../utils/dateutils.js')
const EventEmitter = require('events')
const $ = window.$ || require('../../vendor/js/jquery-2.2.4.min.js')
const _ = require('lodash')

const AppLoader = require('./loader.js')
const HBEditor = require('./editor.js')
const HBViewer = require('./viewer.js')
const {PasswordChange} = require('./accounts.js')

const {Database, storeList} = require('../data.js')

const HBData = {
    users: {},
    hbs: [],
    lastUpdate: null
}

class MainEvents extends EventEmitter {}
const MainWindow = {}

MainWindow.oninit = function (vnode) {
    this.user = vnode.attrs.app.user
    this.weeks = getAllWeeks()
    this.curWeek = Property(String(getWeekNo(true)))
    this.randomColor = UniqueRandom(1, 11, true)
    this.editorDirty = Property(false, (cur, old) => {
        if (cur !== old) m.redraw()
    })

    this.mainEvents = new MainEvents()
    
    this.dbError = Property('')
    this.dbinterval = null
    this.dbintervalLoad = () => {
        Database.getUsers(HBData.lastUpdate)
        .then((userlist) => {
            _.assign(HBData.users, _.keyBy(userlist, (val) => val._id.toHexString()))
            Database.getHBs(this.user.district, this.curWeek(), HBData.lastUpdate)
            .then((hblist) => {
                _.assign(HBData.hbs, _.keyBy(hblist, (val) => val._id.toHexString()))
                HBData.lastUpdate = new Date()
                this.mainEvents.emit('rebinddata')
                m.redraw()
            })
        })
        .catch((err) => {
            console.log('Error [MongoDB] ' + err.errmsg)
            this.dbError('Une erreur est survenue lors de l\'accès aux données. Merci de réessayer.')
        })
    }

    this.curView = Property('emptyview')
    this.myHB = Property('')
    this.hasEditor = Property(false)

    this.loaderReady = () => {
        Database.getUsers()
        .then((userlist) => {
            HBData.users = _.keyBy(userlist, (val) => val._id.toHexString())
            Database.getHBs(this.user.district, this.curWeek())
            .then((hblist) => {
                HBData.hbs = _.keyBy(hblist, (val) => val._id.toHexString())
                HBData.lastUpdate = new Date()
                let hbid = _.find(HBData.hbs, (o) => {return (o.store === this.user.store && o.week === this.curWeek())})
                if (hbid) {
                    this.myHB(hbid._id.toHexString())
                } else {
                    this.myHB('')
                }
                if ((this.user.store !== '0') && ((this.myHB() && HBData.hbs[this.myHB()].status !== 'published') || (this.myHB() === ''))) {
                    this.curView('editor')
                    this.hasEditor(true)
                } else {
                    this.hasEditor(false)
                    let keys = Object.keys(HBData.hbs)
                    if (keys.length > 0) {
                        this.curView(keys[0])
                    } else {
                        this.curView('emptyview')
                    }
                }
                m.redraw()
            })
        })
        .catch((err) => {
            console.log('Error [MongoDB] ' + err.errmsg)
            AppLoader.status.err('Une erreur est survenue lors de l\'accès aux données. Merci de réessayer.')
        })
    }
}

MainWindow.view = function (vnode) {
    return HBData.lastUpdate === null ? m(AppLoader, {onready: this.loaderReady, message: 'Chargement des données en cours...'}) :
    m('div.mainwindow.uicontainer', {
        oncreate: (vdom) => {
            $(vdom.dom).fadeIn('slow', () => {
                if (typeof vnode.attrs.onready === 'function') {
                    vnode.attrs.onready()
                }
                this.dbinterval = setInterval(this.dbintervalLoad, 60000)
            })
        },
        onremove: () => {
            clearInterval(this.dbinterval)
        }
    }, [
        m('div.sidebar', [
            m('div.btn-group', [
                m('button.btn.btn-default.btn-block.dropdown-toggle', {'data-toggle': 'dropdown'}, m('div.media', [
                    m('div.media-left', m('div.bubble-item', m('div.bubble-inner', this.user.firstname[0] + this.user.lastname[0]))),
                    m('div.media-body', [
                        m('div.media-heading.no-margin', this.user.firstname + ' ' + this.user.lastname),
                        m('span.muted', 'Cliquez ici pour les options')
                    ])
                ])),
                m('ul.btn-block.dropdown-menu.dropdown-menu-right', [
                    m('li', m('a[href=""]', {onclick: (e) => {
                        e.preventDefault()
                        m.mount(document.getElementById('modalcontainer'), ModalWindow(PasswordChange, {user: vnode.state.user, done: () => m.mount(document.getElementById('modalcontainer'), null)}))
                        return false
                    }}, 'Changer de mot de passe...')),
                    m('li.divider'),
                    m('li', m('a[href="#"]', {onclick: () => {
                        vnode.attrs.app.user = null
                        HBData.hbs = []
                        HBData.users = {}
                        HBData.lastUpdate = null
                    }}, 'Se Déconnecter'))
                ])
            ]),
            this.dbError().length > 0 ? m('div.alert.alert-danger.alert-dismissible.fade.in', {oncreate: (vdom) => {
                $(vdom.dom).on('closed.bs.alert', () => {
                    this.dbError('')
                })
            }}, [
                m('button.close', {'data-dismiss': 'alert'}, m.trust('&times;')),
                this.dbError()
            ]) : '',
            m('ul.list-group', [
                m('li.list-group-item', m('div.form-group', [
                    m('label.control-label', {for: 'curWeek'}, 'Semaine fiscale'),
                    m('select.form-control#curWeek', {onchange: (e) => {
                        this.curWeek(e.target.value)
                        HBData.hbs = []
                        HBData.users = {}
                        HBData.lastUpdate = null
                    }}, 
                        this.weeks.map((item) => {
                            return m('option', {value: item[0], selected: (item[0] == this.curWeek())}, item[1])
                        })
                    )
                ])),
                this.hasEditor() ? m('a[href="#"].list-group-item' + (this.curView() === 'editor' ? '.active' : ''), {onclick: () => {
                    if (this.curView() !== 'editor') {
                        this.curView('editor')
                        m.redraw()
                    }
                }}, [
                    m('h4.list-group-item-heading', 'Rédiger mon How\'s biz'),
                    m('p.list-group-item-text', this.editorDirty() ? 'Non sauvegardé...' : 'Sauvegardé.')
                ]) : ''
            ]),
            m('div.list-wrapper', m('ul.list-group', _.map(_.sortBy(HBData.hbs, (o) => parseInt(o.store)), (o) => {
                let oid = o._id.toHexString()
                return m('a[href="#"].list-group-item.fadein' + (this.curView() == oid ? '.active' : ''), {key: oid, onclick: () => {
                    this.curView(oid)
                    m.redraw()
                }}, m('div.media', [
                    m('div.media-left', m('div.bubble-item', {oncreate: (vdom) => vdom.dom.classList.add('col'+ this.randomColor())}, m('div.bubble-inner', o.store))),
                    m('div.media-body', [
                        m('div.media-heading.no-margin', storeList[o.district][o.store]),
                        o.status === 'published' ? [
                            m('span.badge.mr5', [m('span.mr5', Object.keys(o.comments).length), m('span.glyphicon.glyphicon-comment')]),
                            m('span.badge.mr5', [m('span.mr5', Object.keys(o.likes).length), m('span.glyphicon.glyphicon-heart')]),
                            m('span.badge', [m('span.mr5', Object.keys(o.views).length), m('span.glyphicon.glyphicon-eye-open')])
                        ] : m('span.muted', 'Pas encore publié')
                    ])
                ]))
            })))
        ]),
        m('div.contentwindow', this.curView() === 'editor' ? m(HBEditor, {parent: this, HBData: HBData, HB: (this.myHB() ? HBData.hbs[this.myHB()] : undefined)}) : 
            this.curView() === 'emptyview' ? '' :
            m(HBViewer, {key: this.curView(), parent: this, HBData: HBData, HBIndex: this.curView()})
        )
    ])
}

module.exports = MainWindow