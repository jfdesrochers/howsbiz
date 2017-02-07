const m = require('mithril')
const $ = window.$ || require('../../vendor/js/jquery-2.2.4.min.js')

const AppLoader = {}

AppLoader.status = {
    message: 'Bienvenue!',
    isError: false,
    msg: function (msg) {
        this.message = msg
        this.isError = false
        m.redraw()
    },
    err: function (msg) {
        this.message = msg
        this.isError = true
        m.redraw()
    }
}

AppLoader.oncreate = function (vnode) {
    $(vnode.dom).fadeIn('slow', () => {
        if (typeof vnode.attrs.onready === 'function') {
            vnode.attrs.onready()
        }
    })
}

AppLoader.view = function () {
    return m('div.apploader.uicontainer', 
        m('div.row', 
            m('div.col-xs-6.col-xs-offset-3', [
                m('img.mainlogo', {src: './assets/img/logo.svg'}),
                m('p.lead' + (AppLoader.status.isError ? '.text-danger' : ''), AppLoader.status.message)
            ])
        )
    )
}

module.exports = AppLoader