import { Platform } from 'react-native';

// Use localhost when running on web (npm run web)
const BACKEND_URL = 'http://localhost:3000';

export async function sendSmsAlert(
  phoneNumber: string,
  alertMessage: string,
  alertTime: string
): Promise<boolean> {
  try {
    // Automatically prepend India country code if not present
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+91${formattedPhone}`;
    }

    const response = await fetch(`${BACKEND_URL}/send-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: formattedPhone, alertMessage, alertTime }),
    });

    if (!response.ok) {
      console.error('[sendSmsAlert] Server responded with status:', response.status);
      return false;
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('[sendSmsAlert] Error:', error);
    return false;
  }
}
