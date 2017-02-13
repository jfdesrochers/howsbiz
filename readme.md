# How's Biz par Jean-François Desrochers

### Pré-Requis

* Node JS [https://nodejs.org/en/](https://nodejs.org/en/)
* Git [https://git-scm.com/](https://git-scm.com/)

### Installation

#### Télécharger et installer les dépendances

```bash
git clone https://github.com/jfdesrochers/howsbiz.git
cd howsbiz
npm install
```

#### Installer Electron

```bash
npm install -g electron
```

#### Créer un env.json

Ce fichier contient les mots de passes et clé d'API nécessaires pour l'utilisation des services dont How's Biz dépends.

Les services requis sont les suivants :

* Un serveur MongoDB, vous pouvez en créer un gratuitement sur [https://www.mlab.com](https://www.mlab.com)
* Un compte Dropbox, qui sera utilisé pour télécharger les images. Une fois le compte créé, vous devez générer [une clé d'application](https://blogs.dropbox.com/developers/2014/05/generate-an-access-token-for-your-own-account/).
* Un compte GMail, qui sera utilisé pour envoyer des courriels de notification et pour les partages. Vous devrez activer [l'accès aux applications moins sécuritaires](https://support.google.com/accounts/answer/6010255?hl=fr).

Une fois les services préparés, créez un fichier `env.json` dans le dossier `howsbiz` :

```javascript
{
    "DBURL": "", // URL de connexion à la base de donnée MongoDB.
    "DROPBOXTOKEN": "", // Clé d'application Dropbox (Access Token). 
    "GMAILADDR": "", // Coordonnées GMail.
    "GMAILUSER": "",
    "GMAILPASS": ""
}
```

### Exécuter

```bash
electron .
```