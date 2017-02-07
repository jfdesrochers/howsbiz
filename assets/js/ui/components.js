const m = require('mithril')

///////////////////////////
// ValidatingInput
// usage: m(ValidatingInput, {options: {options})
//
// options:
// name: input id
// type: input type
// label: input label
// validPattern: RegEx indicating the valid pattern
// onvalidate(text): Function called during validation. text contains the field value. Must return true|false
//                   if it passes validation or not.
// onchange(text): Function called if selection changes. text contains new the new field value.
// stdMessage: Message to be displayed in the default state (e.g. help text)
// errMessage: Message to be displayed in case of failed validation
// showValid: indicates whether or not to show feedback if the field is valid (default: false)
// fieldValue: Pass a Property that will hold the field's value
// actions: {} : will push an object containing methods validate and reset to a key named after the fieldname
// actions.validate(): starts validation using the first available method in that order:
//                     1. If you explicitely specify a validation state and message as parameters, they will be used as is
//                     2. If onvalidate is assigned, will use the provided function to validate.
//                     3. Else, will use validPattern to validate.
// actions.reset(): resets the validation state to default
const ValidatingInput = {}

ValidatingInput.oninit = function (vnode) {
    const options = vnode.attrs.options
    options.showValid = options.showValid || false
    options.actions[options.name] = {}
    options.actions[options.name].reset = () => {
        this.hasValidation = false
        this.isValid = false
        this.validMessage = options.stdMessage || ''
        m.redraw()
    }
    options.actions[options.name].validate = (valid, message) => {
        if ((valid !== undefined) && (message !== undefined)) {
            this.isValid = valid
            this.validMessage = this.isValid ? (options.showValid ? '' : options.stdMessage || '') : message || ''
        } else if (typeof options.onvalidate === 'function') {
            this.isValid = options.onvalidate(this.fieldValue())
            this.validMessage = this.isValid ? (options.showValid ? '' : options.stdMessage || '') : options.errMessage || ''
        } else {
            let pattern = options.validPattern || /.*/gi
            this.isValid = this.fieldValue().match(pattern)
            this.validMessage = this.isValid ? (options.showValid ? '' : options.stdMessage || '') : options.errMessage || ''
        }
        this.hasValidation =  this.isValid ? options.showValid : true
        m.redraw()
        return this.isValid
    }
    this.hasValidation = false
    this.isValid = false
    this.validMessage = options.stdMessage || ''
    this.fieldValue = options.fieldValue
    this.fieldChange = (e) => {
        if (typeof options.onchange === 'function') options.onchange(e.target.value)
        this.fieldValue(e.target.value)
    }
}

ValidatingInput.view = function (vnode) {
    const options = vnode.attrs.options
    return m('div.form-group' + (this.hasValidation ? '.has-feedback' + (this.isValid ? '.has-success' : '.has-error') : ''), [
                m('label.control-label', {for: options.name}, options.label),
                m('input.form-control#' + options.name, {type: options.type, onchange: this.fieldChange, value: this.fieldValue()}),
                this.hasValidation ? m('span.glyphicon.form-control-feedback' + (this.isValid ? '.glyphicon-ok' : '.glyphicon-remove')) : '',
                this.validMessage !== '' ? m('span.help-block', this.validMessage) : ''
            ])
}

module.exports.ValidatingInput = ValidatingInput

///////////////////////////
// ValidatingSelect
// usage: m(ValidatingSelect, {options: {options})
// name: input id
// label: input label
// choices: array containing [value, label] pairs for the select control choices
// onvalidate(value): Function called during validation. value contains the field value. Must return true|false
//                   if it passes validation or not.
// onchange(value): Function called if selection changes. value contains new the new field value.
// stdMessage: Message to be displayed in the default state (e.g. help text)
// errMessage: Message to be displayed in case of failed validation
// showValid: indicates whether or not to show feedback if the field is valid (default: false)
// fieldValue: Pass a Property that will hold the field's value
// actions: {} : will push an object containing methods validate and reset to a key named after the fieldname
// actions.validate(): starts validation. you must have provided onvalidate function for it to work.
// actions.reset(): resets the validation state to default
const ValidatingSelect = {}

ValidatingSelect.oninit = function (vnode) {
    const options = vnode.attrs.options
    options.showValid = options.showValid || false
    options.default = options.default === undefined ? -1 : options.default
    options.actions[options.name] = {}
    options.actions[options.name].reset = () => {
        this.hasValidation = false
        this.isValid = false
        this.validMessage = options.stdMessage || ''
        m.redraw()
    }
    options.actions[options.name].validate = (valid, message) => {
        if ((valid !== undefined) && (message !== undefined)) {
            this.isValid = valid
            this.validMessage = this.isValid ? (options.showValid ? '' : options.stdMessage || '') : message || ''
        } else if (typeof options.onvalidate === 'function') {
            this.isValid = options.onvalidate(this.fieldValue())
            this.validMessage = this.isValid ? (options.showValid ? '' : options.stdMessage || '') : options.errMessage || ''
        }
        this.hasValidation =  this.isValid ? options.showValid : true
        m.redraw()
        return this.isValid
    }
    this.hasValidation = false
    this.isValid = false
    this.validMessage = options.stdMessage || ''
    this.fieldValue = options.fieldValue
    this.fieldChange = (e) => {
        if (typeof options.onchange === 'function') options.onchange(e.target.value)
        this.fieldValue(e.target.value)
    }
}

ValidatingSelect.view = function (vnode) {
    const options = vnode.attrs.options
    return m('div.form-group' + (this.hasValidation ? '.has-feedback' + (this.isValid ? '.has-success' : '.has-error') : ''), [
                m('label.control-label', {for: options.name}, options.label),
                m('select.form-control#' + options.name, {onchange: this.fieldChange}, 
                    options.choices.map((item) => {
                        return m('option', {value: item[0], selected: (item[0] === this.fieldValue())}, item[1])
                    })
                ),
                this.validMessage !== '' ? m('span.help-block', this.validMessage) : ''
            ])
}

module.exports.ValidatingSelect = ValidatingSelect