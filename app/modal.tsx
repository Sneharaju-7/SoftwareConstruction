import { Link } from 'expo-router';
<<<<<<< HEAD
import { StyleSheet, Text, View } from 'react-native';
=======
import { StyleSheet, View, Text } from 'react-native';
>>>>>>> 9a9460bb2dc20ae3f4165766183cbdefcded6dc8

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>This is a modal</Text>
      <Link href="/" dismissTo style={styles.link}>
        <Text style={styles.linkText}>Go to home screen</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
<<<<<<< HEAD
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
=======
    fontSize: 14,
    color: '#2e78b7',
>>>>>>> 9a9460bb2dc20ae3f4165766183cbdefcded6dc8
  },
});
