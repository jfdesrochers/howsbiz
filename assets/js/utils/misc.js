const m = require('mithril')

const UniqueRandom = function (min, max, shouldReset) {
    shouldReset = shouldReset || false
    const numbers = [] 
    const reset = () => {
        for (let i=min; i<=max; i++) {
            numbers.push(i)
        }
    }
    return function () {
        if (numbers.length > 0) {
            return numbers.splice(Math.floor(Math.random() * numbers.length), 1)[0]
        } else if (shouldReset) {
            reset()
            return numbers.splice(Math.floor(Math.random() * numbers.length), 1)[0]
        } else {
            return null
        }
    }
}

module.exports.UniqueRandom = UniqueRandom

const ModalWindow = function(component, attrs) {
    return {
        view: function () {
            return m(component, attrs)
        }
    }
}

module.exports.ModalWindow = ModalWindow