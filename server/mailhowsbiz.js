const Mustache = require('mustache')
const fs = require('fs')
const sendMail = require('./sendmail.js')
const env = require('../env.json')
const path = require('path')
const {Database, hbSections, hbColorMap} = require('./data.js')

const mergeSections = function(hb) {
    return hbSections.map((sect) => {
        return {
            title: sect.title,
            color: hbColorMap[sect.color],
            subsections: sect.subsections.map((subsect) => {
                return {
                    title: subsect.title,
                    comment: hb.data[subsect.name] && hb.data[subsect.name]['comment'] || 'Aucun Commentaire.',
                    contributions: hb.data[subsect.name] && `Par: ${hb.data[subsect.name]['contributions'].join(', ')}` || ''
                }
            })
        }
    })
}

const mailHowsBiz = function(hb) {
    fs.readFile(path.join(__dirname, 'templates', 'howsbiz.mst'), 'utf8', (err, template) => {
        if (err) {
            console.log(err)
        } else {
            let hbtmpl = {
                store: hb.store,
                week: hb.week,
                picUrl: hb.picUrl,
                data: mergeSections(hb)
            }
            let html = Mustache.render(template.toString(), hbtmpl)
            Database.emailGetEmails(hb.store).then((emails) => {
                console.log(emails)
                sendMail({
                    from: '"How\'s Biz par J-F Desrochers" <' + env.GMAILADDR + '>',
                    to: 'martine.dessureault@staples.ca,' + emails.map((o) => o['email']).join(','),
                    subject: 'How\'s Biz magasin ' + hb.store + ' semaine ' + hb.week, 
                    text: '', 
                    html: html
                })
            })
        }
    })
}

module.exports = mailHowsBiz

let hb = {"_id":"5a82eac098f2f35087262d13","district":"19","store":"316","week":"2","data":{"salesOps":{"comment":"Suite au meeting des GM, nous utilisons maintenant la caisse 2 comme caisse principal afin de bénéficier de ventes supplémentaires suite aux marchandisage de la nouvelle section des caisses.\nNous avons toujours une presence de meuble en avant du magasin avec des chaises circulaires ce qui aide beaucoup dans nos ventes.","contributions":["Directeur Général Magasin 316","Directeur Magasin 316"]},"servCopy":{"comment":"Marie-France a réussit a obtenir l'opportunité de vendre des étiquettes à coller sur les produits de ventes de l'entreprise Nux.  La balle est à Nathalie Matteau, elle connait le prix du compétiteur et si elle peut livrer le même produit à un cout égal ou inférieur, on obtient une vente échelonné en 3 commandes de +- 15,000$.  Marie-France travail sur ce projet depuis plus d'un an afin de convaincre son client de nous essayer.  Notre client aimait le produit de son fournisseur et était très satisfait de ce qu'il avait, le travail de M-F constitue un excellent exemple de réseautage exceptionnel.","contributions":["Directeur Général Magasin 316"]},"servTech":{"comment":"Retour de Mélanie notre technicienne après 3 semaines d'absence justifié. Nous avons eu une vente de récuperation de donnée à 1400$, on ce croise les doigts qu'ils peuvent réussir à les récupérer.","contributions":["Directeur Général Magasin 316","Directeur Magasin 316"]},"devSchool":{"comment":"J'ai rencontré la directrice de l'école St-Jude  de Greenfield Park, je lui ai vendu 23 paquets de post it en coeur et lui ai remis le restant de mes cadeaux d'enseignant, je lui ai organisé également le ramassage des mêmes produits post it au 75-128-245.  Il s'agit de cadeau de la directrice  aux enseignants dans le cadre de la semaine des prof.  J'ai créer un bon lien avec la directrice.","contributions":["Directeur Général Magasin 316"]},"devStory":{"comment":"Gabriel (notre Superviseur des ventes) qui comprend très bien l'importance du réseautage a rencontré une entreprise en ingénierie qui s'établi à Montreal et qui a besoin d'un fournisseur tel que nous pour son bureau.  Gabriel voulait que je rencontre la cliente, mais elle n'était pas à l'aise... il lui a remis ma carte d'affaire, et j'ai reçu une demande de soumission pour environ 3,000$ pour ordinateur et logiciel.  Gabriel a également saisi une belle opportunité en abordant un client qui achetait 4 caisses de papier... il apprend qu'il s'agit d'une nouvelle entreprise qui oeuvre dans le milieu scolaire dans l'aide aux devoirs et le soutien scolaire.  Leur bureau sont en construction et leur carte d'affaire en infographie.  Je prend le puck et je vais aller livrer moi-même les caisses de papier afin d'en connaître plus et de développer.","contributions":["Directeur Général Magasin 316"]},"salesComp":{"comment":"","contributions":["Directeur Magasin 316"]},"devCom":{"comment":"","contributions":["Directeur Magasin 316"]},"salesInit":{"comment":"La catégorie 37 fait mal dans nos ventes comp à cause des logiciels POSA car on aurait bien fait sinon, on a perdu 4000$ et le magasin -2150$.\n\nNous avons nommé un champion dans les imprimantes, il met en place les bon deals du circulaire et les bundles aussi. Nous avons augmenter dans nos attachements d'imprimantes considerablement et on a fait +2600$ dans cette catégorie la semaine passée.\n\nLa demo du Whoosh de samedi a bien fonctionné, la presence de l'associé a fait tout une difference dans le moment achalandé, plus de une dizaine de vendu.","contributions":["Directeur Magasin 316"]}},"picUrl":"https://www.dropbox.com/s/6tzt0p33re70t1h/2.jpg?raw=1","views":{"Directeur Magasin 316":1,"Directeur Magasin 40":1,"Directeur Magasin 88":1,"Directeur Magasin 139":1},"likes":{},"comments":{},"status":"published","lastModified":"2018-02-18T16:42:20.646Z"}
mailHowsBiz(hb)