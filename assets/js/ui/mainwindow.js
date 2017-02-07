const m = require('mithril')
const {MediumEditor} = require('../../vendor/js/medium-editor.min.js')
const Property = require('../utils/Property.js')
const UniqueRandom = require('../utils/random.js')
const {getWeekNo, getAllWeeks} = require('../utils/dateutils.js')
const $ = window.$ || require('../../vendor/js/jquery-2.2.4.min.js')

const AppLoader = require('./loader.js')

const HBData = {
    users: [],
    hbs: [],
    lastUpdate: null
}

const HBEditor = {}

HBEditor.oninit = function (vnode) {
    this.parent = vnode.attrs.parent
}

HBEditor.oncreate = function () {
    this.editor = new MediumEditor('.editor', {
        toolbar: {
            buttons: ['bold', 'italic', 'underline', 'anchor', 'h2', 'h3', 'quote', 'unorderedlist', 'orderedlist'],
        },
        placeholder: {
            text: 'Écrivez votre commentaire ici',
            hideOnClick: true
        },
        anchor: {
            customClassOption: null,
            customClassOptionText: 'Button',
            linkValidation: false,
            placeholderText: 'Entrez une adresse web',
            targetCheckbox: false,
            targetCheckboxText: 'Open in new window'
        },
        autoLink: true
    })
    this.editor.subscribe('editableInput', (event, editable) => {
        this.parent.editorDirty(true)
    });
}

HBEditor.view = function () {
    return m('div.hbeditor', [
        m('h1', 'Mon How\'s Biz'),
        m('div.lead', this.parent.weeks[this.parent.curWeek() - 1][1]),
        m('div.panel.panel-primary', [
            m('div.panel-heading', m('h3.panel-title', 'Ventes')),
            m('div.panel-body', m('div#salesEdit.editor', { 
                onfocus: (e) => {
                    e.target.parentElement.classList.add('focused')
                    e.redraw = false
                },
                onblur: (e) => {
                    e.target.parentElement.classList.remove('focused')
                    e.redraw = false
                },
            })),
            m('div.panel-footer', 'Conversion et DPO, coaching et Vente Inspirée, marchandisage et opérations, formation et reconnaissance (Apple, concours, etc.)')
        ]),
        m('div.panel.panel-success', [
            m('div.panel-heading', m('h3.panel-title', 'Services')),
            m('div.panel-body', m('div#servEdit.editor', { 
                onfocus: (e) => {
                    e.target.parentElement.classList.add('focused')
                    e.redraw = false
                },
                onblur: (e) => {
                    e.target.parentElement.classList.remove('focused')
                    e.redraw = false
                },
            })),
            m('div.panel-footer', 'Initiatives au Techno-Centre et aux Copies (services à domicile, liquid armor, formation et coaching, marchandisage, appels clients)')
        ]),
        m('div.panel.panel-danger', [
            m('div.panel-heading', m('h3.panel-title', 'Développement des affaires')),
            m('div.panel-body', m('div#devlEdit.editor', { 
                onfocus: (e) => {
                    e.target.parentElement.classList.add('focused')
                    e.redraw = false
                },
                onblur: (e) => {
                    e.target.parentElement.classList.remove('focused')
                    e.redraw = false
                },
            })),
            m('div.panel-footer', 'Réseautage (BDM, PRE, etc.), vos grosses ventes et vos bons coups. Si vous avez créé un lien avec un client d\'affaires, mentionnez-le ici!')
        ])
    ])
}

const MainWindow = {}

MainWindow.oninit = function (vnode) {
    this.user = vnode.attrs.app.user
    this.weeks = getAllWeeks()
    this.curWeek = Property(getWeekNo(true))
    this.randomColor = UniqueRandom(1, 11, true)
    this.editorDirty = Property(false)
}

MainWindow.oncreate = function (vnode) {
    $(vnode.dom).fadeIn(() => {
        if (typeof vnode.attrs.onready === 'function') {
            vnode.attrs.onready()
        }
    })
}

MainWindow.view = function (vnode) {
    return m('div.mainwindow.uicontainer', [
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
                    m('li', m('a[href=""]', 'Changer de mot de passe...')),
                    m('li.divider'),
                    m('li', m('a[href="#"]', {onclick: () => vnode.attrs.app.user = null},'Se Déconnecter'))
                ])
            ]),
            m('ul.list-group', [
                m('li.list-group-item', m('div.form-group', [
                    m('label.control-label', {for: 'curWeek'}, 'Semaine fiscale'),
                    m('select.form-control#curWeek', {onchange: m.withAttr('value', this.curWeek)}, 
                        this.weeks.map((item) => {
                            return m('option', {value: item[0], selected: (item[0] === this.curWeek())}, item[1])
                        })
                    )
                ])),
                this.user.store !== '0' ? m('a[href="#"].list-group-item.active', [
                    m('h4.list-group-item-heading', 'Rédiger mon How\'s biz'),
                    m('p.list-group-item-text', 'Non commencé.')
                ]) : ''
            ]),
            m('div.list-wrapper', m('ul.list-group', [
                m('a[href="#"].list-group-item', m('div.media', [
                    m('div.media-left', m('div.bubble-item.col' + this.randomColor(), m('div.bubble-inner', '139'))),
                    m('div.media-body', [
                        m('div.media-heading.no-margin', 'Drummondville'),
                        m('span.badge.mr5', [m('span.mr5', '3'), m('span.glyphicon.glyphicon-heart')]),
                        m('span.badge', [m('span.mr5', '3'), m('span.glyphicon.glyphicon-eye-open')])
                    ])
                ])),
                m('a[href="#"].list-group-item', m('div.media', [
                    m('div.media-left', m('div.bubble-item.col' + this.randomColor(), m('div.bubble-inner', '333'))),
                    m('div.media-body', [
                        m('div.media-heading.no-margin', 'Rouyn-Noranda'),
                        m('span.badge.mr5', [m('span.mr5', '2'), m('span.glyphicon.glyphicon-heart')]),
                        m('span.badge', [m('span.mr5', '7'), m('span.glyphicon.glyphicon-eye-open')])
                    ])
                ])),
                m('a[href="#"].list-group-item', m('div.media', [
                    m('div.media-left', m('div.bubble-item.col' + this.randomColor(), m('div.bubble-inner', '427'))),
                    m('div.media-body', [
                        m('div.media-heading.no-margin', 'Beloeil'),
                        m('span.badge.mr5', [m('span.mr5', '9'), m('span.glyphicon.glyphicon-heart')]),
                        m('span.badge', [m('span.mr5', '17'), m('span.glyphicon.glyphicon-eye-open')])
                    ])
                ])),
                m('a[href="#"].list-group-item', m('div.media', [
                    m('div.media-left', m('div.bubble-item.col' + this.randomColor(), m('div.bubble-inner', '139'))),
                    m('div.media-body', [
                        m('div.media-heading.no-margin', 'Drummondville'),
                        m('span.badge.mr5', [m('span.mr5', '3'), m('span.glyphicon.glyphicon-heart')]),
                        m('span.badge', [m('span.mr5', '3'), m('span.glyphicon.glyphicon-eye-open')])
                    ])
                ])),
                m('a[href="#"].list-group-item', m('div.media', [
                    m('div.media-left', m('div.bubble-item.col' + this.randomColor(), m('div.bubble-inner', '333'))),
                    m('div.media-body', [
                        m('div.media-heading.no-margin', 'Rouyn-Noranda'),
                        m('span.badge.mr5', [m('span.mr5', '2'), m('span.glyphicon.glyphicon-heart')]),
                        m('span.badge', [m('span.mr5', '7'), m('span.glyphicon.glyphicon-eye-open')])
                    ])
                ])),
                m('a[href="#"].list-group-item', m('div.media', [
                    m('div.media-left', m('div.bubble-item.col' + this.randomColor(), m('div.bubble-inner', '427'))),
                    m('div.media-body', [
                        m('div.media-heading.no-margin', 'Beloeil'),
                        m('span.badge.mr5', [m('span.mr5', '9'), m('span.glyphicon.glyphicon-heart')]),
                        m('span.badge', [m('span.mr5', '17'), m('span.glyphicon.glyphicon-eye-open')])
                    ])
                ])),
                m('a[href="#"].list-group-item', m('div.media', [
                    m('div.media-left', m('div.bubble-item.col' + this.randomColor(), m('div.bubble-inner', '139'))),
                    m('div.media-body', [
                        m('div.media-heading.no-margin', 'Drummondville'),
                        m('span.badge.mr5', [m('span.mr5', '3'), m('span.glyphicon.glyphicon-heart')]),
                        m('span.badge', [m('span.mr5', '3'), m('span.glyphicon.glyphicon-eye-open')])
                    ])
                ])),
                m('a[href="#"].list-group-item', m('div.media', [
                    m('div.media-left', m('div.bubble-item.col' + this.randomColor(), m('div.bubble-inner', '333'))),
                    m('div.media-body', [
                        m('div.media-heading.no-margin', 'Rouyn-Noranda'),
                        m('span.badge.mr5', [m('span.mr5', '2'), m('span.glyphicon.glyphicon-heart')]),
                        m('span.badge', [m('span.mr5', '7'), m('span.glyphicon.glyphicon-eye-open')])
                    ])
                ])),
                m('a[href="#"].list-group-item', m('div.media', [
                    m('div.media-left', m('div.bubble-item.col' + this.randomColor(), m('div.bubble-inner', '427'))),
                    m('div.media-body', [
                        m('div.media-heading.no-margin', 'Beloeil'),
                        m('span.badge.mr5', [m('span.mr5', '9'), m('span.glyphicon.glyphicon-heart')]),
                        m('span.badge', [m('span.mr5', '17'), m('span.glyphicon.glyphicon-eye-open')])
                    ])
                ])),
                m('a[href="#"].list-group-item', m('div.media', [
                    m('div.media-left', m('div.bubble-item.col' + this.randomColor(), m('div.bubble-inner', '139'))),
                    m('div.media-body', [
                        m('div.media-heading.no-margin', 'Drummondville'),
                        m('span.badge.mr5', [m('span.mr5', '3'), m('span.glyphicon.glyphicon-heart')]),
                        m('span.badge', [m('span.mr5', '3'), m('span.glyphicon.glyphicon-eye-open')])
                    ])
                ])),
                m('a[href="#"].list-group-item', m('div.media', [
                    m('div.media-left', m('div.bubble-item.col' + this.randomColor(), m('div.bubble-inner', '333'))),
                    m('div.media-body', [
                        m('div.media-heading.no-margin', 'Rouyn-Noranda'),
                        m('span.badge.mr5', [m('span.mr5', '2'), m('span.glyphicon.glyphicon-heart')]),
                        m('span.badge', [m('span.mr5', '7'), m('span.glyphicon.glyphicon-eye-open')])
                    ])
                ])),
                m('a[href="#"].list-group-item', m('div.media', [
                    m('div.media-left', m('div.bubble-item.col' + this.randomColor(), m('div.bubble-inner', '427'))),
                    m('div.media-body', [
                        m('div.media-heading.no-margin', 'Beloeil'),
                        m('span.badge.mr5', [m('span.mr5', '9'), m('span.glyphicon.glyphicon-heart')]),
                        m('span.badge', [m('span.mr5', '17'), m('span.glyphicon.glyphicon-eye-open')])
                    ])
                ]))
            ]))
        ]),
        m('div.contentwindow', m(HBEditor, {parent: this}))
    ])
}

module.exports = MainWindow