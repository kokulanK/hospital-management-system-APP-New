import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default class ErrorBoundary extends React.Component {
  state = { error: null, errorInfo: null };

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView style={styles.container}>
          <Text style={styles.errorTitle}>{this.state.error.toString()}</Text>
          <Text style={styles.stackTitle}>Component Stack:</Text>
          <Text style={styles.stackText}>{this.state.errorInfo?.componentStack}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => this.setState({ error: null, errorInfo: null })}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    color: 'red',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stackTitle: {
    fontWeight: 'bold',
    marginTop: 10,
  },
  stackText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#3b82f6',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryText: {
    color: 'white',
    textAlign: 'center',
  },
});