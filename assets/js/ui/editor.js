const m = require('mithril')
const Property = require('../utils/Property.js')
const {toggleLoadIcon} = require('../utils/misc')
const {Database, hbSections} = require('../data.js')
const $ = window.$ || require('jquery')
const _ = require('lodash')
const Autogrow = require('textarea-autogrow')

const HBEditor = {}

HBEditor.oninit = function (vnode) {
    const MAX_HEIGHT = 420
    this.parent = vnode.attrs.parent
    this.newHB = () => {
        return {
            district: this.parent.user.district,
            store: this.parent.user.store,
            week: this.parent.curWeek(),
            data: {},
            picUrl: '',
            views: {},
            likes: {},
            comments: {},
            status: 'editing'
        }
    }
    this.HB = vnode.attrs.HB || this.newHB()
    this.HBData = vnode.attrs.HBData
    this.contributions = {}
    this.imgError = Property('')
    this.imgSrc = Property(this.HB.picUrl)
    this.imgLoading = Property(false, () => {m.redraw()})

    this.saveInterval = null
    this.doSave = () => {
        if (!this.parent.editorDirty()) return
        toggleLoadIcon(true)
        return new Promise((resolve, reject) => {
            this.saving(true)
            Database.saveHB(this.HB)
            .then((newHB) => {
                _.assign(this.HB, newHB)
                this.HBData.hbs[this.HB._id] = this.HB
                this.parent.myHB(this.HB._id)
                this.parent.editorDirty(false)
                this.saving(false)
                toggleLoadIcon(false)
                resolve()
            })
            .catch((err) => {
                console.log('Error [MongoDB] ' + err.errmsg)
                this.parent.dbError('Une erreur est survenue lors de la sauvegarde. Merci de réessayer.')
                this.saving(false)
                toggleLoadIcon(false)
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

    this.onEditorInput = (name) => (e) => {
        let value = e.target.value
        this.HB.data[name] ? this.HB.data[name]['comment'] = value : this.HB.data[name] = {comment: value, contributions: []}
        _.indexOf(this.HB.data[name]['contributions'], this.parent.username) === -1 && this.HB.data[name]['contributions'].push(this.parent.username)
        this.parent.editorDirty(true)
    }
}

HBEditor.oncreate = function () {
    $('.contentwindow').scrollTop(0)
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
        hbSections.map((sect) => {
            return m(`div.panel.panel-${sect.color}`, {key: sect.name}, [
                m('div.panel-heading', m('h3.panel-title', sect.title)),
                m('div.list-group', sect.subsections.map((subsect) => {
                    return m('div.list-group-item', {key: subsect.name}, [
                        m('h4.list-group-item-heading', subsect.title),
                        m('textarea.list-group-item-text.editor', {
                            oncreate: (vnode) => {
                                vnode.state.autogrow = new Autogrow(vnode.dom)
                                vnode.state.autogrow.autogrowFn() // To make it grow on the default value.
                            },
                            onfocus: (e) => {
                                e.target.parentElement.classList.add("focused"),
                                e.redraw = false
                            },
                            onblur: (e) => {
                                e.target.parentElement.classList.remove("focused"),
                                e.redraw = false
                            },
                            placeholder: 'Écrivez votre commentaire ici...',
                            value: this.HB.data[subsect.name] && this.HB.data[subsect.name]['comment'] || '',
                            oninput: this.onEditorInput(subsect.name)
                        })
                    ])
                })),
                m('div.panel-footer', m.trust(sect.helptext))
            ])
        }),
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
                /*m.request({
                    method: 'post',
                    url: '/sendemails',
                    data: this.HB
                })*/
            })
        }}, this.saving() ? 'Sauvegarde en cours...' : 'Publier mon How\'s Biz!'),
        m('button.btn.btn-primary.pull-left' + (!this.parent.editorDirty() || this.saving() ? '.disabled' : ''), {onclick: this.doSave}, this.parent.editorDirty() ? (this.saving() ? 'Sauvegarde en cours...' : 'Sauvegarder...') : 'Sauvegardé')
    ])
}

module.exports = HBEditor