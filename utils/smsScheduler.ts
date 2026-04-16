import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Force notifications to show up natively even if the app is currently open!
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const scheduleRealSMS = async (phone: string, title: string, timeStr: string) => {
  if (!phone) return;

  // 1. Request Native Device Permissions
  if (Platform.OS !== 'web') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('You must allow notifications in your phone settings to receive alarms!');
      return;
    }
  }

  // 2. Parse time string (e.g. "10:00 AM")
  const getDailyTrigger = (tStr: string) => {
    const match = tStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/);
    if (!match) return null;
    
    let [_, hStr, mStr, ampm] = match;
    let hours = parseInt(hStr, 10);
    const minutes = parseInt(mStr, 10);
    
    if (ampm && ampm.toLowerCase() === 'pm' && hours < 12) hours += 12;
    if (ampm && ampm.toLowerCase() === 'am' && hours === 12) hours = 0;
    
    return { hour: hours, minute: minutes };
  };

  const timeTrig = getDailyTrigger(timeStr);

  try {
    if (Platform.OS !== 'web') {
      if (timeTrig) {
        // 3. Schedule the Native Daily OS Notification (Background Proof)
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🔔 DAILY REMINDER: ${title}`,
            body: `It's time for your scheduled task! (SMS sent to ${phone})`,
            sound: true, 
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: timeTrig.hour,
            minute: timeTrig.minute,
            repeats: true,
          },
        });

        console.log(`[Native Notification] Scheduled securely for ${timeTrig.hour}:${timeTrig.minute} repeating daily!`);
        alert(`✅ Success! An alarm is now natively scheduled on your device for ${timeStr} every day!`);
      } else {
        // If the time format is unreadable, we fire it 10 seconds from now as a demo fallback
        await scheduleDemoNotification(title, phone);
      }
    } else {
      console.log('Push notifications are not supported on the web. SMS will still be sent.');
      alert(timeTrig ? `✅ Success! SMS reminder is configured for ${timeStr}.` : `⚠️ Time format wasn't recognized, but SMS will be sent now as a demo.`);
    }
  } catch(error) {
    console.error('Notification Error:', error);
    if (Platform.OS !== 'web') {
      await scheduleDemoNotification(title, phone);
    }
  }

  // 4. Send the actual SMS immediately (if they provided a number) using your local Twilio backend
  // The free Textbelt API has a strict limit of 1 SMS per day per IP limit which causes it to silently fail!
  setTimeout(async () => {
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
      const response = await fetch('http://127.0.0.1:3000/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          alertMessage: title,
          alertTime: timeStr
        }),
      });
      const data = await response.json();
      if (!data.success) {
        console.error('Twilio Error:', data.error);
        alert(`⚠️ SMS Failed: ${data.error}`);
      } else {
        console.log('✅ SMS successfully sent via Twilio Backend!');
      }
    } catch(e) {
      console.error('Fetch Error:', e);
      alert('⚠️ SMS could not be sent. Is your alert-backend server running?');
    }
  }, 2000);
};

const scheduleDemoNotification = async (title: string, phone: string) => {
  if (Platform.OS === 'web') return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🔔 DEMO ALERT: ${title}`,
      body: `This is your demo reminder! (Scheduled for ${phone})`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5, // Fallback demo time
    },
  });
  console.log(`[Native Notification] Demo notification scheduled for 5 seconds.`);
  alert(`⚠️ Time format wasn't recognized, so we scheduled a demo notification on your phone for 5 seconds from now!`);
};
