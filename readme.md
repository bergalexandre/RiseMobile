# Rise BluetoothToMqtt

L'application va transférer le data du véhicule rise vers une destination de notre choix.

Pour déterminer la position du véhicule, j'ai utilisé le package [expo-location](https://docs.expo.dev/versions/latest/sdk/location/)
bluetooth? https://blog.expo.dev/so-you-want-to-build-a-bluetooth-app-with-react-native-and-expo-6ea6a31a151d
## Utilisation:

* Utiliser la commande suivante pour builder et démarrer un android virtuel: ``` tns run android ```

## Setup

### Configuration du poste avec Chocolatey

Rouler le script console suivant:
```
@powershell -NoProfile -ExecutionPolicy unrestricted -Command "iex ((new-object net.webclient).DownloadString('https://chocolatey.org/install.ps1'))" && SET PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin
```

En powershell, permettre l'exécution de commandes
```
Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

Installer nodeJS
```
choco install nodejs-lts -y
```

Installer JDK8
```
choco install adoptopenjdk --version 8.192
```

Installer l'android SDK
```
choco install android-sdk -y
```
Redémarrer la boîte de commandes.

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

¯\\_(ツ)_/¯

## Package android

¯\\_(ツ)_/¯