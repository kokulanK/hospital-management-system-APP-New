import React from 'react';
import { TextInput, View, Text } from 'react-native';

export default function Input({ label, value, onChangeText, secureTextEntry, placeholder }) {
  return (
    <View className="mb-4">
      {label && <Text className="text-gray-700 font-medium mb-1">{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        className="border border-gray-300 rounded-lg p-3"
      />
    </View>
  );
}