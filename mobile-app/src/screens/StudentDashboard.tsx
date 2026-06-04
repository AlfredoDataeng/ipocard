import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { getAlunoProfile, clearToken, AlunoProfileResponse } from '../services/api';

export default function StudentDashboard({ route, navigation }: { route: any; navigation: any }) {
  const { studentId } = route.params;
  const [data, setData] = useState<AlunoProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [flipped, setFlipped] = useState(false);

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
            {/* Top Section */}
            <View style={s.cardTop}>
              <Text style={s.cardBrand}>IPOCARD</Text>
              <View style={s.monogramContainer}>
                <Text style={s.monogramText}>{student.name.split(' ')[0].charAt(0)} {student.name.split(' ').pop()?.charAt(0)}</Text>
                <Text style={s.monogramSub}>IPOCET</Text>
              </View>
            </View>
            
            {/* Middle Section */}
            <View style={s.cardMid}>
              <Text style={s.cardName} numberOfLines={1}>{student.name}</Text>
              <Text style={s.cardClass}>Turma: {student.classGroup}</Text>
            </View>
            
            {/* Bottom Section */}
            <View style={s.cardBottom}>
              <View>
                <Text style={s.fieldLabel}>Referência:</Text>
                <Text style={s.fieldValue}>{student.studentNumber}</Text>
              </View>
              <View style={s.contactsContainer}>
                <Text style={s.contactText}>CONTACTOS: +244 959 442 870</Text>
                <Text style={s.contactText}>E-mail: ipocard.ipocet@gmail.com</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[s.card, s.cardBack]}>
            <Text style={s.cardBackTitle}>Cartão de Consumo</Text>
            <View style={s.qrContainer}>
              <QRCode value={student.studentNumber} size={110} color="#000c3b" backgroundColor="#fff" />
            </View>
          </View>
        )}
      </TouchableOpacity>

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
  container: { flex: 1, backgroundColor: '#010206' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, backgroundColor: '#010206', justifyContent: 'center', alignItems: 'center' },
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
  
  /* New Card Styles matching Admin-Web */
  card: { width: 340, height: 200, backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, justifyContent: 'space-between', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  cardFront: { borderWidth: 1, borderColor: '#e2e8f0' },
  cardBack: { borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardBrand: { fontSize: 18, fontWeight: '900', color: '#000c3b', letterSpacing: -0.5 },
  monogramContainer: { alignItems: 'flex-end' },
  monogramText: { fontSize: 36, color: '#0f2b92', fontWeight: '700', fontStyle: 'italic', transform: [{ rotate: '-6deg' }], opacity: 0.8 },
  monogramSub: { fontSize: 8, color: '#94a3b8', letterSpacing: 2, marginTop: -2 },
  cardMid: { marginTop: -10 },
  cardName: { fontSize: 17, fontWeight: '900', color: '#000c3b', textTransform: 'uppercase' },
  cardClass: { fontSize: 12, color: '#475569', fontStyle: 'italic', marginTop: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: 'rgba(226, 232, 240, 0.6)', paddingTop: 8 },
  fieldLabel: { fontSize: 10, color: '#475569', fontWeight: '600' },
  fieldValue: { fontSize: 11, fontWeight: '800', color: '#0f2b92', letterSpacing: 0.5 },
  contactsContainer: { alignItems: 'flex-end' },
  contactText: { fontSize: 8, color: '#64748b', fontStyle: 'italic' },
  cardBackTitle: { fontSize: 20, fontWeight: '700', color: '#000c3b', fontStyle: 'italic', marginBottom: 16 },
  qrContainer: { padding: 12, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  
  logsSection: { backgroundColor: '#020617', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyText: { color: '#64748b', fontSize: 12, textAlign: 'center', paddingVertical: 20 },
  logItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#090e1a', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(15,43,146,0.15)' },
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
