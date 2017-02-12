///////////////////////////
// Property
// Defines a basic getter/setter
//
// usage: let myprop = Property('hello', [callback])
// Will create variable myprop with default value 'hello'
// Set / Change value: myprop('newvalue')
// Get value: myprop()
//
// If you set a callback, it will be called when you set a new value

const Property = function (defaultProp, callback) {
    let curValue = defaultProp
    return function (propValue) {
        if (propValue !== undefined) {
            let oldValue = curValue
            curValue = propValue
            if (typeof callback === 'function') {
                callback(propValue, oldValue)
            }
        }
        return curValue
    }
}

module.exports = Property