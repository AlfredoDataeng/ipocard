import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Search, 
  XCircle, 
  Camera, 
  Check,
  Edit2,
  Trash2,
  UserCheck,
  Receipt
} from 'lucide-react';
import { StudentCard } from './components/StudentCard';

const API_BASE = 'http://localhost:3000/api';

const INITIAL_PRODUCTS = [
  { id: '1', name: 'Hambúrguer de Novilho', price: 1200 },
  { id: '2', name: 'Sumo Natural de Laranja', price: 500 },
  { id: '3', name: 'Sandes de Queijo e Fiambre', price: 800 },
  { id: '4', name: 'Fatia de Bolo de Chocolate', price: 600 },
  { id: '5', name: 'Água Mineral IPOCET', price: 300 },
  { id: '6', name: 'Cachorro Quente Especial', price: 1000 }
];

const INITIAL_STUDENTS = [
  { id: 'ae-student-1', name: 'MATHEUS DOMINGOS', studentNumber: 'IC-IPOCET-2026-001', classGroup: '12ª Classe - Informática', balance: 15000 },
  { id: 'ae-student-2', name: 'BEATRIZ GONÇALVES', studentNumber: 'IC-IPOCET-2026-002', classGroup: '11ª Classe - Construção Civil', balance: 500 },
  { id: 'ae-student-3', name: 'FRANCISCO COSTA', studentNumber: 'IC-IPOCET-2026-003', classGroup: '10ª Classe - Eletricidade', balance: 0 }
];

function App() {
  const [currentView, setCurrentView] = useState<'secretaria' | 'alunos' | 'simulador' | 'recibos' | 'credenciais' | 'menu'>('secretaria');
  const [usingApi, setUsingApi] = useState<boolean>(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);
  
  const [students, setStudents] = useState<any[]>(INITIAL_STUDENTS);
  const [products, setProducts] = useState<any[]>(INITIAL_PRODUCTS);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productFormData, setProductFormData] = useState({ name: '', price: '', category: 'Cantina' });
  const [deposits, setDeposits] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [selectedMonitorType, setSelectedMonitorType] = useState<'all' | 'deposits' | 'purchases'>('all');
  const [monitorSearchTerm, setMonitorSearchTerm] = useState('');
  const [selectedReceiptInfo, setSelectedReceiptInfo] = useState<any | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  // Student CRUD states
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentTurma, setNewStudentTurma] = useState('12ª Classe - Informática');
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  
  // Credentials
  const [passwordValues, setPasswordValues] = useState<Record<string, string>>({});

  const handleChangePassword = async (studentId: string) => {
    const newPassword = passwordValues[studentId];
    if (!newPassword || newPassword.length < 4) {
      addToast('A senha deve ter pelo menos 4 caracteres.', 'error');
      return;
    }

    if (usingApi) {
      try {
        const res = await fetch(`${API_BASE}/secretaria/students/${studentId}/password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword })
        });
        if (res.ok) {
          addToast('Senha atualizada com sucesso!', 'success');
          setPasswordValues((prev) => ({ ...prev, [studentId]: '' }));
        } else {
          const data = await res.json();
          addToast(data.error || 'Erro ao atualizar senha.', 'error');
        }
      } catch (err) {
        addToast('Erro ao ligar ao servidor.', 'error');
      }
    } else {
      addToast('Apenas suportado no modo API online.', 'error');
    }
  };

  // Physical deposit inputs (Secretariat)
  const [selectedDepositStudentId, setSelectedDepositStudentId] = useState('');
  const [physicalDepositAmount, setPhysicalDepositAmount] = useState('');
  const [depositSearchQuery, setDepositSearchQuery] = useState('');
  const [depositDropdownOpen, setDepositDropdownOpen] = useState(false);

  const [simulatedStudentId, setSimulatedStudentId] = useState('ae-student-1');
  const [cardFlipped, setCardFlipped] = useState(false);

  const [canteenCart, setCanteenCart] = useState<{ product: any; quantity: number }[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedStudent, setScannedStudent] = useState<any>(null);
  const [canteenReceipt, setCanteenReceipt] = useState<any>(null);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const loadData = async () => {
    try {
      const healthRes = await fetch(`${API_BASE}/health`);
      if (healthRes.ok) {
        setUsingApi(true);
        const sRes = await fetch(`${API_BASE}/secretaria/students`);
        setStudents(await sRes.json());
        const depRes = await fetch(`${API_BASE}/secretaria/deposits`);
        setDeposits(await depRes.json());
        const pRes = await fetch(`${API_BASE}/cantina/purchases`);
        setPurchases(await pRes.json());
        const prodRes = await fetch(`${API_BASE}/cantina/products`);
        setProducts(await prodRes.json());
      } else {
        throw new Error('Offline');
      }
    } catch (e) {
      setUsingApi(false);
      const localSt = localStorage.getItem('ipocard_students');
      const localDep = localStorage.getItem('ipocard_deposits');
      const localPurch = localStorage.getItem('ipocard_purchases');
      
      if (localSt) setStudents(JSON.parse(localSt));
      else localStorage.setItem('ipocard_students', JSON.stringify(INITIAL_STUDENTS));

      if (localDep) setDeposits(JSON.parse(localDep));
      else localStorage.setItem('ipocard_deposits', JSON.stringify([]));

      if (localPurch) setPurchases(JSON.parse(localPurch));
      else localStorage.setItem('ipocard_purchases', JSON.stringify([]));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveStateLocally = (newSts: any[], newDeps: any[], newPurchases?: any[]) => {
    if (!usingApi) {
      if (newSts) {
        setStudents(newSts);
        localStorage.setItem('ipocard_students', JSON.stringify(newSts));
      }
      if (newDeps) {
        setDeposits(newDeps);
        localStorage.setItem('ipocard_deposits', JSON.stringify(newDeps));
      }
      if (newPurchases) {
        setPurchases(newPurchases);
        localStorage.setItem('ipocard_purchases', JSON.stringify(newPurchases));
      }
    }
  };

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentTurma) {
      addToast('Preencha todos os campos.', 'error');
      return;
    }

    const payload = {
      name: newStudentName,
      classGroup: newStudentTurma
    };

    if (editingStudent) {
      // CRUD: UPDATE
      if (usingApi) {
        try {
          const res = await fetch(`${API_BASE}/secretaria/students/${editingStudent.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            addToast('Estudante atualizado!', 'success');
            setEditingStudent(null);
            loadData();
            resetStudentForm();
          } else {
            const data = await res.json();
            addToast(data.error || 'Erro ao atualizar.', 'error');
          }
        } catch (err) {
          addToast('Erro ao atualizar.', 'error');
        }
      } else {
        const updated = students.map((s) => {
          if (s.id === editingStudent.id) {
            return { ...s, name: newStudentName.toUpperCase(), classGroup: newStudentTurma };
          }
          return s;
        });
        saveStateLocally(updated, deposits);
        addToast('Estudante atualizado!', 'success');
        setEditingStudent(null);
        resetStudentForm();
      }
    } else {
      if (usingApi) {
        try {
          const res = await fetch(`${API_BASE}/secretaria/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            addToast('Estudante cadastrado!', 'success');
            loadData();
            resetStudentForm();
          } else {
            const data = await res.json();
            addToast(data.error || 'Erro ao cadastrar.', 'error');
          }
        } catch (err) {
          addToast('Erro ao cadastrar.', 'error');
        }
      } else {
        let maxSeq = 0;
        students.forEach((s) => {
          const parts = s.studentNumber.split('-');
          const lastPart = parts[parts.length - 1];
          const seq = parseInt(lastPart);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        });
        const nextSeq = maxSeq + 1;
        const currentYear = new Date().getFullYear();
        const studentNumber = `IC-IPOCET-${currentYear}-${String(nextSeq).padStart(3, '0')}`;

        const newSt = {
          id: 'ae-student-' + Date.now(),
          name: newStudentName.toUpperCase(),
          studentNumber,
          classGroup: newStudentTurma,
          balance: 0
        };
        const updated = [...students, newSt];
        saveStateLocally(updated, deposits);
        addToast('Estudante cadastrado!', 'success');
        resetStudentForm();
      }
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm('Deseja realmente remover esta conta estudantil?')) {
      return;
    }

    if (usingApi) {
      try {
        const res = await fetch(`${API_BASE}/secretaria/students/${studentId}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro na resposta do servidor');
        
        addToast('Estudante eliminado com sucesso!', 'success');
        if (editingStudent?.id === studentId) {
          setEditingStudent(null);
          resetStudentForm();
        }
        loadData();
      } catch (err: any) {
        addToast(err.message || 'Erro ao eliminar estudante.', 'error');
      }
    } else {
      const updated = students.filter((s) => s.id !== studentId);
      saveStateLocally(updated, deposits);
      addToast('Estudante removido com sucesso!', 'success');
      if (editingStudent?.id === studentId) {
        setEditingStudent(null);
        resetStudentForm();
      }
    }
  };

  // --- MENU CRUD ---
  const handleOpenProductModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setProductFormData({ name: product.name, price: String(product.price), category: product.category || 'Cantina' });
    } else {
      setEditingProduct(null);
      setProductFormData({ name: '', price: '', category: 'Cantina' });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usingApi) return addToast('Apenas em modo API.', 'error');
    setIsLoading(true);
    try {
      const payload = {
        name: productFormData.name,
        price: Number(productFormData.price),
        category: productFormData.category
      };
      
      let res;
      if (editingProduct) {
        res = await fetch(`${API_BASE}/secretaria/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE}/secretaria/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      addToast('Produto guardado com sucesso!', 'success');
      setIsProductModalOpen(false);
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Erro ao guardar produto', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Tem a certeza que deseja eliminar este produto? O histórico não será afetado.')) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/secretaria/products/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      addToast('Produto eliminado com sucesso!', 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Erro ao eliminar produto', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetStudentForm = () => {
    setNewStudentName('');
    setEditingStudent(null);
  };

  const handleRegisterPhysicalDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(physicalDepositAmount);
    if (!selectedDepositStudentId || isNaN(amountNum) || amountNum <= 0) {
      addToast('Preencha os dados do depósito.', 'error');
      return;
    }

    const autoReceiptRef = `DEP-PHYS-${Date.now()}`;

    if (usingApi) {
      try {
        const res = await fetch(`${API_BASE}/secretaria/students/${selectedDepositStudentId}/deposit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amountNum,
            receiptRef: autoReceiptRef
          })
        });
        const data = await res.json();
        if (res.ok) {
          addToast('Depósito físico lançado com sucesso!', 'success');
          setPhysicalDepositAmount('');
          setSelectedDepositStudentId('');
          setDepositSearchQuery('');
          loadData();
        } else {
          addToast(data.error || 'Erro ao lançar depósito.', 'error');
        }
      } catch (err) {
        addToast('Erro ao ligar ao servidor.', 'error');
      }
    } else {
      const updatedSts = students.map((s) => {
        if (s.id === selectedDepositStudentId) {
          return { ...s, balance: s.balance + amountNum };
        }
        return s;
      });

      const newDep = {
        id: 'dep-' + Date.now(),
        studentId: selectedDepositStudentId,
        amount: amountNum,
        receiptRef: autoReceiptRef,
        status: 'APPROVED',
        student: {
          name: students.find((s) => s.id === selectedDepositStudentId)?.name || 'Estudante',
          studentNumber: students.find((s) => s.id === selectedDepositStudentId)?.studentNumber || 'N/A'
        }
      };

      saveStateLocally(updatedSts, [newDep, ...deposits]);
      addToast('Saldo creditado com sucesso!', 'success');
      setPhysicalDepositAmount('');
      setSelectedDepositStudentId('');
      setDepositSearchQuery('');
    }
  };

  const handleAddToCart = (product: any) => {
    setCanteenCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCanteenCart((prev) => 
      prev.map((item) => 
        item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      ).filter((item) => item.quantity > 0)
    );
  };

  const getCartTotal = () => {
    return canteenCart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const handleSimulateScan = () => {
    if (!cardFlipped) {
      addToast('Vire o cartão do estudante para o verso para mostrar o QR Code!', 'error');
      return;
    }
    setIsScanning(true);
    setScannedStudent(null);
    setCanteenReceipt(null);
    
    setTimeout(() => {
      setIsScanning(false);
      const currentSimulated = students.find((s) => s.id === simulatedStudentId);
      if (currentSimulated) {
        setScannedStudent(currentSimulated);
        addToast(`Código QR Escaneado!`, 'success');
      }
    }, 800);
  };

  const handleConfirmPurchase = async () => {
    if (!scannedStudent || canteenCart.length === 0) return;
    const total = getCartTotal();

    if (scannedStudent.balance < total) {
      addToast('Saldo insuficiente!', 'error');
      return;
    }

    const cartItems = canteenCart.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity
    }));

    if (usingApi) {
      try {
        const res = await fetch(`${API_BASE}/cantina/purchases`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: scannedStudent.id, items: cartItems })
        });
        if (res.ok) {
          addToast('Venda realizada!', 'success');
          setCanteenReceipt({
            studentName: scannedStudent.name,
            studentNumber: scannedStudent.studentNumber,
            total,
            items: cartItems,
            date: new Date().toISOString()
          });
          setCanteenCart([]);
          setScannedStudent(null);
          loadData();
        }
      } catch (err) {
        addToast('Erro na cobrança.', 'error');
      }
    } else {
      const updatedSts = students.map((s) => {
        if (s.id === scannedStudent.id) {
          return { ...s, balance: s.balance - total };
        }
        return s;
      });

      const newPurchLog = {
        id: 'purch-' + Date.now(),
        studentId: scannedStudent.id,
        totalAmount: total,
        items: cartItems,
        createdAt: new Date().toISOString(),
        student: {
          name: scannedStudent.name,
          studentNumber: scannedStudent.studentNumber,
          classGroup: scannedStudent.classGroup
        }
      };
      const updatedPurchases = [newPurchLog, ...purchases];

      saveStateLocally(updatedSts, deposits, updatedPurchases);
      
      setCanteenReceipt({
        studentName: scannedStudent.name,
        studentNumber: scannedStudent.studentNumber,
        total,
        items: cartItems,
        date: new Date().toISOString()
      });

      setCanteenCart([]);
      setScannedStudent(null);
      addToast('Venda realizada!', 'success');
    }
  };

  const filteredStudents = students.filter((s) => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.studentNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const depositFilteredStudents = students.filter((s) => 
    s.name.toLowerCase().includes(depositSearchQuery.toLowerCase()) || 
    s.studentNumber.toLowerCase().includes(depositSearchQuery.toLowerCase())
  );

  const simulatedStudent = students.find((s) => s.id === simulatedStudentId) || students[0];

  const unifiedTransactions = [
    ...deposits.map((d) => ({
      id: d.id,
      type: 'DEPOSIT' as const,
      date: new Date(d.createdAt),
      amount: d.amount,
      reference: d.receiptRef,
      studentName: d.student?.name || 'N/A',
      studentNumber: d.student?.studentNumber || 'N/A',
      classGroup: d.student?.classGroup || 'N/A',
      details: `Depósito Físico (Aprovado por: ${d.approvedBy || 'N/A'})`
    })),
    ...purchases.map((p) => ({
      id: p.id,
      type: 'PURCHASE' as const,
      date: new Date(p.createdAt),
      amount: -p.totalAmount,
      reference: `COMPRA-${p.id.substring(0, 8).toUpperCase()}`,
      studentName: p.student?.name || 'N/A',
      studentNumber: p.student?.studentNumber || 'N/A',
      classGroup: p.student?.classGroup || 'N/A',
      details: Array.isArray(p.items) 
        ? p.items.map((it: any) => `${it.quantity}x ${it.name}`).join(', ')
        : 'Itens de Cantina'
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const filteredTransactions = unifiedTransactions.filter((tx) => {
    const matchesSearch = 
      tx.studentName.toLowerCase().includes(monitorSearchTerm.toLowerCase()) ||
      tx.studentNumber.toLowerCase().includes(monitorSearchTerm.toLowerCase()) ||
      tx.reference.toLowerCase().includes(monitorSearchTerm.toLowerCase()) ||
      tx.details.toLowerCase().includes(monitorSearchTerm.toLowerCase());
      
    if (selectedMonitorType === 'all') return matchesSearch;
    if (selectedMonitorType === 'deposits') return matchesSearch && tx.type === 'DEPOSIT';
    if (selectedMonitorType === 'purchases') return matchesSearch && tx.type === 'PURCHASE';
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#010206] text-slate-100 font-sans relative overflow-x-hidden p-4 md:p-8 flex flex-col justify-between">
      <div className="glow-orb glow-orb-primary w-[300px] h-[300px] -top-20 -left-20"></div>
      <div className="glow-orb glow-orb-cyan w-[400px] h-[400px] bottom-10 -right-20"></div>

      <header className="relative z-10 w-full max-w-6xl mx-auto flex flex-row justify-between items-center border border-white/5 bg-slate-950/80 backdrop-blur-xl p-5 rounded-3xl mb-8 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="font-black tracking-tight text-white text-2xl">IPOCARD</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
            usingApi 
              ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' 
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            {usingApi ? 'API Online' : 'Modo Contingência'}
          </span>
        </div>

        <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => {
              setCurrentView('secretaria');
              setSearchTerm('');
            }}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              currentView === 'secretaria' ? 'bg-brand-royal text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Lançamentos
          </button>
          <button 
            onClick={() => {
              setCurrentView('alunos');
              setSearchTerm('');
            }}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              currentView === 'alunos' ? 'bg-brand-royal text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Contas Estudantes
          </button>
          <button 
            onClick={() => setCurrentView('recibos')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              currentView === 'recibos' ? 'bg-brand-royal text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Recibos/Monitor
          </button>
          <button 
            onClick={() => setCurrentView('menu')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              currentView === 'menu' ? 'bg-brand-royal text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Gerir Menu
          </button>
          <button 
            onClick={() => {
              setCurrentView('simulador');
              setSearchTerm('');
            }}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              currentView === 'simulador' ? 'bg-brand-royal text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Simulador
          </button>
          <button 
            onClick={() => {
              setCurrentView('credenciais');
              setSearchTerm('');
            }}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              currentView === 'credenciais' ? 'bg-brand-royal text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Credenciais
          </button>
        </div>
      </header>

      {/* VIEW: SECRETARIA */}
      {currentView === 'secretaria' && (
        <main className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-slate-950/90 border border-white/5 p-8 rounded-3xl flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-6">Lançar Depósito </h2>
              <form onSubmit={handleRegisterPhysicalDeposit} className="space-y-6">
                <div className="relative">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Aluno Destinatário</label>
                  <div className="relative">
                    <input 
                      type="text"
                      required
                      placeholder="Pesquisar por nome ou nº de conta..."
                      value={depositSearchQuery}
                      onChange={(e) => {
                        setDepositSearchQuery(e.target.value);
                        setDepositDropdownOpen(true);
                        const matching = students.find((s) => `${s.name} (${s.studentNumber})` === e.target.value);
                        if (matching) setSelectedDepositStudentId(matching.id);
                        else setSelectedDepositStudentId('');
                      }}
                      onFocus={() => setDepositDropdownOpen(true)}
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-4 pr-10 text-base text-white focus:outline-none focus:border-brand-cyan transition-all"
                    />
                    {selectedDepositStudentId && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDepositStudentId('');
                          setDepositSearchQuery('');
                          setDepositDropdownOpen(false);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {depositDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setDepositDropdownOpen(false)}/>
                      <div className="absolute left-0 right-0 mt-2 bg-slate-950 border border-white/10 rounded-2xl max-h-[220px] overflow-y-auto z-20 shadow-2xl p-2 space-y-1">
                        {depositFilteredStudents.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-4">Nenhum aluno encontrado</p>
                        ) : (
                          depositFilteredStudents.map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => {
                                setSelectedDepositStudentId(st.id);
                                setDepositSearchQuery(`${st.name} (${st.studentNumber})`);
                                setDepositDropdownOpen(false);
                              }}
                              className={`w-full text-left p-3 rounded-xl transition-all text-sm flex justify-between items-center ${
                                selectedDepositStudentId === st.id ? 'bg-brand-royal text-white font-bold' : 'hover:bg-slate-900 text-slate-300'
                              }`}
                            >
                              <div>
                                <p className="font-bold">{st.name}</p>
                                <p className="text-xs opacity-60 font-mono mt-0.5">{st.studentNumber}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
                <input 
                  type="number" 
                  required
                  placeholder="Valor do Depósito (Kz)"
                  value={physicalDepositAmount}
                  onChange={(e) => setPhysicalDepositAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-brand-cyan transition-all"
                />
                <button 
                  type="submit" 
                  className="w-full bg-brand-royal hover:bg-brand-medium text-white font-bold py-4 rounded-xl text-base transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Check className="w-6 h-6" />
                  Lançar Saldo
                </button>
              </form>
            </div>
          </section>
          <section className="bg-slate-950/90 border border-white/5 p-8 rounded-3xl flex flex-col justify-between min-h-[350px]">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-5">Emitir Cartões</h2>
              <div className="relative mb-4">
                <input 
                  type="text" 
                  placeholder="Procurar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                />
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1">
                {filteredStudents.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">Nenhum aluno encontrado.</p>
                ) : (
                  filteredStudents.map((st) => (
                    <div key={st.id} className="flex justify-between items-center bg-slate-900/60 border border-white/5 p-4 rounded-2xl hover:bg-slate-900 transition-all">
                      <div>
                        <p className="font-bold text-white text-sm">{st.name}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{st.studentNumber}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-teal-400 font-black text-sm">{st.balance.toLocaleString('pt-PT')} Kz</span>
                        <button 
                          onClick={() => {
                            setSelectedStudent(st);
                            setShowPrintModal(true);
                          }}
                          className="bg-brand-royal/20 border border-brand-royal/30 hover:bg-brand-royal text-brand-cyan hover:text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all"
                        >
                          Emitir
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </main>
      )}

      {/* VIEW: ALUNOS */}
      {currentView === 'alunos' && (
        <main className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-slate-950/90 border border-white/5 p-8 rounded-3xl flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-brand-cyan" />
                {editingStudent ? 'Editar Conta de Aluno' : 'Criar Nova Conta Estudantil'}
              </h2>
              <form onSubmit={handleRegisterStudent} className="space-y-6">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Nome do Aluno</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Matheus Domingos"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-brand-cyan transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Turma / Curso</label>
                  <select 
                    value={newStudentTurma}
                    onChange={(e) => setNewStudentTurma(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-brand-cyan transition-all"
                  >
                    <option value="12ª Classe - Informática">12ª Classe - Informática</option>
                    <option value="11ª Classe - Construção Civil">11ª Classe - Construção Civil</option>
                    <option value="10ª Classe - Eletricidade">10ª Classe - Eletricidade</option>
                  </select>
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-brand-royal hover:bg-brand-medium text-white font-bold py-4 rounded-xl text-base transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {editingStudent ? <Check className="w-6 h-6" /> : <PlusCircle className="w-6 h-6" />}
                  {editingStudent ? 'Guardar Alterações' : 'Criar Conta'}
                </button>
              </form>
            </div>
          </section>
          <section className="bg-slate-950/90 border border-white/5 p-8 rounded-3xl flex flex-col justify-between min-h-[350px]">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-5">Contas de Alunos</h2>
              <div className="relative mb-4">
                <input 
                  type="text" 
                  placeholder="Procurar por nome ou nº de conta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                />
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1">
                {filteredStudents.map((st) => (
                  <div key={st.id} className="flex justify-between items-center bg-slate-900/60 border border-white/5 p-4 rounded-2xl hover:bg-slate-900 transition-all">
                    <div>
                      <p className="font-bold text-white text-sm">{st.name}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{st.studentNumber}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setEditingStudent(st); setNewStudentName(st.name); }}
                        className="p-2.5 bg-slate-850 hover:bg-slate-700 text-slate-300 rounded-xl"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteStudent(st.id)}
                        className="p-2.5 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      )}

      {/* VIEW: MENU CANTINA */}
      {currentView === 'menu' && (
        <div className="relative z-10 w-full max-w-6xl mx-auto bg-slate-950/90 border border-white/5 p-8 rounded-3xl animate-fade-in">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Gestão do Menu</h2>
              <p className="text-slate-500 font-medium">Adicione ou modifique os produtos da cantina.</p>
            </div>
            <button 
              onClick={() => handleOpenProductModal()}
              className="bg-brand-royal hover:bg-brand-royal/90 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              Novo Produto
            </button>
          </div>

          <div className="bg-slate-900/40 rounded-3xl border border-white/5 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-wider font-bold border-b border-white/5">
                  <th className="py-4 px-6">Produto</th>
                  <th className="py-4 px-6">Categoria</th>
                  <th className="py-4 px-6">Preço (Kz)</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm font-medium">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-bold text-white">{product.name}</td>
                    <td className="py-4 px-6 text-slate-400">{product.category}</td>
                    <td className="py-4 px-6 text-teal-400 font-black">{product.price.toLocaleString('pt-PT')}</td>
                    <td className="py-4 px-6 text-right space-x-3">
                      <button onClick={() => handleOpenProductModal(product)} className="text-brand-royal hover:text-white font-bold text-xs">Editar</button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="text-rose-500 hover:text-rose-400 font-bold text-xs">Eliminar</button>
                    </td>
                  </tr>
          <section className="bg-slate-950/90 border border-white/5 p-8 rounded-3xl">
            <div className="mb-8">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-brand-cyan" />
                Gestão de Credenciais
              </h2>
              <p className="text-xs text-slate-400 mt-1">Alterar senhas dos utilizadores da aplicação móvel.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Alunos Senhas */}
              <div>
                <h3 className="text-sm font-bold text-white uppercase mb-4 border-b border-white/10 pb-2">Contas de Estudantes</h3>
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Pesquisar aluno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                  />
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                </div>
                
                <div className="space-y-3 overflow-y-auto max-h-[400px] pr-1">
                  {filteredStudents.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">Nenhum aluno encontrado.</p>
                  ) : (
                    filteredStudents.map((st) => (
                      <div key={st.id} className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl">
                        <div className="mb-2">
                          <p className="font-bold text-white text-sm">{st.name}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{st.studentNumber}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Nova Senha"
                            value={passwordValues[st.id] || ''}
                            onChange={(e) => setPasswordValues((prev) => ({ ...prev, [st.id]: e.target.value }))}
                            className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-cyan"
                          />
                          <button
                            onClick={() => handleChangePassword(st.id)}
                            className="bg-brand-royal hover:bg-brand-medium text-white px-3 py-2 rounded-lg text-xs font-bold transition-all"
                          >
                            Alterar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Cantina Conta */}
              <div>
                <h3 className="text-sm font-bold text-white uppercase mb-4 border-b border-white/10 pb-2">Contas de Sistema (Cantina)</h3>
                <div className="bg-slate-900/60 border border-teal-500/30 p-5 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-teal-500/20 text-teal-400 text-[9px] font-black uppercase px-2 py-1 rounded-bl-lg">Conta Fixa</div>
                  <p className="text-xs text-slate-400 mb-4">Esta conta é utilizada no terminal de ponto de venda (POS) da cantina.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Nome de Utilizador</label>
                      <input 
                        type="text" 
                        readOnly 
                        value="cantina" 
                        className="w-full bg-slate-950 border border-white/5 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Senha (Padrão)</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          readOnly 
                          value="cant123" 
                          className="flex-1 bg-slate-950 border border-white/5 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Configurada no código-fonte (auth.ts)</span>
                  </div>
                </div>
              </div>

            </div>
          </section>
        </main>
      )}

      {/* DUPLICATE RECEIPT MODAL */}
      {selectedReceiptInfo && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white text-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-scale-up font-mono text-xs relative text-left print-visible">
            <button 
              onClick={() => setSelectedReceiptInfo(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 no-print"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <h4 className="font-sans font-black text-sm uppercase tracking-wider">IPOCARD</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">COMPROVATIVO DE OPERAÇÃO</p>
              <p className="text-[9px] text-slate-400 mt-1">{new Date(selectedReceiptInfo.date).toLocaleString('pt-PT')}</p>
            </div>

            <div className="py-4 border-b border-dashed border-slate-300 space-y-2 text-xs">
              <p>Aluno: <span className="font-bold">{selectedReceiptInfo.studentName}</span></p>
              <p>Turma: <span>{selectedReceiptInfo.classGroup}</span></p>
              <p>Nº Conta: <span className="font-bold">{selectedReceiptInfo.studentNumber}</span></p>
              <p>Tipo: <span className="font-black text-slate-700">{selectedReceiptInfo.type === 'DEPOSIT' ? 'DEPÓSITO DE SALDO' : 'COMPRA DE CANTINA'}</span></p>
              <p className="truncate">Ref: <span className="font-mono text-[10px]">{selectedReceiptInfo.reference}</span></p>

              {selectedReceiptInfo.type === 'PURCHASE' && selectedReceiptInfo.items && (
                <div className="mt-3">
                  <div className="text-[10px] font-sans text-slate-400 mb-1">PRODUTOS ADQUIRIDOS:</div>
                  <div className="space-y-1">
                    {selectedReceiptInfo.items.map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-[11px] pl-1">
                        <span>{it.quantity}x {it.name}</span>
                        <span>{(it.price * it.quantity).toLocaleString('pt-PT')} Kz</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReceiptInfo.type === 'DEPOSIT' && (
                <div className="mt-2 text-[11px] pl-1 text-slate-600 italic">
                  {selectedReceiptInfo.details}
                </div>
              )}
            </div>

            <div className="py-4 flex justify-between font-sans text-base">
              <span className="font-bold">Total:</span>
              <span className={`font-black ${selectedReceiptInfo.type === 'DEPOSIT' ? 'text-teal-600' : 'text-rose-600'}`}>
                {selectedReceiptInfo.total.toLocaleString('pt-PT')} Kz
              </span>
            </div>

            <div className="flex gap-2 no-print">
              <button 
                onClick={() => setSelectedReceiptInfo(null)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl transition-all font-sans text-xs"
              >
                Fechar
              </button>
              <button 
                onClick={() => window.print()}
                className="w-1/2 bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all font-sans text-xs flex items-center justify-center gap-1"
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="relative z-10 text-center text-[10px] text-slate-600 mt-8 no-print">
        <span>IPOCARD © 2026</span>
      </footer>

      {/* PRINT MODAL */}
      {showPrintModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-slate-950 border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => {
                setShowPrintModal(false);
                setSelectedStudent(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white no-print"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <h3 className="text-sm font-bold text-white mb-4 no-print">Cartão Estudantil</h3>

            <div className="printable-card-area p-4 bg-slate-900 border border-white/5 rounded-2xl scale-[0.9] flex items-center justify-center">
              <StudentCard student={selectedStudent} />
            </div>

            <div className="flex justify-end gap-2 mt-6 no-print">
              <button 
                onClick={() => {
                  setShowPrintModal(false);
                  setSelectedStudent(null);
                }}
                className="bg-slate-900 border border-white/5 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Voltar
              </button>
              <button 
                onClick={() => window.print()}
                className="bg-brand-royal text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md"
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOASTS */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 no-print">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={`px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold text-white ${
              t.type === 'success' ? 'bg-teal-950 border border-teal-500/30 text-teal-200' : 'bg-red-950 border border-red-500/30 text-red-200'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>

    </div>
  );
}

export default App;
