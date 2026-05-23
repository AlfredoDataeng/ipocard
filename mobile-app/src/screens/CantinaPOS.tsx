import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { scanStudent, getProducts, registerPurchase, CantinaStudent, Product } from '../services/api';

export default function CantinaPOS({ route, navigation }: { route: any; navigation: any }) {
  const { studentNumber } = route.params;
  const [student, setStudent] = useState<CantinaStudent | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [studentData, productData] = await Promise.all([
          scanStudent(studentNumber),
          getProducts(),
        ]);
        setStudent(studentData);
        setProducts(productData);
      } catch (err: any) {
        Alert.alert('Erro', err.message || 'Erro ao carregar dados.', [
          { text: 'Voltar', onPress: () => navigation.goBack() },
        ]);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [studentNumber]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const ex = prev.find(i => i.product.id === product.id);
      if (ex) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0));
  };

  const getTotal = () => cart.reduce((t, i) => t + i.product.price * i.quantity, 0);

  const handleCheckout = async () => {
    if (!student || cart.length === 0) return;
    const total = getTotal();
    if (student.balance < total) {
      Alert.alert('Saldo Insuficiente', `Saldo disponível: ${student.balance.toLocaleString('pt-PT')} Kz\nTotal da compra: ${total.toLocaleString('pt-PT')} Kz`);
      return;
    }
    setProcessing(true);
    try {
      const items = cart.map(i => ({ productId: i.product.id, name: i.product.name, price: i.product.price, quantity: i.quantity }));
      const res = await registerPurchase(student.id, items);
      setStudent({ ...student, balance: res.newBalance });
      setCart([]);
      Alert.alert(
        '✅ Compra Registada!',
        `Debitado: ${total.toLocaleString('pt-PT')} Kz\nNovo saldo: ${res.newBalance.toLocaleString('pt-PT')} Kz`,
        [{ text: 'Nova Venda', onPress: () => navigation.navigate('CantinaScanner') }]
      );
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao processar compra.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <View style={s.container}>
      <ActivityIndicator size="large" color="#06b6d4" />
      <Text style={s.loadingText}>A carregar dados...</Text>
    </View>
  );

  // Group products by category
  const categories = [...new Set(products.map(p => p.category))];

  return (
    <View style={s.container}>
      {/* Student Badge */}
      {student && (
        <View style={s.badge}>
          <View>
            <Text style={s.badgeLabel}>✅ Estudante Identificado</Text>
            <Text style={s.studentName}>{student.name}</Text>
            <Text style={s.studentClass}>{student.classGroup}</Text>
          </View>
          <View style={s.badgeRight}>
            <Text style={s.balLabel}>Saldo</Text>
            <Text style={s.balance}>{student.balance.toLocaleString('pt-PT')} Kz</Text>
          </View>
        </View>
      )}

      <Text style={s.sectionTitle}>Selecionar Produtos</Text>

      <ScrollView style={s.menuScroll}>
        {categories.map(cat => (
          <View key={cat}>
            <Text style={s.catLabel}>{cat}</Text>
            <View style={s.grid}>
              {products.filter(p => p.category === cat).map(prod => {
                const cartItem = cart.find(i => i.product.id === prod.id);
                return (
                  <TouchableOpacity key={prod.id} style={[s.gridItem, cartItem && s.gridItemActive]} onPress={() => addToCart(prod)}>
                    <Text style={s.itemName}>{prod.name}</Text>
                    <Text style={s.itemPrice}>{prod.price.toLocaleString('pt-PT')} Kz</Text>
                    {cartItem && <Text style={s.itemQty}>× {cartItem.quantity}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Cart */}
      <View style={s.cart}>
        <Text style={s.cartTitle}>Carrinho da Venda</Text>
        {cart.length === 0 ? (
          <Text style={s.emptyCart}>Toque nos produtos para adicionar.</Text>
        ) : (
          <ScrollView style={s.cartScroll}>
            {cart.map(item => (
              <View key={item.product.id} style={s.cartRow}>
                <Text style={s.cartName} numberOfLines={1}>{item.product.name}</Text>
                <View style={s.cartRight}>
                  <Text style={s.cartQty}>{item.quantity}×</Text>
                  <Text style={s.cartPrice}>{(item.product.price * item.quantity).toLocaleString('pt-PT')} Kz</Text>
                  <TouchableOpacity style={s.removeBtn} onPress={() => removeFromCart(item.product.id)}>
                    <Text style={s.removeTxt}>−</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Total a Debitar:</Text>
          <Text style={s.totalValue}>{getTotal().toLocaleString('pt-PT')} Kz</Text>
        </View>
        <TouchableOpacity
          style={[s.checkoutBtn, (cart.length === 0 || processing) && s.checkoutDisabled]}
          disabled={cart.length === 0 || processing}
          onPress={handleCheckout}
        >
          {processing ? <ActivityIndicator color="#fff" /> : <Text style={s.checkoutTxt}>Deduzir Saldo & Confirmar</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000c3b', padding: 16, paddingTop: 20 },
  loadingText: { color: '#94a3b8', textAlign: 'center', marginTop: 12 },
  badge: { backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', borderRadius: 20, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  badgeLabel: { color: '#34d399', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  studentName: { color: '#fff', fontSize: 14, fontWeight: '900' },
  studentClass: { color: '#94a3b8', fontSize: 10 },
  badgeRight: { alignItems: 'flex-end' },
  balLabel: { color: '#94a3b8', fontSize: 8, fontWeight: '800', textTransform: 'uppercase' },
  balance: { color: '#34d399', fontSize: 16, fontWeight: '900' },
  sectionTitle: { color: '#fff', fontSize: 13, fontWeight: '800', marginBottom: 8, letterSpacing: 0.5 },
  menuScroll: { flex: 1 },
  catLabel: { color: '#06b6d4', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 6, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  gridItem: { width: '47%', backgroundColor: 'rgba(15,43,146,0.15)', borderWidth: 1, borderColor: 'rgba(15,43,146,0.3)', borderRadius: 14, padding: 12 },
  gridItemActive: { borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.1)' },
  itemName: { color: '#fff', fontSize: 11, fontWeight: '800' },
  itemPrice: { color: '#06b6d4', fontSize: 12, fontWeight: '900', marginTop: 4 },
  itemQty: { color: '#fbbf24', fontSize: 11, fontWeight: '900', marginTop: 2 },
  cart: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 24, padding: 14, height: 230, marginTop: 10 },
  cartTitle: { color: '#fff', fontSize: 12, fontWeight: '800', marginBottom: 8 },
  emptyCart: { color: '#64748b', fontSize: 11, textAlign: 'center', marginTop: 30 },
  cartScroll: { flex: 1 },
  cartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#000826', borderRadius: 10, padding: 8, marginBottom: 5, borderWidth: 1, borderColor: 'rgba(15,43,146,0.1)' },
  cartName: { color: '#fff', fontSize: 11, fontWeight: '700', flex: 1 },
  cartRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cartQty: { color: '#94a3b8', fontSize: 10 },
  cartPrice: { color: '#fff', fontSize: 11, fontWeight: '800' },
  removeBtn: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 6, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  removeTxt: { color: '#f87171', fontWeight: '900', fontSize: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', marginTop: 6, marginBottom: 8 },
  totalLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  totalValue: { color: '#06b6d4', fontSize: 15, fontWeight: '900' },
  checkoutBtn: { backgroundColor: '#0f2b92', borderWidth: 1, borderColor: '#06b6d4', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  checkoutDisabled: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'transparent' },
  checkoutTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
