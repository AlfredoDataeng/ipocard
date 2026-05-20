import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Image
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function StudentDashboard({ route, navigation }: { route: any; navigation: any }) {
  const { studentId, name, studentNumber, classGroup, balance } = route.params;
  
  const [flipped, setFlipped] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositReceipt, setDepositReceipt] = useState('');
  
  // Local transaction state simulator
  const [studentBalance, setStudentBalance] = useState(balance);
  const [deposits, setDeposits] = useState([
    { id: '1', amount: 15000, ref: 'DEP-102938475-BAI', status: 'APPROVED', date: '17/05/2026' }
  ]);

  const handleSubmitDeposit = () => {
    const amt = parseFloat(depositAmount);
    if (!depositAmount || !depositReceipt || isNaN(amt) || amt <= 0) {
      Alert.alert('Erro', 'Por favor, informe um valor de depósito válido e o comprovativo.');
      return;
    }

    const newDep = {
      id: String(deposits.length + 1),
      amount: amt,
      ref: depositReceipt,
      status: 'PENDING',
      date: new Date().toLocaleDateString('pt-PT')
    };

    setDeposits([newDep, ...deposits]);
    setDepositAmount('');
    setDepositReceipt('');

    Alert.alert(
      'Sucesso', 
      'Declaração de depósito submetida para validação! A sua conta será creditada assim que a secretaria aprovar a fatura bancária.'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Bem-vindo,</Text>
          <Text style={styles.studentName}>{name}</Text>
        </View>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Balance Box */}
      <View style={styles.balanceBox}>
        <Text style={styles.balanceLabel}>Saldo Virtual Disponível</Text>
        <Text style={styles.balanceValue}>{studentBalance.toLocaleString('pt-PT')} Kz</Text>
      </View>

      {/* Interactive Flip Card */}
      <Text style={styles.sectionTitle}>Cartão Estudantil (Toque para Virar)</Text>
      
      <TouchableOpacity 
        style={styles.cardContainer}
        onPress={() => setFlipped(!flipped)}
        activeOpacity={0.9}
      >
        {!flipped ? (
          /* FRONT SIDE */
          <View style={[styles.card, styles.cardFront]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardLogo}>
                <Text style={styles.cardLogoText}>AE</Text>
              </View>
              <Text style={styles.cardInitials}>{name.split(' ')[0].charAt(0)} {name.split(' ').pop()?.charAt(0)}</Text>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoText}>FOTO</Text>
              </View>
              <View style={styles.cardDetails}>
                <Text style={styles.cardName}>{name}</Text>
                <Text style={styles.cardClass}>Turma: {classGroup}</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.fieldLabel}>Referência:</Text>
                <Text style={styles.fieldValue}>{studentNumber}</Text>
              </View>
              <Text style={styles.cardSideLabel}>FRENTE</Text>
            </View>
          </View>
        ) : (
          /* BACK SIDE */
          <View style={[styles.card, styles.cardBack]}>
            <Text style={styles.cardBackTitle}>Cartão de Consumo</Text>
            
            <View style={styles.cardBackBody}>
              {/* Stamp tracker representation */}
              <View style={styles.stampGrid}>
                <View style={styles.stampRow}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <View key={i} style={styles.stampCircle}></View>
                  ))}
                </View>
                <View style={styles.stampRow}>
                  {[6, 7, 8, 9, 10].map((i) => (
                    <View key={i} style={styles.stampCircle}></View>
                  ))}
                </View>
              </View>

              {/* QR Code */}
              <View style={styles.qrContainer}>
                <QRCode 
                  value={studentNumber}
                  size={65}
                  color="#000c3b"
                  backgroundColor="#fff"
                />
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.termsText}>este cartão é pessoal e intransferivel</Text>
              <Text style={styles.cardSideLabel}>VERSO</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Top-up Form */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Declarar Depósito (Top-up)</Text>
        <Text style={styles.infoText}>
          Após fazer transferência para o IBAN da cantina, declare a fatura correspondente.
        </Text>

        <TextInput 
          style={styles.input}
          placeholder="Valor do Depósito (Kz)"
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
          value={depositAmount}
          onChangeText={setDepositAmount}
        />
        
        <TextInput 
          style={styles.input}
          placeholder="Referência do Recibo Bancário"
          placeholderTextColor="#94a3b8"
          value={depositReceipt}
          onChangeText={setDepositReceipt}
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitDeposit}>
          <Text style={styles.submitButtonText}>Submeter Fatura</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction Logs */}
      <View style={styles.logsSection}>
        <Text style={styles.sectionTitle}>Histórico Recente</Text>
        {deposits.map((dep) => (
          <View key={dep.id} style={styles.logItem}>
            <View>
              <Text style={styles.logTitle}>Depósito de Saldo</Text>
              <Text style={styles.logSub}>{dep.ref}</Text>
            </View>
            <View style={styles.logRight}>
              <Text style={styles.logAmount}>+{dep.amount.toLocaleString('pt-PT')} Kz</Text>
              <Text style={[
                styles.logStatus,
                dep.status === 'APPROVED' ? styles.statusApproved : styles.statusPending
              ]}>
                {dep.status === 'APPROVED' ? 'VALIDADO' : 'PENDENTE'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000c3b',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  welcomeText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  studentName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  balanceBox: {
    backgroundColor: '#0f2b92',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#06b6d4',
  },
  balanceLabel: {
    color: '#06b6d4',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  balanceValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '950',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  cardContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  card: {
    width: 320,
    height: 185,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  cardFront: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardBack: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0f2b92',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLogoText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  cardInitials: {
    fontSize: 28,
    color: '#0f2b92',
    fontStyle: 'italic',
    fontWeight: '700',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoPlaceholder: {
    width: 55,
    height: 55,
    borderRadius: 6,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0f2b92',
  },
  photoText: {
    fontSize: 8,
    color: '#0f2b92',
    fontWeight: '800',
  },
  cardDetails: {
    marginLeft: 12,
    flex: 1,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000c3b',
    textTransform: 'uppercase',
  },
  cardClass: {
    fontSize: 10,
    color: '#475569',
    marginTop: 2,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'end',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  fieldLabel: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: '700',
  },
  fieldValue: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f2b92',
  },
  cardSideLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: '#94a3b8',
  },
  cardBackTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000c3b',
    textAlign: 'center',
  },
  cardBackBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  stampGrid: {
    gap: 8,
  },
  stampRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stampCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#64748b',
  },
  qrContainer: {
    padding: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  termsText: {
    fontSize: 8,
    color: '#64748b',
    fontStyle: 'italic',
  },
  formSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#000826',
    borderWidth: 1,
    borderColor: 'rgba(15, 43, 146, 0.4)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 12,
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#0f2b92',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  logsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000826',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(15,43,146,0.15)',
  },
  logTitle: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  logSub: {
    color: '#94a3b8',
    fontSize: 9,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  logRight: {
    alignItems: 'flex-end',
  },
  logAmount: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '800',
  },
  logStatus: {
    fontSize: 7,
    fontWeight: '900',
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  statusApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#34d399',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    color: '#fbbf24',
  }
});
