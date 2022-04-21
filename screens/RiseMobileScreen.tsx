import { Button, StyleSheet } from 'react-native';

import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';
import { RootTabScreenProps } from '../types';

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import * as Location from 'expo-location';
import { Observable, Subscription } from 'rxjs';
import { BleError, BleManager, Characteristic, Descriptor, Device, Service, Subscription as BleSubscription } from 'react-native-ble-plx'; 


type GPSReaderProps = {
  GpsLocation: Location.LocationObject
}

function GpsReader(props: GPSReaderProps) {  
    return (
      <View>
        <Text style={styles.bigtext}>GPS lattitude: {props.GpsLocation.coords.latitude}</Text>
        <Text style={styles.bigtext}>GPS longitude: {props.GpsLocation.coords.longitude}</Text>
        <Text style={styles.bigtext}>GPS altitude: {props.GpsLocation.coords.altitude}</Text>
      </View>
        
    );
}

type STM32ReaderProps = {
  message: string
}

function Stm32Reader(props: STM32ReaderProps) {  
  return (
      <Text style={styles.bigtext}>
              Message du STM32: {props.message}      
      </Text>
  );
}

const GPSReadOptions: Location.LocationOptions = {
  accuracy: Location.Accuracy.BestForNavigation,
  mayShowUserSettingsDialog: false,
  timeInterval: undefined,
  distanceInterval: undefined
}

export type HomeScreenProps = {
  navigation: RootTabScreenProps<'TabOne'>
}

// Les valeurs qui actualise l'interface
type RiseMobileScreenState = {
  test: number,
  gpsLocation: Location.LocationObject,
  bluetoothErrorFlag: boolean
  isMonitoringStarted: boolean,
  isBluetoothAvailable: boolean,
  IsLocationAvailable: boolean,
  debugStm32Message: string
}
/*
const useAsyncError = () => {
  const [_, setError] = React.useState();
  return React.useCallback(
    e => {
      setError(() => {
        throw e;
      });
    },
    [setError],
  );
};
const throwAsyncError = useAsyncError();*/

export default class RiseMobileScreen extends React.Component<HomeScreenProps, RiseMobileScreenState>
{
    readonly GpsLocation$ = 
      new Observable<Location.LocationObject>(subscriber => {
        let locationRequestOver: boolean = true;
        let timer = setInterval(() => {
          if(locationRequestOver == true) {
            locationRequestOver = false;
            Location.getCurrentPositionAsync(GPSReadOptions)
              .then(location => subscriber.next(location))
              .catch(reason => subscriber.error(reason))
              .finally(() => {
                locationRequestOver = true;
                if(this.state.isMonitoringStarted === false) {
                  clearInterval(timer);
                }
              })
          }
        }, 1000)
      });

    readonly BlueToothData$ = 
      new Observable<string>(subscriber => {
        let timer = setInterval(async () => {
          try {
            await this.stm32SerialCharacteristic?.writeWithoutResponse(btoa("Allo"));
          } catch (error) {
            console.error(error)
          }
          
          if(this.state.isMonitoringStarted === false) {
            clearInterval(timer);
          }
        }, 1000)
      });

    readonly stm32SerialServiceUUID: string = "ffe0";
    readonly stm32SerialCharacteristicUUID: string = "ffe1";

    
    stm32Device ?: Device = undefined; 
    stm32SerialCharacteristic ?: Characteristic = undefined;
    bleManager: BleManager = new BleManager();
    
    gpsSub: Subscription|undefined;
    stm32Sub: Subscription|undefined;
    listenSub?: BleSubscription;

    constructor(props:HomeScreenProps) {
        super(props);
        this.state = { 
          test: 1, 
          gpsLocation: {coords: { latitude: 69, longitude: 69, altitude: 69}, timestamp: 69} as unknown as Location.LocationObject,
          bluetoothErrorFlag: false,
          isMonitoringStarted: false,
          isBluetoothAvailable: false,
          IsLocationAvailable: false,
          debugStm32Message: "Aucun message"
        };
    }


    Increment() {
        this.setState({test: (this.state.test+1)})
    }

    componentDidMount() {
      Location.requestForegroundPermissionsAsync().then(
        (value) => {
          this.setState({IsLocationAvailable: true})
        }).catch((msg) => { 
          throw new Error(`Ne possède pas les permissions d'accèss pour la localisation GPS: ${msg}` );
        });

      const subscription = this.bleManager.onStateChange((state) => {
        if (state === 'PoweredOn') {
            this.setState({isBluetoothAvailable: true});
            subscription.remove();
        }
      }, true);
      
    }
    
    componentWillUnmount() {
      this.setState({isMonitoringStarted: false});
      this.gpsSub?.unsubscribe();
      this.stm32Sub?.unsubscribe();

    }

    async monitorRiseVehcile() {
      try {
        if(this.state.isMonitoringStarted == false) {
          this.setState({isMonitoringStarted: true})
          this.stm32Device = await this.scanAndConnect();
          this.stm32Device = await this.stm32Device.connect();
          this.stm32Device = await this.stm32Device?.discoverAllServicesAndCharacteristics();
          this.stm32SerialCharacteristic = await this.findSerialCharacteristicInDevice(this.stm32Device);
          this.gpsSub = this.observeGpsLocation();
          this.stm32Sub = this.observeSTM32Data();
        } else {
          this.setState({isMonitoringStarted: false})
          this.gpsSub?.unsubscribe();
          this.stm32Sub?.unsubscribe()
          this.listenSub?.remove();
          await this.stm32Device?.cancelConnection();
        }
      } catch (error) {
        if(error instanceof BleError) {
          this.setState({bluetoothErrorFlag: true});
          console.error("Erreur de connection");
          console.error(error);
        } else {
          // rethrow si on ne la connait pas
          //throwAsyncError(error)
        }
      }
    }

    async findSerialCharacteristicInDevice(device: Device): Promise<Characteristic> {
      let services: Service[] | undefined = await this.stm32Device?.services();
      let stm32SerialService = services?.find((service) => service.uuid.includes(this.stm32SerialServiceUUID));
      let characteristics = await stm32SerialService?.characteristics();
      let stm32SerialCharacteristic = characteristics?.find(characteristic => characteristic.uuid.includes(this.stm32SerialCharacteristicUUID));
      this.listenSub = stm32SerialCharacteristic?.monitor((error, characteristic) => {
        if(error != undefined) {
          console.error(error?.message);
        } else {
          this.setState({debugStm32Message: characteristic?.value == undefined ? "Aucun message": Buffer.from(characteristic?.value, "base64").toString() })
        }
      });
      if(stm32SerialCharacteristic === undefined) {
        throw new Error(`Caractéristique pas trouvé dans la liste des services ${services}`);
      }
      return stm32SerialCharacteristic;

    }

    observeGpsLocation(): Subscription {
      return this.GpsLocation$.subscribe({
          next: value => {
            this.setState({gpsLocation: value});
          },
          error: err => console.log(err),//throwAsyncError(err),
          complete: () => console.log(`Completed observation of GPS location`),
        });
    }

    observeSTM32Data(): Subscription {
      return this.BlueToothData$.subscribe({
          next: value => {
            this.setState({debugStm32Message: value});
          },
          error: err => console.log(err),//throwAsyncError(err),
          complete: () => console.log(`Completed observation of GPS location`),
        });
    }

    scanAndConnect(): Promise<Device> {
      return new Promise( (resolve) => {
        this.bleManager.startDeviceScan(null, null, (error, device) => {
          if(error) {
            throw error;
          }
          if(device?.name ===  "purplezerg") {
            // Stop scanning as it's not necessary if you are scanning for one device.
            this.bleManager.stopDeviceScan();
            resolve(device)
          }
        })
      })
    }

    render() {
      return (
        <ErrorBoundary>
          <View style={styles.container}>
            <Text style={styles.title}>Rise Mobile</Text>
            <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
            <Button
                onPress={() => this.monitorRiseVehcile()}
                title={this.state.isMonitoringStarted ? "Stop": "Start"}
                disabled={!this.state.isBluetoothAvailable || !this.state.IsLocationAvailable} >
            </Button>
            <GpsReader GpsLocation={this.state.gpsLocation}></GpsReader>
            <Stm32Reader message={this.state.debugStm32Message}></Stm32Reader>
            <Text style={styles.bigtext}>Bluetooth: {this.state.isBluetoothAvailable? "Actif": "Inactif"}</Text>
            <Text style={styles.bigtext}>Localisation: {this.state.IsLocationAvailable? "Actif": "Inactif"}</Text>
            <Text style={styles.bigtext}>Bluetooth Status: {this.state.bluetoothErrorFlag? "Erreurs détectée": "Pas d'erreur"}</Text>
          </View>
        </ErrorBoundary>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  button: {
    fontSize: 24,
    color: "#2e6ddf",
  },
  bigtext: {
    fontSize: 18,
  }
});
