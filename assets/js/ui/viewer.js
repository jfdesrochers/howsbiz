const m = require('mithril')
const Property = require('../utils/Property.js')
const {ModalWindow} = require('../utils/misc.js')
const {Database, storeList} = require('../data.js')
const $ = window.$ || require('../../vendor/js/jquery-2.2.4.min.js')
const _ = require('lodash')

const AddComment = require('./comment.js')

const NotReady = {
    view: function (vnode) {
        return m('div.notready', 
        m('div.row', 
            m('div.col-xs-8.col-xs-offset-2', [
                m('img.mainlogo', {src: './assets/img/logoshhh.svg'}),
                m('p.lead', 'Ce How\'s Biz est encore secret!'),
                m('p', 'Les grands cerveaux à ' + vnode.attrs.store + ' sont encore entrain de rédiger leurs commentaires. Revenez plus tard pour voir les idées extraordinaires qu\'ils vous réservent.')
            ])
        )
    )
    }
}

const HBViewer = {}

HBViewer.oninit = function (vnode) {
    this.HB = vnode.attrs.HBData.hbs[vnode.attrs.HBIndex]
    this.users = vnode.attrs.HBData.users
    this.parent = vnode.attrs.parent
    this.user = vnode.attrs.parent.user

    this.rebinddata = () => {
        this.HB = vnode.attrs.HBData.hbs[vnode.attrs.HBIndex]
        this.users = vnode.attrs.HBData.users
    }

    this.parent.mainEvents.on('rebinddata', this.rebinddata)

    this.saveView = () => {
        if (this.HB.views[this.user._id.toHexString()]) return
        this.HB.views[this.user._id.toHexString()] = 1
        Database.saveLikeViewComment(this.HB._id, 'views', this.HB.views)
        .then(() => {
            m.redraw()
        })
        .catch((err) => {
            console.log('Error [MongoDB] ' + err.errmsg)
            this.parent.dbError('Une erreur est survenue lors de la sauvegarde. Merci de réessayer.')
            m.redraw()
        })
    }
    this.saveLike = () => {
        if (this.HB.likes[this.user._id.toHexString()]) {
            delete this.HB.likes[this.user._id.toHexString()]
        } else {
            this.HB.likes[this.user._id.toHexString()] = 1
        }
        Database.saveLikeViewComment(this.HB._id, 'likes', this.HB.likes)
        .then(() => {
            m.redraw()
        })
        .catch((err) => {
            console.log('Error [MongoDB] ' + err.errmsg)
            this.parent.dbError('Une erreur est survenue lors de la sauvegarde. Merci de réessayer.')
            m.redraw()
        })
    }
}

HBViewer.oncreate = function() {
    $('.contentwindow').scrollTop(0)
    if (this.HB.status === 'published') this.saveView()
}

HBViewer.onremove = function () {
    this.parent.mainEvents.removeListener('rebinddata', this.rebinddata)
}

HBViewer.view = function() {
    return this.HB.status === 'published' ? m('div.hbviewer', [
        m('h1', storeList[this.HB.district][this.HB.store]),
        m('div.lead', this.parent.weeks[this.parent.curWeek() - 1][1]),
        m('div.panel.panel-primary', [
            m('div.panel-heading', m('h3.panel-title', 'Ventes')),
            m('div.panel-body', m('div#salesView', this.HB.salesCom ? m.trust(this.HB.salesCom) : 'Aucun commentaire.')),
            m('div.panel-footer', ['Rédigé par : ', this.HB.salesCont.map((id, i, a) => {
                return [
                    m('span', this.users[id].firstname + ' ' + this.users[id].lastname),
                    i === a.length - 2 ? ' et ' : i < a.length - 2 ? ', ' : ''
                ]
            })])
        ]),
        m('div.panel.panel-success', [
            m('div.panel-heading', m('h3.panel-title', 'Services')),
            m('div.panel-body', m('div#servEdit.editor', this.HB.servCom ? m.trust(this.HB.servCom) : 'Aucun commentaire.')),
            m('div.panel-footer', ['Rédigé par : ', this.HB.servCont.map((id, i, a) => {
                return [
                    m('span', this.users[id].firstname + ' ' + this.users[id].lastname),
                    i === a.length - 2 ? ' et ' : i < a.length - 2 ? ', ' : ''
                ]
            })])
        ]),
        m('div.panel.panel-danger', [
            m('div.panel-heading', m('h3.panel-title', 'Développement des affaires')),
            m('div.panel-body', m('div#devlEdit.editor', this.HB.devCom ? m.trust(this.HB.devCom) : 'Aucun commentaire.')),
            m('div.panel-footer', ['Rédigé par : ', this.HB.devCont.map((id, i, a) => {
                return [
                    m('span', this.users[id].firstname + ' ' + this.users[id].lastname),
                    i === a.length - 2 ? ' et ' : i < a.length - 2 ? ', ' : ''
                ]
            })])
        ]),
        m('div.panel.panel-default', [
            m('div.panel-heading', m('h3.panel-title', 'Photo')),
            m('div.panel-body.text-center', 
                this.HB.picUrl.length ? m('img', {src: this.HB.picUrl}) : 'Aucune Image.'
            )
        ]),
        m('div.clearfix', [
            m('button.btn.btn-sm.btn-success.pull-left.mr5' + (this.HB.likes[this.user._id.toHexString()] ? '.active' : ''), {onclick: this.saveLike}, 
            this.HB.likes[this.user._id.toHexString()] ? [m('span.glyphicon.glyphicon-heart'), ' Je n\'aime plus'] : [m('span.glyphicon.glyphicon-heart-empty'), ' J\'aime']),
            m('button.btn.btn-sm.btn-warning.pull-left', {onclick: () => {
                m.mount(document.getElementById('modalcontainer'), ModalWindow(AddComment, {done: (comment) => {
                    console.log(comment)
                    m.mount(document.getElementById('modalcontainer'), null)
                }}))
            }}, [m('span.glyphicon.glyphicon-comment'), ' Commenter'])
        ]),
        m('hr')
    ]) : m(NotReady, {store: storeList[this.HB.district][this.HB.store]})
}

module.exports = HBViewer