# 🌍 Guide : Jouer depuis n'importe où dans le monde

## Vue d'ensemble

Le jeu utilise maintenant un **serveur mondial gratuit sur Render.com**. Une fois déployé, n'importe qui — même en Afrique, en Asie, en Amérique — peut jouer avec son code ami. **Ton PC n'a pas besoin d'être allumé.**

---

## Étape 1 : Créer un compte GitHub (si pas déjà fait)

1. Va sur **https://github.com/signup**
2. Crée un compte gratuit

---

## Étape 2 : Pousser le projet sur GitHub

### Option A : Via l'interface GitHub (plus simple)

1. Va sur **https://github.com/new**
2. Nomme le repo `douce-vallee` (ou ce que tu veux)
3. Laisse-le **Public** (requis pour Render gratuit)
4. **Ne coche pas** "Add README" (le projet en a déjà un)
5. Clique **Create repository**
6. GitHub affiche des commandes — copie les 2 dernières qui ressemblent à :
   ```
   git remote add origin https://github.com/TON_PSEUDO/douce-vallee.git
   git push -u origin master
   ```
7. Colle-les dans un terminal ouvert dans le dossier du projet

### Option B : GitHub Desktop (interface graphique)

1. Télécharge **GitHub Desktop** sur https://desktop.github.com
2. Ouvre l'app → File → Add Local Repository → sélectionne le dossier du projet
3. Publie le repo sur GitHub avec le bouton "Publish repository"

---

## Étape 3 : Déployer sur Render.com

1. Va sur **https://render.com** → crée un compte gratuit (avec GitHub)
2. Clique **New** → **Web Service**
3. Connecte ton repo GitHub `douce-vallee`
4. Configure le service :
   | Champ | Valeur |
   |-------|--------|
   | **Name** | `douce-vallee` (ou ce que tu veux) |
   | **Region** | Frankfurt (EU) — pour la France/Afrique |
   | **Branch** | `master` |
   | **Runtime** | `Node` |
   | **Build Command** | *(laisser vide)* |
   | **Start Command** | `node serve.js` |
   | **Instance Type** | **Free** |
5. Clique **Create Web Service**
6. Attends 2-3 minutes que ça se déploie ☕
7. Render t'affiche une URL comme `https://douce-vallee-xxxx.onrender.com`
8. **Copie cette URL** — c'est l'URL mondiale de ton jeu !

> ⚠️ **Note Render Plan Gratuit** : Le serveur "dort" après 15 min d'inactivité. La première connexion prend ~30 secondes pour le réveiller. C'est normal et gratuit !

---

## Étape 4 : Configurer le jeu pour se connecter au serveur Render

### Si tu joues depuis le fichier local (double-clic sur index.html)

1. Lance le jeu
2. Va à la **gare** dans ton village
3. Parle à l'agent de la gare → choisis **"🌍 Serveur mondial (Render)"**
4. Entre l'URL Render : `https://douce-vallee-xxxx.onrender.com`
5. Clique **Connecter**
6. Le badge "🌍 En ligne" apparaît → tu es connecté !

### Si tu héberges le jeu sur Render (accès via l'URL Render)

Rien à faire ! Si tu ouvres `https://douce-vallee-xxxx.onrender.com` dans le navigateur, le jeu et le serveur sont automatiquement connectés.

---

## Étape 5 : Partager avec tes amis

1. Donne-leur l'URL du jeu : `https://douce-vallee-xxxx.onrender.com`
   OU ils peuvent jouer depuis leur propre copie en configurant la même URL serveur
2. Partage ton **code ami** (visible dans le menu gare ou sur l'écran de sélection de session)
3. Ils entrent ton code ami → prennent le train → arrivent dans ton village ! 🚂

---

## Structure du système de connexion

```
┌─────────────┐         ┌────────────────────────────┐
│ Ton PC      │         │ Render.com (gratuit)        │
│ (local)     │◄───────►│ https://xxx.onrender.com   │
└─────────────┘  WebSocket │ serve.js (Node.js)        │
                           └────────────────────────────┘
                                        ▲
                           ┌────────────┴───────────┐
                           │ Amis depuis partout     │
                           │ 🇫🇷 France              │
                           │ 🇸🇳 Afrique             │
                           │ 🌏 Asie                 │
                           └────────────────────────┘
```

---

## Mise à jour du serveur après modifications

Après chaque modification du code :
```powershell
git add .
git commit -m "Mes modifications"
git push
```
Render redéploie automatiquement en 1-2 minutes ! ✅

---

## FAQ

**Q : Mes données de village sont-elles perdues si Render redémarre ?**  
R : Sur le plan gratuit, oui — les données en RAM se perdent au redémarrage. Pour sauvegarder, monte un **Disk** Render (plan payant) ou les villages seront republiés automatiquement dès que les joueurs ouvrent leur jeu.

**Q : Combien de joueurs simultanés ?**  
R : Le plan gratuit Render gère facilement 10-20 joueurs. Pour plus, il faudra un plan payant.

**Q : Le serveur est lent à se lancer ?**  
R : Normal ! Le plan gratuit "dort" après 15 min d'inactivité. La première connexion prend ~30s. Ensuite c'est rapide.

**Q : Puis-je utiliser mon propre domaine ?**  
R : Oui, Render permet de configurer un domaine personnalisé même sur le plan gratuit.
