import { Link } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
<<<<<<< HEAD
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>This is a modal</Text>
      <Link href="/" dismissTo style={styles.link}>
        <Text style={{ color: 'blue' }}>Go to home screen</Text>
=======
      <Text style={styles.title}>This is a modal</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Go to home screen</Text>
>>>>>>> d742ba1 (Merge AI Companion into Daily Check-in with dynamic choices)
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
    fontSize: 14,
    color: '#2e78b7',
  },
});
