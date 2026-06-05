import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  Alert 
} from 'react-native';
// MODIFICADO: Importação do CameraView e do hook de permissões para o SDK 54
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function CantinaScanner({ navigation }: { navigation: any }) {
  // MODIFICADO: Gerenciamento moderno de permissões do Expo 54
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Efeito para solicitar permissão automaticamente ao abrir a tela
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    // data is the studentNumber e.g. "IC-IPOCET-2026-001"
    navigation.navigate('CantinaPOS', { studentNumber: data });
    // Reset scanner after small delay
    setTimeout(() => setScanned(false), 2000);
  };

  const handleManualSubmit = () => {
    if (!manualCode) {
      Alert.alert('Erro', 'Por favor, insira o número da conta ou ID.');
      return;
    }
    navigation.navigate('CantinaPOS', { studentNumber: manualCode.toUpperCase() });
  };

  // MODIFICADO: Verificação do estado de carregamento da permissão
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>A solicitar acesso à câmara...</Text>
      </View>
    );
  }
  
  // MODIFICADO: Se o acesso foi negado
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Acesso à câmara negado. Por favor, ative as permissões nas definições.</Text>
        
        {/* Botão para forçar a solicitação novamente caso queira */}
        <TouchableOpacity style={[styles.button, { marginBottom: 24 }]} onPress={requestPermission}>
          <Text style={styles.buttonText}>Tentar Novamente</Text>
        </TouchableOpacity>

        {/* Manual Fallback */}
        <View style={styles.manualCard}>
          <Text style={styles.manualTitle}>Introduzir Nº Conta Manualmente</Text>
          <TextInput 
            style={styles.input}
            placeholder="Ex: IC-IPOCET-2026-001"
            placeholderTextColor="#94a3b8"
            value={manualCode}
            onChangeText={setManualCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.button} onPress={handleManualSubmit}>
            <Text style={styles.buttonText}>Confirmar Conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leitor de Cartão Estudantil</Text>
      <Text style={styles.subtitle}>Aponte a câmara do telemóvel para o código QR impresso no verso do cartão.</Text>

      {/* Camera Barcode Scanner Simulator/View */}
      <View style={styles.cameraContainer}>
        {/* MODIFICADO: Componente atualizado para CameraView com as novas propriedades de leitura */}
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        
        {/* Visual Scanner Overlay Reticle */}
        <View style={styles.reticle}></View>
      </View>

      {/* Manual Input Fallback */}
      <View style={styles.manualCard}>
        <Text style={styles.manualTitle}>Introdução Manual Alternativa</Text>
        <View style={styles.row}>
          <TextInput 
            style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
            placeholder="Nº Conta / ID"
            placeholderTextColor="#94a3b8"
            value={manualCode}
            onChangeText={setManualCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.rowButton} onPress={handleManualSubmit}>
            <Text style={styles.buttonText}>Avançar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.replace('Login')}
      >
        <Text style={styles.backText}>Terminar Sessão</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#010206',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#06b6d4',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 16,
  },
  cameraContainer: {
    width: '100%',
    height: 280,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#020617',
    borderWidth: 2,
    borderColor: '#0f2b92',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  reticle: {
    width: 160,
    height: 160,
    borderWidth: 2,
    borderColor: '#06b6d4',
    borderRadius: 16,
    borderStyle: 'dashed',
  },
  text: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
  },
  errorText: {
    color: '#f87171',
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 24,
  },
  manualCard: {
    backgroundColor: '#020617',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  manualTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
  },
  input: {
    backgroundColor: '#090e1a',
    borderWidth: 1,
    borderColor: 'rgba(15, 43, 146, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#0f2b92',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rowButton: {
    backgroundColor: '#0f2b92',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  backButton: {
    marginTop: 40,
    alignSelf: 'center',
  },
  backText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '700',
  }
});