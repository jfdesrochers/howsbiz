const m = require('mithril')
const Property = require('../utils/Property.js')
const Autogrow = require('textarea-autogrow')
const $ = window.$ || require('jquery')

const AddComment = {}

AddComment.oninit = function (vnode) {
    this.comment = Property('')
    this.save = false
    this.doClose = (e) => {
        e.preventDefault()
        if (this.save && typeof vnode.attrs.done === 'function') {
            vnode.attrs.done(this.comment())
        }
    }
}

AddComment.view = function () {
    return m(".modal.fade#addcomment[tabindex='-1']", {
            'data-backdrop': 'static',
            oncreate: (vdom) => {
                $(vdom.dom).modal('show')
                $(vdom.dom).on('hidden.bs.modal', this.doClose)
                $(vdom.dom).on('shown.bs.modal', () => {
                    const commentEditor = $('#commentEdit')
                    const autogrow = new Autogrow(commentEditor.get(0))
                    autogrow.autogrowFn() // To make it grow on the default value.
                    commentEditor.focus()
                })
            },
        }, [
		m(".modal-dialog", [
			m(".modal-content", [
				m(".modal-header", [
					m("button.close", {'data-dismiss': 'modal'}, m("span", "×")),
					m("h4.modal-title", "Ajouter un commentaire")
				]),
				m(".modal-body", [
                    'Écrivez votre commentaire ci-dessous :',
                    m('textarea#commentEdit.commenteditor', {
                        placeholder: 'Écrivez votre commentaire ici...',
                        value: this.comment(),
                        oninput: m.withAttr('value', this.comment)
                    })
                ]),
				m(".modal-footer", [
					m("button.btn.btn-default", {'data-dismiss': 'modal'}, 'Annuler'),
					m("button.btn.btn-primary", {onclick: () => {
                        this.save = true
                        $('#addcomment').modal('hide')
                    }}, 'Sauvegarder')
				])
			])
		])
	])
}

module.exports = AddComment