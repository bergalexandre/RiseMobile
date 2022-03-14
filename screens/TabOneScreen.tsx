import { Button, StyleSheet } from 'react-native';

import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';
import { RootTabScreenProps } from '../types';

import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import * as Location from 'expo-location';
import { Observable, defer, from, Subscription, observable } from 'rxjs';
 
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

const GPSReadOptions: Location.LocationOptions = {
  accuracy: Location.Accuracy.BestForNavigation,
  mayShowUserSettingsDialog: false,
  timeInterval: undefined,
  distanceInterval: undefined
}

export type HomeScreenProps = {
  navigation: RootTabScreenProps<'TabOne'>,
}

// Les valeurs qui actualise l'interface
type HomeScreenState = {
  test: number,
  gpsLocation: Location.LocationObject
}
export default class TabOneScreen extends React.Component<HomeScreenProps, HomeScreenState>
{
    readonly GpsLocation$ = 
    new Observable<Location.LocationObject>(subscriber => {
      let locationRequestOver: boolean = true;
      setInterval(() => {
        if(locationRequestOver == true) {
          locationRequestOver = false;
          Location.getCurrentPositionAsync(GPSReadOptions)
            .then(location => subscriber.next(location))
            .catch(reason => subscriber.error(reason))
            .finally(() => locationRequestOver = true)
        }
      }, 1000)
    });
  
    sub ?: Subscription;
    constructor(props:HomeScreenProps) {
        super(props);
        this.state = { 
          test: 1, 
          gpsLocation: {coords: { latitude: 69, longitude: 69}, timestamp: 69} as unknown as Location.LocationObject
        };
    }

    Increment() {
        this.setState({test: (this.state.test+1)})
    }

    componentDidMount() {
      Location.requestForegroundPermissionsAsync().then(
        (value) => {
          this.sub = this.GpsLocation$.subscribe({
            next: value => {
              this.setState({gpsLocation: value});
            },
            error: err => console.log(err),
            complete: () => console.log(`Completed`),
          });
        }).catch((msg) => { 
          throw new Error(msg);
        })
      
    }
    
    componentWillUnmount() {
      this.sub?.unsubscribe();
    }

    render() {
        return (
          <ErrorBoundary>
            <View style={styles.container}>
              <Text style={styles.title}>Tab One</Text>
              <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
              <EditScreenInfo path="/screens/TabOneScreen.tsx" />
              <Button
                  onPress={() => this.Increment()}
                  title={`Tap me for an alert ${this.state.test}`}>
              </Button>
              <GpsReader GpsLocation={this.state.gpsLocation}></GpsReader>
            </View>
          </ErrorBoundary>
        );
    } 
}

/*
export default function TabOneScreen({ navigation }: RootTabScreenProps<'TabOne'>) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab One</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <EditScreenInfo path="/screens/TabOneScreen.tsx" />
    </View>
  );
}*/

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
