import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

export default function Button({ title, onPress, loading, style, textStyle }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      className={`bg-blue-500 py-3 rounded-xl ${style}`}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text className={`text-white text-center font-semibold ${textStyle}`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}