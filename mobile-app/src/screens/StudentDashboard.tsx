import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { getAlunoProfile, submitDeposit, clearToken, AlunoProfileResponse } from '../services/api';

export default function StudentDashboard({ route, navigation }: { route: any; navigation: any }) {
  const { studentId } = route.params;
  const [data, setData] = useState<AlunoProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositRef, setDepositRef] = useState('');
  const [depositDate, setDepositDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      setData(await getAlunoProfile(studentId));
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível carregar o perfil.');
    } finally { setLoading(false); setRefreshing(false); }
  }, [studentId]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleLogout = async () => { await clearToken(); navigation.replace('Login'); };

  const handleSubmitDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (!depositAmount || !depositRef || !depositDate || isNaN(amt) || amt <= 0) {
      Alert.alert('Erro', 'Preencha o valor, referência e data do depósito.'); return;
    }
    const parts = depositDate.split('/');
    if (parts.length !== 3) { Alert.alert('Erro', 'Use o formato DD/MM/AAAA.'); return; }
    setSubmitting(true);
    try {
      await submitDeposit({ studentId, amount: amt, receiptRef: depositRef.trim(), receiptDate: `${parts[2]}-${parts[1]}-${parts[0]}` });
      setDepositAmount(''); setDepositRef(''); setDepositDate('');
      Alert.alert('✅ Submetido', 'Comprovativo enviado à Secretaria para validação.', [{ text: 'OK', onPress: () => loadProfile() }]);
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <View style={s.centered}><ActivityIndicator size="large" color="#06b6d4" /><Text style={s.loadingText}>A carregar perfil...</Text></View>
  );
  if (!data) return (
    <View style={s.centered}>
      <Text style={s.errorText}>Erro ao carregar dados.</Text>
      <TouchableOpacity style={s.retryBtn} onPress={() => loadProfile()}><Text style={s.retryText}>Tentar Novamente</Text></TouchableOpacity>
    </View>
  );

  const { student, purchases, deposits } = data;
  const allActivity = [
    ...deposits.map(d => ({ ...d, type: 'deposit' })),
    ...purchases.map(p => ({ ...p, type: 'purchase' })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadProfile(true)} tintColor="#06b6d4" />}>
      
      <View style={s.header}>
        <View><Text style={s.welcomeText}>Bem-vindo,</Text><Text style={s.studentName}>{student.name}</Text></View>
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}><Text style={s.logoutText}>Sair</Text></TouchableOpacity>
      </View>

      <View style={s.balanceBox}>
        <Text style={s.balanceLabel}>Saldo Virtual Disponível</Text>
        <Text style={s.balanceValue}>{student.balance.toLocaleString('pt-PT')} Kz</Text>
        <Text style={s.balanceClass}>{student.classGroup}</Text>
      </View>

      <Text style={s.sectionTitle}>Cartão Estudantil (Toque para Virar)</Text>
      <TouchableOpacity style={s.cardContainer} onPress={() => setFlipped(!flipped)} activeOpacity={0.9}>
        {!flipped ? (
          <View style={[s.card, s.cardFront]}>
            <View style={s.cardHeader}>
              <View style={s.cardLogo}><Text style={s.cardLogoText}>AE</Text></View>
              <Text style={s.cardInitials}>{student.name.split(' ')[0].charAt(0)} {student.name.split(' ').pop()?.charAt(0)}</Text>
            </View>
            <View style={s.cardBody}>
              <View style={s.photoPlaceholder}><Text style={s.photoText}>FOTO</Text></View>
              <View style={s.cardDetails}>
                <Text style={s.cardName}>{student.name}</Text>
                <Text style={s.cardClass}>{student.classGroup}</Text>
              </View>
            </View>
            <View style={s.cardFooter}>
              <View><Text style={s.fieldLabel}>Referência:</Text><Text style={s.fieldValue}>{student.studentNumber}</Text></View>
              <Text style={s.cardSideLabel}>FRENTE</Text>
            </View>
          </View>
        ) : (
          <View style={[s.card, s.cardBack]}>
            <Text style={s.cardBackTitle}>Cartão de Consumo</Text>
            <View style={s.cardBackBody}>
              <View style={s.stampGrid}>
                <View style={s.stampRow}>{[1,2,3,4,5].map(i => <View key={i} style={[s.stampCircle, purchases.length >= i && s.stampFilled]} />)}</View>
                <View style={s.stampRow}>{[6,7,8,9,10].map(i => <View key={i} style={[s.stampCircle, purchases.length >= i && s.stampFilled]} />)}</View>
              </View>
              <View style={s.qrContainer}><QRCode value={student.studentNumber} size={65} color="#000c3b" backgroundColor="#fff" /></View>
            </View>
            <View style={s.cardFooter}>
              <Text style={s.termsText}>este cartão é pessoal e intransferível</Text>
              <Text style={s.cardSideLabel}>VERSO</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      <View style={s.formSection}>
        <Text style={s.sectionTitle}>Declarar Depósito (Top-up)</Text>
        <Text style={s.infoText}>Após transferência para o IBAN da cantina, declare o comprovativo para validação.</Text>
        <TextInput style={s.input} placeholder="Valor (Kz)" placeholderTextColor="#94a3b8" keyboardType="numeric" value={depositAmount} onChangeText={setDepositAmount} editable={!submitting} />
        <TextInput style={s.input} placeholder="Referência Bancária (ex: DEP-12345)" placeholderTextColor="#94a3b8" value={depositRef} onChangeText={setDepositRef} editable={!submitting} />
        <TextInput style={s.input} placeholder="Data do Depósito (DD/MM/AAAA)" placeholderTextColor="#94a3b8" value={depositDate} onChangeText={setDepositDate} editable={!submitting} />
        <TouchableOpacity style={[s.submitBtn, submitting && s.disabled]} onPress={handleSubmitDeposit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Submeter Fatura</Text>}
        </TouchableOpacity>
      </View>

      <View style={s.logsSection}>
        <Text style={s.sectionTitle}>Histórico de Atividade</Text>
        {allActivity.length === 0 && <Text style={s.emptyText}>Ainda não existe histórico.</Text>}
        {allActivity.slice(0, 20).map((item: any) => (
          <View key={item.id} style={s.logItem}>
            <View style={{ flex: 1 }}>
              <Text style={s.logTitle}>{item.type === 'deposit' ? '💳 Depósito' : '🛒 Compra na Cantina'}</Text>
              <Text style={s.logSub}>{item.type === 'deposit' ? item.receiptRef : `${(item.items || []).length} produto(s)`}</Text>
              <Text style={s.logDate}>{new Date(item.createdAt).toLocaleDateString('pt-PT')}</Text>
            </View>
            <View style={s.logRight}>
              <Text style={[s.logAmount, item.type === 'deposit' ? s.credit : s.debit]}>
                {item.type === 'deposit' ? '+' : '-'}{(item.type === 'deposit' ? item.amount : item.totalAmount).toLocaleString('pt-PT')} Kz
              </Text>
              {item.type === 'deposit' && (
                <Text style={[s.badge, item.status === 'APPROVED' ? s.approved : item.status === 'REJECTED' ? s.rejected : s.pending]}>
                  {item.status === 'APPROVED' ? 'VALIDADO' : item.status === 'REJECTED' ? 'REJEITADO' : 'PENDENTE'}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000c3b' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, backgroundColor: '#000c3b', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', marginTop: 12 },
  errorText: { color: '#f87171', marginBottom: 16 },
  retryBtn: { backgroundColor: '#0f2b92', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#fff', fontWeight: '700' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 20 },
  welcomeText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  studentName: { color: '#fff', fontSize: 18, fontWeight: '900' },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)' },
  logoutText: { color: '#ef4444', fontSize: 12, fontWeight: '700' },
  balanceBox: { backgroundColor: '#0f2b92', borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#06b6d4' },
  balanceLabel: { color: '#06b6d4', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  balanceValue: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 4 },
  balanceClass: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 4 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 12, letterSpacing: 0.5 },
  cardContainer: { alignItems: 'center', marginBottom: 28 },
  card: { width: 320, height: 185, backgroundColor: '#f8fafc', borderRadius: 16, padding: 14, justifyContent: 'space-between', elevation: 8 },
  cardFront: { borderWidth: 1, borderColor: '#e2e8f0' },
  cardBack: { borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLogo: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#0f2b92', alignItems: 'center', justifyContent: 'center' },
  cardLogoText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  cardInitials: { fontSize: 28, color: '#0f2b92', fontStyle: 'italic', fontWeight: '700' },
  cardBody: { flexDirection: 'row', alignItems: 'center' },
  photoPlaceholder: { width: 55, height: 55, borderRadius: 6, backgroundColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#0f2b92' },
  photoText: { fontSize: 8, color: '#0f2b92', fontWeight: '800' },
  cardDetails: { marginLeft: 12, flex: 1 },
  cardName: { fontSize: 13, fontWeight: '900', color: '#000c3b', textTransform: 'uppercase' },
  cardClass: { fontSize: 10, color: '#475569', marginTop: 2, fontStyle: 'italic' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8 },
  fieldLabel: { fontSize: 8, color: '#64748b', fontWeight: '700' },
  fieldValue: { fontSize: 10, fontWeight: '800', color: '#0f2b92' },
  cardSideLabel: { fontSize: 7, fontWeight: '900', color: '#94a3b8' },
  cardBackTitle: { fontSize: 13, fontWeight: '800', color: '#000c3b', textAlign: 'center' },
  cardBackBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8 },
  stampGrid: { gap: 8 },
  stampRow: { flexDirection: 'row', gap: 6 },
  stampCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.2, borderColor: '#64748b' },
  stampFilled: { backgroundColor: '#0f2b92', borderColor: '#0f2b92' },
  qrContainer: { padding: 4, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  termsText: { fontSize: 8, color: '#64748b', fontStyle: 'italic' },
  formSection: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  infoText: { color: '#94a3b8', fontSize: 10, lineHeight: 14, marginBottom: 12 },
  input: { backgroundColor: '#000826', borderWidth: 1, borderColor: 'rgba(15,43,146,0.4)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 12, marginBottom: 10 },
  submitBtn: { backgroundColor: '#0f2b92', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  disabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  logsSection: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyText: { color: '#64748b', fontSize: 12, textAlign: 'center', paddingVertical: 20 },
  logItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#000826', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(15,43,146,0.15)' },
  logTitle: { color: '#fff', fontSize: 11, fontWeight: '700' },
  logSub: { color: '#94a3b8', fontSize: 9, fontFamily: 'monospace', marginTop: 2 },
  logDate: { color: '#64748b', fontSize: 8, marginTop: 2 },
  logRight: { alignItems: 'flex-end' },
  logAmount: { fontSize: 12, fontWeight: '800' },
  credit: { color: '#10b981' },
  debit: { color: '#f87171' },
  badge: { fontSize: 7, fontWeight: '900', marginTop: 2, paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 },
  approved: { backgroundColor: 'rgba(16,185,129,0.1)', color: '#34d399' },
  pending: { backgroundColor: 'rgba(245,158,11,0.1)', color: '#fbbf24' },
  rejected: { backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171' },
});
