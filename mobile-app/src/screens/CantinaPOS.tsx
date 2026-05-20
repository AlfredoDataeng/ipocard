import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Image
} from 'react-native';

const CANTEEN_PRODUCTS = [
  { id: '1', name: 'Hambúrguer de Novilho', price: 1200, category: 'Lanches' },
  { id: '2', name: 'Sumo Natural de Laranja', price: 500, category: 'Bebidas' },
  { id: '3', name: 'Sandes de Queijo e Fiambre', price: 800, category: 'Lanches' },
  { id: '4', name: 'Fatia de Bolo de Chocolate', price: 600, category: 'Sobremesas' },
  { id: '5', name: 'Água Mineral IPOCET (500ml)', price: 300, category: 'Bebidas' },
  { id: '6', name: 'Cachorro Quente Especial', price: 1000, category: 'Lanches' }
];

export default function CantinaPOS({ route, navigation }: { route: any; navigation: any }) {
  const { studentNumber } = route.params;
  const [student, setStudent] = useState<any>(null);
  const [cart, setCart] = useState<{ product: any; quantity: number }[]>([]);

  // Simulation loading student details
  useEffect(() => {
    // In a real application, fetch from http://localhost:3000/api/cantina/students/scan?key=studentNumber
    // For this mobile template simulator, we match mock data:
    if (studentNumber.includes('001') || studentNumber === 'IC-IPOCET-2026-001') {
      setStudent({
        id: 'ae-student-1',
        name: 'ALEXANDRA SANEMA',
        studentNumber: 'IC-IPOCET-2026-001',
        classGroup: '12ª Classe - Informática',
        balance: 15000
      });
    } else {
      setStudent({
        id: 'ae-student-2',
        name: 'CLÁUDIO SILVA',
        studentNumber: 'IC-IPOCET-2026-002',
        classGroup: '11ª Classe - Construção Civil',
        balance: 500
      });
    }
  }, [studentNumber]);

  const handleAddToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => 
      prev.map((item) => 
        item.product.id === productId 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      ).filter((item) => item.quantity > 0)
    );
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (!student) return;
    const total = getCartTotal();

    if (student.balance < total) {
      Alert.alert('Saldo Insuficiente', `O saldo de ${student.balance.toLocaleString('pt-PT')} Kz não cobre a compra de ${total.toLocaleString('pt-PT')} Kz.`);
      return;
    }

    // Process checkout transaction
    const newBalance = student.balance - total;
    setStudent({ ...student, balance: newBalance });

    Alert.alert(
      'Compra Registada!',
      `Foram descontados ${total.toLocaleString('pt-PT')} Kz. Novo saldo: ${newBalance.toLocaleString('pt-PT')} Kz.`,
      [
        { 
          text: 'Ok', 
          onPress: () => {
            setCart([]);
            navigation.navigate('CantinaScanner');
          } 
        }
      ]
    );
  };

  if (!student) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>A carregar dados do estudante...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Student Badge Info */}
      <View style={styles.studentBadge}>
        <View>
          <Text style={styles.badgeLabel}>Estudante Identificado</Text>
          <Text style={styles.studentName}>{student.name}</Text>
          <Text style={styles.studentTurma}>{student.classGroup}</Text>
        </View>
        <View style={styles.badgeRight}>
          <Text style={styles.balanceLabel}>Saldo Virtual</Text>
          <Text style={styles.studentBalance}>{student.balance.toLocaleString('pt-PT')} Kz</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Adicionar Produtos</Text>
      
      {/* Products Grid Menu */}
      <ScrollView style={styles.menuScroll} contentContainerStyle={styles.menuContent}>
        <View style={styles.grid}>
          {CANTEEN_PRODUCTS.map((prod) => (
            <TouchableOpacity 
              key={prod.id} 
              style={styles.gridItem}
              onPress={() => handleAddToCart(prod)}
            >
              <Text style={styles.itemName}>{prod.name}</Text>
              <Text style={styles.itemPrice}>{prod.price} Kz</Text>
              <Text style={styles.itemCategory}>{prod.category}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Cart Drawer */}
      <View style={styles.cartContainer}>
        <Text style={styles.cartTitle}>Carrinho da Venda</Text>
        
        {cart.length === 0 ? (
          <Text style={styles.emptyCartText}>O carrinho está vazio. Toque nos produtos acima.</Text>
        ) : (
          <ScrollView style={styles.cartItemsScroll}>
            {cart.map((item) => (
              <View key={item.product.id} style={styles.cartItem}>
                <Text style={styles.cartItemName}>{item.product.name}</Text>
                <View style={styles.cartItemRight}>
                  <Text style={styles.cartItemQty}>{item.quantity}x</Text>
                  <Text style={styles.cartItemPrice}>{item.product.price * item.quantity} Kz</Text>
                  <TouchableOpacity 
                    style={styles.removeBtn}
                    onPress={() => handleRemoveFromCart(item.product.id)}
                  >
                    <Text style={styles.removeBtnText}>-</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.checkoutSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total a Debitar:</Text>
            <Text style={styles.totalValue}>{getCartTotal().toLocaleString('pt-PT')} Kz</Text>
          </View>

          <TouchableOpacity 
            style={[styles.checkoutBtn, cart.length === 0 && styles.checkoutBtnDisabled]}
            disabled={cart.length === 0}
            onPress={handleCheckout}
          >
            <Text style={styles.checkoutBtnText}>Deduzir Saldo & Concluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000c3b',
    padding: 16,
    paddingTop: 40,
  },
  loadingText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 100,
  },
  studentBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeLabel: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  studentName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  studentTurma: {
    color: '#94a3b8',
    fontSize: 10,
  },
  badgeRight: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  studentBalance: {
    color: '#34d399',
    fontSize: 16,
    fontWeight: '900',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    paddingBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  gridItem: {
    width: '48%',
    backgroundColor: 'rgba(15, 43, 146, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(15, 43, 146, 0.3)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 4,
  },
  itemName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  itemPrice: {
    color: '#06b6d4',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
  },
  itemCategory: {
    color: '#64748b',
    fontSize: 8,
    marginTop: 2,
    fontWeight: '700',
  },
  cartContainer: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 16,
    height: 250,
    marginTop: 10,
  },
  cartTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyCartText: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 40,
  },
  cartItemsScroll: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000826',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(15, 43, 146, 0.1)',
  },
  cartItemName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  cartItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartItemQty: {
    color: '#94a3b8',
    fontSize: 10,
  },
  cartItemPrice: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  removeBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 6,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#f87171',
    fontWeight: '900',
    fontSize: 12,
  },
  checkoutSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
    marginTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  totalLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  totalValue: {
    color: '#06b6d4',
    fontSize: 15,
    fontWeight: '900',
  },
  checkoutBtn: {
    backgroundColor: '#0f2b92',
    borderWidth: 1,
    borderColor: '#06b6d4',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  checkoutBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'transparent',
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  }
});
