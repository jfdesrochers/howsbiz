const monthsfr = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const shortmonthsfr = ['jan', 'fév', 'mars', 'avr', 'mai', 'juin', 'jui', 'août', 'sept', 'oct', 'nov', 'déc']

const getFiscalWeek = function(date) {
    let d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() + 7) % 7);
    let week1 = new Date(d.getFullYear(), 1, 4); 
    let wkdiff = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 4 + (week1.getDay() + 7) % 7) / 7);
    return (wkdiff < 1) ? 52 - Math.abs(wkdiff) : wkdiff;
};

const getWeekNo = function(forLastWeek) {
    let today = new Date();
    if (forLastWeek) {
        let lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
        return getFiscalWeek(lastWeek);
    } else {
        return getFiscalWeek(today);
    }
}

const getAllWeeks = function() {
    const curYear = new Date().getFullYear()
    let d = new Date(curYear, 1, 4);
    const weeks = []
    d.setDate(d.getDate() - (d.getDay() + 7) % 7);
    for (let i = 1; i <= 52; i++) {
        let ld = new Date(d.getTime())
        ld.setDate(ld.getDate() + 6)
        weeks.push([i, 'Semaine ' + i + ' (' + d.getDate() + ' ' + shortmonthsfr[d.getMonth()] + ' ' + d.getFullYear() + ' au ' + ld.getDate() + ' ' + shortmonthsfr[ld.getMonth()] + ' ' + ld.getFullYear() + ')'])
        d.setDate(d.getDate() + 7);
    }
    return weeks
}

module.exports.getWeekNo = getWeekNo
module.exports.getAllWeeks = getAllWeeks