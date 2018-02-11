const monthsfr = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const shortmonthsfr = ['jan', 'fév', 'mars', 'avr', 'mai', 'juin', 'jui', 'août', 'sept', 'oct', 'nov', 'déc']

const zfill = function(s) {
    return ('0' + s).slice(-2);
}

const getClock = function() {
    let d = new Date();
    let w = getFiscalWeek(d)
    return `${d.getDate()} ${shortmonthsfr[d.getMonth()]} ${d.getHours()}:${zfill(d.getMinutes())}:${zfill(d.getSeconds())}<br>Semaine ${w}`;
}

const getWeekDiff = function(d, week1) {
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 4 + (week1.getDay() + 7) % 7) / 7);
}

const getFiscalWeek = function(date) {
    let d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() + 7) % 7);
    let week1 = new Date(d.getFullYear(), 1, 4);
    let wkdiff = getWeekDiff(d, week1);
    if (wkdiff < 1) {
        week1 = new Date(d.getFullYear()-1, 1, 4);
        wkdiff = getWeekDiff(d, week1);
    }
    return wkdiff;
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

const getAllWeeks = function(forLastWeek) {
    let today = new Date();
    if (forLastWeek) today = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
    today.setHours(0, 0, 0, 0);
    const curYear = getWeekDiff(today, new Date(today.getFullYear(), 1, 4)) < 1 ? today.getFullYear() - 1 : today.getFullYear();
    let d = new Date(curYear, 1, 4);
    d.setDate(d.getDate() - (d.getDay() + 7) % 7); // First day of this year
    let n = new Date(curYear+1, 1, 4);
    n.setDate(n.getDate() - (n.getDay() + 7) % 7); // First day of next year
    const weeks = [];
    let i = 1
    while (d < n) {
        let ld = new Date(d.getTime());
        ld.setDate(ld.getDate() + 6);
        weeks.push([i, 'Semaine ' + i + ' (' + d.getDate() + ' ' + shortmonthsfr[d.getMonth()] + ' ' + d.getFullYear() + ' au ' + ld.getDate() + ' ' + shortmonthsfr[ld.getMonth()] + ' ' + ld.getFullYear() + ')']);
        d.setDate(d.getDate() + 7);
        i++;
    }
    return weeks
}

module.exports.getWeekNo = getWeekNo
module.exports.getAllWeeks = getAllWeeks
module.exports.getClock = getClock