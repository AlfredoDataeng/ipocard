import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { loginStudent, loginStaff, saveToken } from '../services/api';

export default function LoginScreen({ navigation }: { navigation: any }) {
  const [role, setRole] = useState<'ALUNO' | 'CANTINA'>('ALUNO');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      if (role === 'ALUNO') {
        const res = await loginStudent(identifier.trim(), password);
        await saveToken(res.token);
        navigation.replace('StudentDashboard', { studentId: res.student.id });
      } else {
        const res = await loginStaff(identifier.trim(), password);
        await saveToken(res.token);
        navigation.replace('CantinaScanner');
      }
    } catch (err: any) {
      Alert.alert('Erro de Autenticação', err.message || 'Não foi possível ligar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>

        {/* Logo and Slogan */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoText}>IP</Text>
          </View>
          <Text style={styles.appName}>IPOCARD</Text>
          <Text style={styles.slogan}>"O futuro dos pagamentos estudantis no IPOCET."</Text>
        </View>

        {/* Role Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, role === 'ALUNO' && styles.tabButtonActive]}
            onPress={() => setRole('ALUNO')}
          >
            <Text style={[styles.tabText, role === 'ALUNO' && styles.tabTextActive]}>Estudante</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, role === 'CANTINA' && styles.tabButtonActive]}
            onPress={() => setRole('CANTINA')}
          >
            <Text style={[styles.tabText, role === 'CANTINA' && styles.tabTextActive]}>Trabalhador Cantina</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {role === 'ALUNO' ? 'Número do Estudante' : 'Utilizador'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={role === 'ALUNO' ? 'Ex: IC-IPOCET-2026-001' : 'cantina'}
              placeholderTextColor="#94a3b8"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize={role === 'ALUNO' ? 'characters' : 'none'}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Entrar no IPOCARD</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>Associação Estudantil IPOCET • {'\n'}Servidor: 192.168.1.8</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000c3b',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#0f2b92',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#06b6d4',
  },
  logoText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  appName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  slogan: {
    color: '#06b6d4',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 43, 146, 0.15)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(15, 43, 146, 0.3)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#0f2b92',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#fff',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#000826',
    borderWidth: 1,
    borderColor: 'rgba(15, 43, 146, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#0f2b92',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#06b6d4',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footerText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 40,
    fontWeight: '600',
    lineHeight: 18,
  },
});
