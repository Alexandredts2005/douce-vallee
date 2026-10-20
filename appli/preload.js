'use strict';
// le jeu sait qu'il tourne dans l'appli Windows (résolution native, qualité maximale, carte graphique dédiée)
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('DV_DESKTOP', { app: 'windows', electron: process.versions.electron, chrome: process.versions.chrome });
