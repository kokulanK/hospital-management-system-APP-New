import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';

export default function Toast({ message, type = 'success', duration = 3000, onHide }) {
  const [visible, setVisible] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(() => {
      hide();
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  const hide = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      if (onHide) onHide();
    });
  };

  if (!visible) return null;

  const backgroundColor = type === 'success' ? '#10b981' : '#ef4444';

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, backgroundColor }]}>
      <Text style={styles.text}>{message}</Text>
      <TouchableOpacity onPress={hide} style={styles.closeBtn}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1000,
  },
  text: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  closeBtn: {
    marginLeft: 12,
  },
  closeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});