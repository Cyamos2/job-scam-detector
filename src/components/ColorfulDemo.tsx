import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme, Provider as PaperProvider } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components/native';

const GradientButton = styled(LinearGradient)`
  border-radius: 24px;
  padding: 12px 24px;
  align-items: center;
  justify-content: center;
`;

export default function ColorfulDemo() {
  const theme = useTheme();

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Title title="Colorful Demo" />
          <Card.Content>
            <Text style={{ color: theme.colors.primary }}>
              Enjoy a more colorful UI!
            </Text>
            <GradientButton
              colors={[theme.colors.primary, '#3B82F6', '#5B7CFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Button mode="contained" color="white" onPress={() => {}}>
                Vibrant Action
              </Button>
            </GradientButton>
          </Card.Content>
        </Card>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0F1A',
  },
  card: {
    width: 320,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#0E1422',
    elevation: 8,
  },
});
