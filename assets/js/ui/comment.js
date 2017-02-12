const m = require('mithril')
const Property = require('../utils/Property.js')
const {MediumEditor} = require('../../vendor/js/medium-editor.min.js')
const $ = window.$ || require('../../vendor/js/jquery-2.2.4.min.js')

const AddComment = {}

AddComment.oninit = function (vnode) {
    this.comment = Property('')
    this.doClose = (e) => {
        e.preventDefault()
        if (typeof vnode.attrs.done === 'function') {
            vnode.attrs.done(this.comment())
        }
    }
}

AddComment.oncreate = function () {
    this.editor = new MediumEditor('.commenteditor', {
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
        autoLink: true,
        elementsContainer: document.getElementById('addcomment')
    })
}

AddComment.view = function () {
    return m(".modal.fade#addcomment[tabindex='-1']", {
            'data-backdrop': 'static',
            oncreate: (vdom) => {
                $(vdom.dom).modal('show')
                $(vdom.dom).on('hidden.bs.modal', this.doClose)
                $(vdom.dom).on('shown.bs.modal', () => $('#commentEdit').focus())
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
                    m('div#commentEdit.commenteditor')
                ]),
				m(".modal-footer", [
					m("button.btn.btn-default", {'data-dismiss': 'modal'}, 'Annuler'),
					m("button.btn.btn-primary", {onclick: () => {
                        this.comment(this.editor.getContent(0))
                        $('#addcomment').modal('hide')
                    }}, 'Sauvegarder')
				])
			])
		])
	])
}

module.exports = AddComment