const m = require('mithril')
const Property = require('../utils/Property.js')
const {ModalWindow} = require('../utils/misc.js')
const {Database, storeList, positionList} = require('../data.js')
const $ = window.$ || require('jquery')
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

    this.commentsLoading = Property(false)
    this.comments = []
    this.commentsLastFetch = null
    this.commentsinterval = null

    this.rebinddata = () => {
        this.HB = vnode.attrs.HBData.hbs[vnode.attrs.HBIndex]
        this.users = vnode.attrs.HBData.users
    }

    this.parent.mainEvents.on('rebinddata', this.rebinddata)

    this.saveView = () => {
        if (this.HB.views[this.user._id]) return
        this.HB.views[this.user._id] = 1
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
        if (this.HB.likes[this.user._id]) {
            delete this.HB.likes[this.user._id]
        } else {
            this.HB.likes[this.user._id] = 1
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
    this.saveComment = (comment) => {
        if (!comment) return
        this.commentsLoading(true)
        Database.saveComment(comment, this.HB._id, this.user._id)
        .then((doc) => {
            this.HB.comments[doc._id] = 1
            Database.saveLikeViewComment(this.HB._id, 'comments', this.HB.comments)
            .then(() => {
                this.comments.unshift(doc)
                this.commentsLoading(false)
                m.redraw()
            })
        })
        .catch((err) => {
            console.log('Error [MongoDB] ' + err.errmsg)
            this.parent.dbError('Une erreur est survenue lors de la sauvegarde. Merci de réessayer.')
            this.commentsLoading(false)
            m.redraw()
        })
    }
    this.fetchComments = (delta) => {
        let lastFetch = undefined
        if (delta) {
            lastFetch = this.commentsLastFetch
        } else {
            this.commentsLoading(true)
            m.redraw()
        }
        Database.getComments(this.HB._id, lastFetch)
        .then((commentlist) => {
            //this.comments.unshift.apply(this.comments, commentlist)
            this.comments = _.unionBy(commentlist, this.comments, (o) => o._id)
            this.commentsLastFetch = new Date()
            this.commentsLoading(false)
            m.redraw()
        })
        .catch((err) => {
            console.log('Error [MongoDB] ' + err.errmsg)
            this.parent.dbError('Une erreur est survenue lors du chargement des commentaires. Merci de réessayer.')
            this.commentsLoading(false)
            m.redraw()
        })
    }
}

HBViewer.oncreate = function() {
    $('.contentwindow').scrollTop(0)
    if (this.HB.status === 'published') {
        this.saveView()
        this.fetchComments(false)
        this.commentsinterval = setInterval(_.partial(this.fetchComments, true), 30000)
    }
}

HBViewer.onremove = function () {
    this.parent.mainEvents.removeListener('rebinddata', this.rebinddata)
    clearInterval(this.commentsinterval)
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
            m('button.btn.btn-sm.btn-success.pull-left.mr5' + (this.HB.likes[this.user._id] ? '.active' : ''), {onclick: this.saveLike}, 
            this.HB.likes[this.user._id] ? [m('span.glyphicon.glyphicon-heart'), ' Je n\'aime plus'] : [m('span.glyphicon.glyphicon-heart-empty'), ' J\'aime']),
            m('button.btn.btn-sm.btn-warning.pull-left', {onclick: () => {
                m.mount(document.getElementById('modalcontainer'), ModalWindow(AddComment, {done: (comment) => {
                    this.saveComment(comment)
                    m.mount(document.getElementById('modalcontainer'), null)
                }}))
            }}, [m('span.glyphicon.glyphicon-comment'), ' Commenter'])
        ]),
        m('hr'),
        m('div.commentsection', [
            m('h3', 'Commentaires'),
            this.commentsLoading() ? m('div.alert.alert-info.pulsing', 'Chargement en cours...') : this.comments.length ? m('ul.list-group', this.comments.map((o) => {
                let cuser = this.users[o.userid]
                return m('li.list-group-item.fadein', {key: o._id}, [
                    m('h4.list-group-heading', m('div.media', [
                        m('div.media-left', m('div.bubble-item', m('div.bubble-inner', cuser.firstname[0] + cuser.lastname[0]))),
                        m('div.media-body', [
                            m('div.clearfix', [
                                m('div.media-heading.no-margin.pull-left', cuser.firstname + ' ' + cuser.lastname),
                                m('div.muted.pull-right', new Date(o.postDate).toLocaleString('fr-CA'))
                            ]),
                            m('span.muted', positionList[cuser.position] + (cuser.store == '0' ? (', District' + ' ' + cuser.district) : (', Magasin ' + cuser.store + ' ' + storeList[cuser.district][cuser.store])))
                        ])
                    ])),
                    m('p.list-group-item-text', m.trust(o.comment))
                ])
            })) : 'Aucun commentaire pour l\'instant.'
        ])
    ]) : m(NotReady, {store: storeList[this.HB.district][this.HB.store]})
}

module.exports = HBViewer