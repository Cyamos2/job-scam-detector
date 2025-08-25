import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import AppButton from '../components/AppButton';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoWrap}>
        <Image
          source={require('../../assets/scamicide-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Brand + Tagline */}
      <Text style={styles.brand}>Scamicide</Text>
      <Text style={styles.tagline}>Spray away job scams — stay safe, stay hired.</Text>

      {/* Buttons */}
      <View style={{ height: 16 }} />
      <AppButton title="Verify Job Posting" onPress={() => navigation.navigate('Verify')} />
      <View style={{ height: 10 }} />
      <AppButton title="Scan Screenshot" onPress={() => navigation.navigate('Scan')} />
      <View style={{ height: 10 }} />
      <AppButton title="Company Database" onPress={() => navigation.navigate('Database')} />
      <View style={{ height: 10 }} />
      <AppButton variant="secondary" title="Settings" onPress={() => navigation.navigate('Settings')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoWrap: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#11151f',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
  },
  logo: { width: 128, height: 128 },
  brand: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    color: theme.colors.hint,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 22,
    lineHeight: 20,
    maxWidth: 320,
  },
});