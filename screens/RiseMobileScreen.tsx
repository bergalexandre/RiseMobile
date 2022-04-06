import { Button, StyleSheet } from 'react-native';

import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';
import { RootTabScreenProps } from '../types';

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import * as Location from 'expo-location';
import { Observable, Subscription } from 'rxjs';
import { BleError, BleManager, Characteristic, Descriptor, Device, Service } from 'react-native-ble-plx'; 


type GPSReaderProps = {
  GpsLocation: Location.LocationObject
}

function GpsReader(props: GPSReaderProps) {  
    return (
        <Text>
                GPS coordinat2e: {props.GpsLocation.coords.latitude}      
        </Text>
    );
}

type STM32ReaderProps = {
  message: string
}

function Stm32Reader(props: STM32ReaderProps) {  
  return (
      <Text>
              Message from STM32: {props.message}      
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
      new Observable<Int8Array[]>(subscriber => {
        let locationRequestOver: boolean = true;
        let timer = setInterval(() => {
          this.stm32SerialCharacteristic?.writeWithResponse("1")
        }, 1000)
      });

    readonly stm32SerialServiceUUID: string = "0xFFE0";
    readonly stm32SerialCharacteristicUUID: string = "0xFFE1";


    stm32Device ?: Device = undefined; 
    stm32SerialCharacteristic ?: Characteristic = undefined;
    bleManager: BleManager = new BleManager();
    
    gpsSub: Subscription|undefined;
    stm32Sub: Subscription|undefined;

    constructor(props:HomeScreenProps) {
        super(props);
        this.state = { 
          test: 1, 
          gpsLocation: {coords: { latitude: 69, longitude: 69}, timestamp: 69} as unknown as Location.LocationObject,
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
      if(this.state.isMonitoringStarted == false) {
        this.setState({isMonitoringStarted: true})
        try {
          this.stm32Device = await this.scanAndConnect();
          this.stm32Device = await this.stm32Device.connect();
          this.stm32Device = await this.stm32Device?.discoverAllServicesAndCharacteristics();
          this.stm32SerialCharacteristic = await this.findSerialCharacteristicInDevice(this.stm32Device);
          
        } catch (error) {
          if(error instanceof BleError) {
            this.setState({bluetoothErrorFlag: true});
            console.error("Erreur de connection");
            console.error(error);
          } else {
            // rethrow si on ne la connait pas
            throw(error);
          }
        }
      } else {
        this.setState({isMonitoringStarted: false})
        await this.stm32Device?.cancelConnection();
      }
    }

    async findSerialCharacteristicInDevice(device: Device): Promise<Characteristic> {
      let services: Service[] | undefined = await this.stm32Device?.services();
      let stm32SerialService = services?.find((service) => service.uuid == this.stm32SerialServiceUUID);
      let characteristics = await stm32SerialService?.characteristics();
      let stm32SerialCharacteristic = characteristics?.find(characteristic => characteristic.uuid === this.stm32SerialCharacteristicUUID); 

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
          error: err => console.log(err),
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
            <EditScreenInfo path="/screens/RiseMobileScreenRiseMobileScreen.tsx" />
            <Button
                onPress={() => this.monitorRiseVehcile()}
                title={this.state.isMonitoringStarted ? "Stop": "Start"}
                disabled={this.state.isBluetoothAvailable && this.state.IsLocationAvailable} >
            </Button>
            <GpsReader GpsLocation={this.state.gpsLocation}></GpsReader>
            <Stm32Reader message={this.state.debugStm32Message}></Stm32Reader>

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
    fontSize: 20,
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
});
