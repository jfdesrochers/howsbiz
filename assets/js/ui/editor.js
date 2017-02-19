const m = require('mithril')
const MediumEditor = require('../../vendor/js/medium-editor.min.js')
const Property = require('../utils/Property.js')
const {Database} = require('../data.js')
const $ = window.$ || require('jquery')
const _ = require('lodash')

const HBEditor = {}

HBEditor.oninit = function (vnode) {
    const MAX_HEIGHT = 420
    this.parent = vnode.attrs.parent
    this.newHB = () => {
        return {
            district: this.parent.user.district,
            store: this.parent.user.store,
            week: this.parent.curWeek(),
            salesCom: '',
            salesCont: [],
            servCom: '',
            servCont: [],
            devCom: '',
            devCont: [],
            picUrl: '',
            views: {},
            likes: {},
            comments: {},
            status: 'editing'
        }
    }
    this.HB = vnode.attrs.HB || this.newHB()
    this.HBData = vnode.attrs.HBData
    this.contributions = {
        'salesCom': false,
        'servCom': false,
        'devCom': false
    }
    this.imgError = Property('')
    this.imgSrc = Property(this.HB.picUrl)
    this.imgLoading = Property(false, () => {m.redraw()})

    this.saveInterval = null
    this.doSave = () => {
        if (!this.parent.editorDirty()) return
        return new Promise((resolve, reject) => {
            this.saving(true)
            let userid = this.parent.user._id
            if (this.contributions.salesCom && _.indexOf(this.HB.salesCont, userid) === -1) {
                this.HB.salesCont.push(userid)
            }
            if (this.contributions.servCom && _.indexOf(this.HB.servCont, userid) === -1) {
                this.HB.servCont.push(userid)
            }
            if (this.contributions.devCom && _.indexOf(this.HB.devCont, userid) === -1) {
                this.HB.devCont.push(userid)
            }
            Database.saveHB(this.HB)
            .then((newHB) => {
                _.assign(this.HB, newHB)
                this.parent.editorDirty(false)
                this.saving(false)
                resolve()
            })
            .catch((err) => {
                console.log('Error [MongoDB] ' + err.errmsg)
                this.parent.dbError('Une erreur est survenue lors de la sauvegarde. Merci de réessayer.')
                this.saving(false)
                reject(err)
            })
        })
    }
    this.saving = Property(false, () => {m.redraw()})

    this.render = (src, resize, callback) => {
        let image = new Image();
        image.onload = function(){
                let canvas = document.createElement('canvas');
                if((resize) && (image.height > MAX_HEIGHT)) {
                    image.width *= MAX_HEIGHT / image.height;
                    image.height = MAX_HEIGHT;
                }
                let ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image, 0, 0, image.width, image.height);
                if (callback) {
                    callback(canvas.toDataURL("image/jpeg"));
                }
        };
        image.src = src;
    }

    this.loadImage = (files) => {
        if (files.length > 0) {
            this.imgLoading(true)
            this.imgError('');
            let src = files[0]
            if(!src.type.match(/image.*/)){
                this.imgError("Le fichier chargé n'est pas une image valide: " + src.type + ". Merci de charger une image.");
                this.imgLoading(false)
                return;
            }
            let reader = new FileReader();
            reader.onload = (e) => {
                this.render(e.target.result, true, (img) => {
                    Database.uploadFile(this.parent.user.store, this.parent.curWeek(), img)
                    .then ((url) => {
                        this.parent.editorDirty(true)
                        this.HB.picUrl = url.url
                        this.imgSrc(url.url + '&_t=' + new Date().getTime())
                        this.imgLoading(false)
                    })
                    .catch ((err) => {
                        console.log('Error [Dropbox] ', err.errmsg)
                        this.imgError('Une erreur est survenue lors du chargement de votre image. Merci de réessayer.')
                        this.imgLoading(false)
                    })
                });
            };
            reader.readAsDataURL(src);
        }
    }
}

HBEditor.oncreate = function () {
    $('.contentwindow').scrollTop(0)
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
        autoLink: true,
        targetBlank: true
    })
    this.editor.setContent(this.HB.salesCom, 0)
    this.editor.setContent(this.HB.servCom, 1)
    this.editor.setContent(this.HB.devCom, 2)
    this.editor.subscribe('editableInput', (event, editable) => {
        this.parent.editorDirty(true)
        let idx = editable.getAttribute('data-editindex')
        switch(idx) {
            case '0':
                this.HB.salesCom = this.editor.getContent(0)
                this.contributions.salesCom = true
                break
            case '1':
                this.HB.servCom = this.editor.getContent(1)
                this.contributions.servCom = true
                break
            case '2':
                this.HB.devCom = this.editor.getContent(2)
                this.contributions.devCom = true
                break
        }
    });
    this.saveInterval = setInterval(this.doSave, 15000)
}

HBEditor.onremove = function () {
    clearInterval(this.saveInterval)
    if (this.parent.editorDirty()) {
        this.doSave()
    }
}

HBEditor.view = function () {
    return m('div.hbeditor', [
        m('h1', 'Mon How\'s Biz'),
        m('div.lead', this.parent.weeks[this.parent.curWeek() - 1][1]),
        m('div.panel.panel-primary', [
            m('div.panel-heading', m('h3.panel-title', 'Ventes')),
            m('div.panel-body', m('div#salesEdit.editor', {
                'data-editindex': 0, 
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
                'data-editindex': 1,
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
                'data-editindex': 2,
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
        ]),
        m('div.panel.panel-default', [
            m('div.panel-heading', m('h3.panel-title', 'Photo')),
            m('div.panel-body.text-center', 
                this.imgError().length ? m('div.alert.alert-warning', this.imgError()) :
                this.imgLoading() ? m('div.alert.alert-info.pulsing', 'Chargement en cours...') :
                this.imgSrc().length ? m('img', {src: this.imgSrc()}) : ''
            ),
            m('div.panel-footer.clearfix', [
                m("span.btn.btn-primary.btn-file.pull-right", [
                    m("span#browsecaption", "Choisir une image..."),
                    m("input", {type: "file", onchange: m.withAttr("files", this.loadImage)})
                ]),
                'Choisissez une photo qui représente vos façons d\'innover pour rapporter des ventes cette semaine.'
            ])
        ]),
        m('button.btn.btn-success.pull-right' + (this.saving() ? '.disabled' : ''), {onclick: () => {
            this.HB.status = 'published'
            this.parent.editorDirty(true)
            this.doSave()
            .then(() => {
                let oid = this.HB._id
                if (this.HBData.hbs[oid]) {
                    _.assign(this.HBData.hbs[oid], this.HB)
                } else {
                    this.HBData.hbs[oid] = this.HB
                }
                this.parent.hasEditor(false)
                this.parent.curView(oid)
                m.redraw()
            })
        }}, this.saving() ? 'Sauvegarde en cours...' : 'Publier mon How\'s Biz!'),
        m('button.btn.btn-primary.pull-left' + (!this.parent.editorDirty() || this.saving() ? '.disabled' : ''), {onclick: this.doSave}, this.parent.editorDirty() ? (this.saving() ? 'Sauvegarde en cours...' : 'Sauvegarder...') : 'Sauvegardé')
    ])
}

module.exports = HBEditor