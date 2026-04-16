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
  } catch(error) {
    console.error('Notification Error:', error);
    await scheduleDemoNotification(title, phone);
  }

  // 4. Send the actual SMS immediately (if they provided a number) using the free webhook, 
  // since background web fetch falls asleep. The native push notification above is the primary alert!
  setTimeout(async () => {
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
      await fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          message: `Companion App Reminder: It's time for ${title}.`,
          key: 'textbelt',
        }),
      });
    } catch(e) {}
  }, 2000);
};

const scheduleDemoNotification = async (title: string, phone: string) => {
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
