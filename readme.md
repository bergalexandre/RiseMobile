# Rise BluetoothToMqtt

# Politique de confidentialité
L'application receuille des données de localisations et de télémétries. Ces données ne sont pas préservé de façon confidentiels et peuvent être enregistrées. 


# Application
L'application va transférer le data du véhicule rise vers une destination de notre choix.

Pour déterminer la position du véhicule, j'ai utilisé le package [expo-location](https://docs.expo.dev/versions/latest/sdk/location/)
bluetooth? https://blog.expo.dev/so-you-want-to-build-a-bluetooth-app-with-react-native-and-expo-6ea6a31a151d
## Utilisation:

* Utiliser la commande suivante pour builder et démarrer un android virtuel: ``` tns run android ```

## Setup

### Configuration du poste avec Chocolatey

1. Installer android studio et après dans *tools* -> *SDK Manager* ajouter **android api 32** et **android 11.0(R)**
   1. Configurer les variables systèmes suivantes:
      1. ANDROID_HOME = C:\Users\alexandre.bergeron\AppData\Local\Android\Sdk (exemple, changer votre nom de user et pour moi la variable d'environnement faisait chier les commandes donc j'ai mis le full path)
      1. platform-tools = %LOCALAPPDATA%\Android\Sdk\platform-tools
2. Rouler le script console suivant:
```
@powershell -NoProfile -ExecutionPolicy unrestricted -Command "iex ((new-object net.webclient).DownloadString('https://chocolatey.org/install.ps1'))" && SET PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin
```

3. En powershell, permettre l'exécution de commandes
```
Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

4. Installer nodeJS
```
choco install nodejs-lts -y
```

5. Installer JDK8
```
choco install adoptopenjdk --version 8.192
```

6. Installer l'android SDK (JE PENSE QUE C'EST PU REQUIS AVEC ANDROID STUDIO)
```
choco install android-sdk -y
```

7. À cause que le ble est pas dans expo, installer le java jdk 11
```
choco install -y nodejs-lts openjdk11
```

8. Installer le [android studio](https://reactnative.dev/docs/environment-setup) pour package l'application (sad mais c'est juste à cause que le ble est pas encore merge dans expo)


9. Redémarrer la boîte de commandes.

Installer [react native (Expo CLI Quickstart)](https://v7.docs.nativescript.org/angular/start/ns-setup-win)
```
npm install -g expo-cli
```


### Configuration d'un émulateur pour le debug
En ligne de commandes, utiliser les commandes suivantes:
```
cd %ANDROID_HOME%/tools/bin
```
```
sdkmanager --install "system-images;android-28;google_apis;x86"
```
```
echo "no" | avdmanager --verbose create avd --force --name "pixel_9.0" --device "pixel" --package "system-images;android-28;google_apis;x86" --tag "google_apis" --abi "x86
```

je l'ui ai mis 16gb de ram et 4gb pour la carte sd. Le reste était par défaut. Ça peut s'ajuster dans le android studio après l'avoir créé. Aussi il faut faire un **cold boot** du android si jamais vous avez une erreur du genre not found: package
### Debug avec un émulateur

* Installer les extensions VSCode:
  * [React Native Tools](https://marketplace.visualstudio.com/items?itemName=msjsdiag.vscode-react-native)
  * [Native Debug](https://marketplace.visualstudio.com/items?itemName=webfreak.debug) (nécessaire?)

* Tapper dans une ligne de commande (en étant de le répertoire du repository):
```npm start```
* Démarrer la config de debug du launch.json: ```Attach to package```
* Normalement votre émulateur android devrait être visible, le lancer avec la touche **a** 
* Une fois l'application lancé dans l'émulateur, cliquer dedans et faire ctrl+m et activer le débogage javascript
* Dans le terminal sur vscode, faire **r** pour relancer l'application si vous avez besoin de debug le démarrage

Si ça marche pas, allez voir la [réponse à Mahmoud Farahat](https://stackoverflow.com/questions/57412994/cant-debug-expo-project-on-vscode)

### Debug avec un android

Pour la premiere fois, il faut suivre ces étapes :

Créer un émulateur a l'aide d'android studio

npm start
a :ouvrir l'app mobile dans l'émulateur

m :ouvir le menu de developpeur dans l'app

enable le mode debug

attach to packager dans le menu run and debug dans VScode

r: reload l'app mobile


À noter que si ya des erreurs provenant du Bluetooth, il faut d'esactiver la connexion bluetooth sur l'emulateur pour by passer les erreurs.

Après la première fois :

npm start
a
attach to packager
a ou r (dépendement si l'app est partie ou pas)

## Package android

¯\\_(ツ)_/¯
