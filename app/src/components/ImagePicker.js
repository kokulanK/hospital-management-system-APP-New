import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export const pickImageFromGallery = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'We need camera roll permission to upload images.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 1,
  });
  if (!result.canceled) {
    return result.assets[0];
  }
  return null;
};

export const takePhoto = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'We need camera permission to take photos.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 1,
  });
  if (!result.canceled) {
    return result.assets[0];
  }
  return null;
};