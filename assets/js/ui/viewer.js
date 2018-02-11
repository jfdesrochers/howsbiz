const m = require('mithril')
const Property = require('../utils/Property.js')
const {ModalWindow, toggleLoadIcon} = require('../utils/misc.js')
const {Database, storeList, hbSections} = require('../data.js')
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
    this.parent = vnode.attrs.parent
    this.user = vnode.attrs.parent.user
    this.username = vnode.attrs.parent.username

    this.commentsLoading = Property(false)
    this.comments = []
    this.commentsLastFetch = null
    this.commentsinterval = null

    this.rebinddata = () => {
        this.HB = vnode.attrs.HBData.hbs[vnode.attrs.HBIndex]
    }

    this.parent.mainEvents.on('rebinddata', this.rebinddata)

    this.saveView = () => {
        if (this.HB.views[this.username]) return
        this.HB.views[this.username] = 1
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
        if (this.HB.likes[this.username]) {
            delete this.HB.likes[this.username]
        } else {
            this.HB.likes[this.username] = 1
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
        Database.saveComment(comment, this.HB._id, this.username)
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
        toggleLoadIcon(true)
        Database.getComments(this.HB._id, lastFetch)
        .then((commentlist) => {
            //this.comments.unshift.apply(this.comments, commentlist)
            this.comments = _.unionBy(commentlist, this.comments, (o) => o._id)
            this.commentsLastFetch = new Date()
            this.commentsLoading(false)
            m.redraw()
            toggleLoadIcon(false)
        })
        .catch((err) => {
            console.log('Error [MongoDB] ' + err.errmsg)
            this.parent.dbError('Une erreur est survenue lors du chargement des commentaires. Merci de réessayer.')
            this.commentsLoading(false)
            m.redraw()
            toggleLoadIcon(false)
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
        hbSections.map((sect) => {
            return m(`div.panel.panel-${sect.color}`, {key: sect.name}, [
                m('div.panel-heading', m('h3.panel-title', sect.title)),
                m('div.list-group', sect.subsections.map((subsect) => {
                    return m('div.list-group-item', {key: subsect.name}, [
                        m('h4.list-group-item-heading', subsect.title),
                        m('div.list-group-item-text', this.HB.data[subsect.name] && this.HB.data[subsect.name]['comment'] || 'Aucun Commentaire.'),
                        m('div.list-group-item-text.muted', this.HB.data[subsect.name] && `Par: ${this.HB.data[subsect.name]['contributions'].join(', ')}` || '')
                    ])
                })),
                m('div.panel-footer', m.trust(sect.helptext))
            ])
        }),
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
                let cuser = o.username.split(' ')
                return m('li.list-group-item.fadein', {key: o._id}, [
                    m('h4.list-group-heading', m('div.media', [
                        m('div.media-left', m('div.bubble-item', m('div.bubble-inner', cuser[0][0] + cuser[1][0]))),
                        m('div.media-body', [
                            m('div.clearfix', [
                                m('div.media-heading.no-margin.pull-left', o.username)
                                /*m('div.muted.pull-right', new Date(o.postDate).toLocaleString('fr-CA'))*/
                            ]),
                            m('div.muted', new Date(o.postDate).toLocaleString('fr-CA'))
                        ])
                    ])),
                    m('p.list-group-item-text', m.trust(o.comment))
                ])
            })) : 'Aucun commentaire pour l\'instant.'
        ])
    ]) : m(NotReady, {store: storeList[this.HB.district][this.HB.store]})
}

module.exports = HBViewer