import * as React from 'react'
import { ErrorInfo } from 'react';
import { Text, View } from '../components/Themed';
import { StyleSheet } from 'react-native';

type ErrorBoundaryProps = {}
type ErrorBoundaryState = { hasError: boolean}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: any) {
      super(props);
      this.state = { hasError: false };
    }
  
    static getDerivedStateFromError(error: Error) {
      // Update state so the next render will show the fallback UI.
      return { hasError: true };
    }
  
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
      // You can also log the error to an error reporting service
      console.error(error)
      console.error(errorInfo)
    }
  
    render() {
      if (this.state.hasError) {
        // You can render any custom fallback UI
        return (
            <View style={styles.container}>
                <Text>Something went wrong.</Text>
            </View>
        );
      }
  
      return this.props.children; 
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    }});