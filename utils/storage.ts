import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export interface AlertData {
  id: string;
  title: string;
  type: string;
  time: string;
}

export const getContacts = async (): Promise<Contact[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem('@contacts');
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch(e) {
    return [];
  }
}

export const saveContacts = async (contacts: Contact[]) => {
  try {
    const jsonValue = JSON.stringify(contacts);
    await AsyncStorage.setItem('@contacts', jsonValue);
  } catch (e) {
    console.error(e);
  }
}

export const getAlerts = async (): Promise<AlertData[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem('@alerts');
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch(e) {
    return [];
  }
}

export const saveAlerts = async (alerts: AlertData[]) => {
  try {
    const jsonValue = JSON.stringify(alerts);
    await AsyncStorage.setItem('@alerts', jsonValue);
  } catch (e) {
    console.error(e);
  }
}

export const getUserProfile = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@profile');
      return jsonValue != null ? JSON.parse(jsonValue) : { name: '', phone: '', photoUri: '' };
    } catch(e) {
      return { name: '', phone: '', photoUri: '' };
    }
}

export const saveUserProfile = async (profile: { name: string, phone: string, photoUri?: string }) => {
    try {
      const jsonValue = JSON.stringify(profile);
      await AsyncStorage.setItem('@profile', jsonValue);
    } catch (e) {
      console.error(e);
    }
}
