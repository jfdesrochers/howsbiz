const h2p = require('html2plaintext')

const summarize = function(o) {
    o = h2p(o.replace(/<h[1-6]>.+<\/h[1-6]>/gi, '')).replace(/\n/gi, ' ')
    let trimmedString = o.substr(0, 140);
    trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" "))) + '...'
    return trimmedString
}

module.exports.summarize = summarize