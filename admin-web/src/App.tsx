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
  const [currentView, setCurrentView] = useState<'secretaria' | 'alunos' | 'simulador' | 'recibos'>('secretaria');
  const [usingApi, setUsingApi] = useState<boolean>(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);
  
  const [students, setStudents] = useState<any[]>(INITIAL_STUDENTS);
  const [products] = useState<any[]>(INITIAL_PRODUCTS);
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
      // CRUD: CREATE (studentNumber will be auto-generated sequentially on the server/locally)
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
        // Auto-generate studentNumber sequentially locally for offline mode
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

  // CRUD: DELETE
  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm('Deseja realmente remover esta conta estudantil?')) {
      return;
    }

    if (usingApi) {
      try {
        const res = await fetch(`${API_BASE}/secretaria/students/${studentId}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          addToast('Estudante removido com sucesso!', 'success');
          if (editingStudent?.id === studentId) {
            setEditingStudent(null);
            resetStudentForm();
          }
          loadData();
        } else {
          const data = await res.json();
          addToast(data.error || 'Erro ao remover.', 'error');
        }
      } catch (err) {
        addToast('Erro ao ligar ao servidor.', 'error');
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

  const resetStudentForm = () => {
    setNewStudentName('');
    setEditingStudent(null);
  };

  // Secretariat processes direct physical deposit
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

  // Unified transaction history for monitoring and audits
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
      {/* Dark background elements */}
      <div className="glow-orb glow-orb-primary w-[300px] h-[300px] -top-20 -left-20"></div>
      <div className="glow-orb glow-orb-cyan w-[400px] h-[400px] bottom-10 -right-20"></div>

      {/* HEADER NAVBAR */}
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

        {/* Navigation Mode */}
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
            onClick={() => {
              setCurrentView('recibos');
              setSearchTerm('');
            }}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              currentView === 'recibos' ? 'bg-brand-royal text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Recibos/Monitor
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
        </div>
      </header>

      {/* VIEW: SECRETARIA (LANÇAMENTOS & EMISSÕES) */}
      {currentView === 'secretaria' && (
        <main className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Lançar Depósito Físico */}
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
                        if (matching) {
                          setSelectedDepositStudentId(matching.id);
                        } else {
                          setSelectedDepositStudentId('');
                        }
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
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setDepositDropdownOpen(false)}
                      />
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
                                selectedDepositStudentId === st.id 
                                  ? 'bg-brand-royal text-white font-bold' 
                                  : 'hover:bg-slate-900 text-slate-300'
                              }`}
                            >
                              <div>
                                <p className="font-bold">{st.name}</p>
                                <p className="text-xs opacity-60 font-mono mt-0.5">{st.studentNumber}</p>
                              </div>
                              <span className="text-xs opacity-85">{st.classGroup}</span>
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

          {/* Diretório de Cartões (Emissões) */}
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

      {/* VIEW: CONTAS ESTUDANTES (CRUD EXCLUSIVO) */}
      {currentView === 'alunos' && (
        <main className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Registar / Editar Conta */}
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
                
                {editingStudent ? (
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Nº de Conta Estudante (Código QR)</label>
                    <input 
                      type="text" 
                      readOnly
                      value={editingStudent.studentNumber}
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-4 text-base text-slate-400 font-mono focus:outline-none cursor-not-allowed"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Nº de Conta Estudante (Código QR)</label>
                    <input 
                      type="text" 
                      readOnly
                      placeholder="Atribuído Automaticamente Sequencial"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-4 text-base text-slate-500 font-mono focus:outline-none cursor-not-allowed"
                    />
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full bg-brand-royal hover:bg-brand-medium text-white font-bold py-4 rounded-xl text-base transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {editingStudent ? <Check className="w-6 h-6" /> : <PlusCircle className="w-6 h-6" />}
                  {editingStudent ? 'Guardar Alterações' : 'Criar Conta'}
                </button>

                {editingStudent && (
                  <button 
                    type="button"
                    onClick={resetStudentForm}
                    className="w-full bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 font-bold py-4 rounded-xl text-base transition-all mt-2"
                  >
                    Cancelar Edição
                  </button>
                )}
              </form>
            </div>
          </section>

          {/* Gestão e Lista de Contas (CRUD List) */}
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
                {filteredStudents.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">Nenhum aluno encontrado.</p>
                ) : (
                  filteredStudents.map((st) => (
                    <div key={st.id} className="flex justify-between items-center bg-slate-900/60 border border-white/5 p-4 rounded-2xl hover:bg-slate-900 transition-all">
                      <div>
                        <p className="font-bold text-white text-sm">{st.name}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{st.studentNumber} | {st.classGroup}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Edit Button */}
                        <button 
                          onClick={() => {
                            setEditingStudent(st);
                            setNewStudentName(st.name);
                            setNewStudentTurma(st.classGroup);
                          }}
                          className="p-2.5 bg-slate-850 hover:bg-slate-700 hover:text-white text-slate-300 rounded-xl transition-all"
                          title="Editar Conta"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        {/* Delete Button */}
                        <button 
                          onClick={() => handleDeleteStudent(st.id)}
                          className="p-2.5 bg-red-950/20 border border-red-500/20 hover:bg-red-900/50 hover:text-white text-red-400 rounded-xl transition-all"
                          title="Excluir Conta"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* VIEW: SIMULADOR */}
      {currentView === 'simulador' && (
        <main className="relative z-10 w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-8 justify-center py-4">
          
          {/* PHONE 1: STUDENT MOBILE */}
          <div className="relative mx-auto w-[330px] h-[640px] bg-slate-950 rounded-[40px] border-[6px] border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden">
            
            {/* Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-full z-30 flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-slate-950 rounded-full"></span>
            </div>

            {/* Screen Content */}
            <div className="flex-1 flex flex-col bg-[#010206] px-4 py-6 overflow-y-auto mt-6">
              <div className="mb-4">
                <span className="text-[8px] font-bold text-slate-500 block uppercase mb-1">Selecionar Conta:</span>
                <select 
                  value={simulatedStudentId}
                  onChange={(e) => {
                    setSimulatedStudentId(e.target.value);
                    setCardFlipped(false);
                    setScannedStudent(null);
                  }}
                  className="w-full bg-slate-900 border border-white/5 rounded-lg p-2 text-xs text-white focus:outline-none"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Balance Widget */}
              <div className="bg-brand-royal border border-white/10 p-4 rounded-2xl flex flex-col mb-4">
                <span className="text-[9px] font-extrabold text-brand-cyan uppercase tracking-wider">Saldo Estudante</span>
                <span className="text-2xl font-black text-white mt-1">
                  {simulatedStudent?.balance.toLocaleString('pt-PT')} <span className="text-xs">Kz</span>
                </span>
              </div>

              {/* Card visual representation - Premium 3D Flipping Card */}
              <div className="flex flex-col items-center mb-4">
                <span className="text-[8px] text-slate-500 font-bold uppercase mb-2">Toca no cartão para girar:</span>
                <div 
                  onClick={() => setCardFlipped(!cardFlipped)}
                  className="w-[266px] h-[154px] perspective-1000 cursor-pointer relative"
                >
                  <div className={`w-full h-full duration-700 preserve-3d relative transition-transform ${cardFlipped ? 'rotate-y-180' : ''}`}>
                    {/* Front Face */}
                    <div className="absolute inset-0 backface-hidden w-full h-full flex items-center justify-center">
                      <div className="scale-[0.7] origin-center">
                        <StudentCard 
                          student={simulatedStudent}
                          side="front"
                        />
                      </div>
                    </div>
                    {/* Back Face */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 w-full h-full flex items-center justify-center">
                      <div className="scale-[0.7] origin-center">
                        <StudentCard 
                          student={simulatedStudent}
                          side="back"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recentes Transações do Estudante */}
              <div className="flex-1 flex flex-col bg-slate-950/80 border border-white/5 rounded-2xl p-3 overflow-hidden min-h-[220px]">
                <span className="text-[9px] text-slate-500 font-bold uppercase block mb-2">Extrato de Conta</span>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                  {unifiedTransactions.filter(tx => tx.studentNumber === simulatedStudent?.studentNumber).length === 0 ? (
                    <p className="text-[10px] text-slate-650 text-center py-8">Nenhum movimento recente.</p>
                  ) : (
                    unifiedTransactions
                      .filter(tx => tx.studentNumber === simulatedStudent?.studentNumber)
                      .map((tx) => (
                        <div key={tx.id} className="flex justify-between items-center text-[10px] bg-slate-900/60 border border-white/5 p-2 rounded-xl">
                          <div>
                            <p className="text-white font-bold truncate max-w-[130px] uppercase">
                              {tx.type === 'DEPOSIT' ? 'Depósito Recebido' : tx.details}
                            </p>
                            <span className="text-[8px] text-slate-500 font-mono">
                              {tx.date.toLocaleDateString('pt-PT')} | {tx.reference.substring(0, 15)}
                            </span>
                          </div>
                          <span className={`font-black ${tx.type === 'DEPOSIT' ? 'text-teal-400' : 'text-rose-400'}`}>
                            {tx.type === 'DEPOSIT' ? '+' : ''}{tx.amount.toLocaleString('pt-PT')} Kz
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="h-4 bg-slate-950 flex items-center justify-center pb-1">
              <span className="w-20 h-0.5 bg-slate-700 rounded-full"></span>
            </div>
          </div>

          {/* PHONE 2: CANTEEN MOBILE */}
          <div className="relative mx-auto w-[330px] h-[640px] bg-slate-950 rounded-[40px] border-[6px] border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden">
            
            {/* Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-full z-30 flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-slate-950 rounded-full"></span>
            </div>

            {/* Screen Content */}
            <div className="flex-1 flex flex-col bg-[#010206] px-4 py-6 overflow-y-auto mt-6 relative">
              
              {/* Scan Section */}
              {scannedStudent ? (
                <div className="bg-teal-500/10 border border-teal-500/20 p-3 rounded-2xl flex flex-col relative mb-4">
                  <button onClick={() => setScannedStudent(null)} className="absolute top-2 right-2 text-slate-400">
                    <XCircle className="w-4 h-4" />
                  </button>
                  <span className="text-[8px] text-teal-400 font-extrabold uppercase">Estudante Identificado</span>
                  <p className="text-xs font-bold text-white mt-1">{scannedStudent.name}</p>
                  <p className="text-xs font-extrabold text-teal-300 mt-0.5">Saldo: {scannedStudent.balance.toLocaleString('pt-PT')} Kz</p>
                </div>
              ) : (
                <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl text-center mb-4">
                  <button 
                    onClick={handleSimulateScan}
                    disabled={isScanning}
                    className="w-full bg-brand-royal text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    {isScanning ? 'A Ler Cartão...' : 'Escanear Código QR'}
                  </button>
                </div>
              )}

              {/* Menu items */}
              <div className="mb-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase block mb-2">Produtos da Cantina</span>
                <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                  {products.map((p) => {
                    // Category color coding
                    let catColor = "bg-blue-500/10 border-blue-500/20 text-blue-400";
                    if (p.category === 'Lanches') catColor = "bg-amber-500/10 border-amber-500/20 text-amber-400";
                    else if (p.category === 'Sobremesas') catColor = "bg-purple-500/10 border-purple-500/20 text-purple-400";

                    return (
                      <button 
                        key={p.id}
                        onClick={() => handleAddToCart(p)}
                        className="bg-slate-950/80 border border-white/5 p-2 rounded-xl text-left hover:bg-brand-royal/10 hover:border-brand-royal/35 transition-all flex flex-col justify-between h-[64px]"
                      >
                        <div className="flex justify-between items-start w-full">
                          <p className="text-[10px] font-bold text-white truncate max-w-[80px]" title={p.name}>{p.name}</p>
                          <span className={`px-1 py-0.5 rounded text-[7px] font-extrabold uppercase ${catColor}`}>
                            {p.category}
                          </span>
                        </div>
                        <span className="text-[11px] text-brand-cyan font-black">{p.price.toLocaleString('pt-PT')} Kz</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* POS Cart list */}
              <div className="bg-slate-950/80 border border-white/5 p-3 rounded-2xl flex-1 flex flex-col justify-between min-h-[160px]">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Venda Atual</span>
                    {canteenCart.length > 0 && (
                      <button 
                        onClick={() => setCanteenCart([])}
                        className="text-[8px] text-rose-400 hover:text-rose-300 font-black uppercase tracking-wider"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                  
                  {canteenCart.length === 0 ? (
                    <p className="text-[10px] text-slate-500 text-center py-4">Carrinho vazio</p>
                  ) : (
                    <div className="mt-2 space-y-1.5 max-h-[70px] overflow-y-auto pr-1">
                      {canteenCart.map((item) => (
                        <div key={item.product.id} className="flex justify-between items-center text-[10px] bg-slate-900/60 p-1.5 rounded-lg border border-white/5">
                          <span className="text-white truncate max-w-[120px] font-bold">{item.product.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">{item.quantity}x</span>
                            <span className="text-brand-cyan font-bold">{(item.product.price * item.quantity).toLocaleString('pt-PT')} Kz</span>
                            <button 
                              onClick={() => handleRemoveFromCart(item.product.id)} 
                              className="w-5 h-5 bg-red-950/30 hover:bg-red-900 text-red-400 hover:text-white rounded flex items-center justify-center font-black transition-all text-xs"
                            >
                              -
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-white/5 pt-2 mt-2">
                  <div className="flex justify-between text-xs font-bold text-white mb-2">
                    <span>Total a cobrar:</span>
                    <span className="text-brand-cyan font-black">{getCartTotal().toLocaleString('pt-PT')} Kz</span>
                  </div>
                  <button 
                    onClick={handleConfirmPurchase}
                    disabled={canteenCart.length === 0 || !scannedStudent}
                    className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs py-2.5 rounded-xl transition-all"
                  >
                    {!scannedStudent ? 'Aguardando Leitura' : 'Confirmar Venda'}
                  </button>
                </div>
              </div>

              {/* Receipt popup */}
              {canteenReceipt && (
                <div className="absolute inset-0 bg-slate-950/95 z-30 flex items-center justify-center p-4">
                  <div className="bg-white text-slate-800 rounded-3xl p-4 w-full shadow-2xl border border-slate-200 animate-scale-up font-mono text-[10px]">
                    <div className="text-center pb-2 border-b border-dashed border-slate-300">
                      <h4 className="font-sans font-black text-xs uppercase tracking-wider">IPOCARD RECIBO</h4>
                      <p className="text-[8px] text-slate-500">{new Date(canteenReceipt.date).toLocaleTimeString('pt-PT')}</p>
                    </div>

                    <div className="py-2 border-b border-dashed border-slate-300 space-y-1">
                      <p>Aluno: <span className="font-bold">{canteenReceipt.studentName}</span></p>
                      <div className="text-[8px] font-sans text-slate-400 mt-1">ITENS:</div>
                      {canteenReceipt.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-[9px] pl-1">
                          <span>{it.quantity}x {it.name}</span>
                          <span>{it.price * it.quantity} Kz</span>
                        </div>
                      ))}
                    </div>

                    <div className="py-2 flex justify-between font-sans">
                      <span className="font-bold">Pago:</span>
                      <span className="font-black text-teal-600">{canteenReceipt.total} Kz</span>
                    </div>

                    <button 
                      onClick={() => setCanteenReceipt(null)}
                      className="w-full bg-slate-900 text-white font-bold py-2 rounded-lg transition-all font-sans text-xs"
                    >
                      Fechar Recibo
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Bar */}
            <div className="h-4 bg-slate-950 flex items-center justify-center pb-1">
              <span className="w-20 h-0.5 bg-slate-700 rounded-full"></span>
            </div>
          </div>

        </main>
      )}

      {/* VIEW: RECIBOS (MONITOR DE TRANSAÇÕES) */}
      {currentView === 'recibos' && (
        <main className="relative z-10 w-full max-w-6xl mx-auto flex flex-col gap-6">
          <section className="bg-slate-950/90 border border-white/5 p-8 rounded-3xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-6 h-6 text-brand-cyan" />
                  Monitor de Recibos & Auditoria
                </h2>
                <p className="text-xs text-slate-400 mt-1">Histórico completo e reconciliação de todas as transações financeiras</p>
              </div>

              {/* Filter controls */}
              <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-white/5">
                <button
                  onClick={() => setSelectedMonitorType('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedMonitorType === 'all' ? 'bg-brand-royal text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setSelectedMonitorType('deposits')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedMonitorType === 'deposits' ? 'bg-brand-royal text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Depósitos
                </button>
                <button
                  onClick={() => setSelectedMonitorType('purchases')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedMonitorType === 'purchases' ? 'bg-brand-royal text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Compras
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Pesquisar por estudante, número de conta, referência..."
                value={monitorSearchTerm}
                onChange={(e) => setMonitorSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-base text-white placeholder-slate-500 focus:outline-none focus:border-brand-cyan transition-all"
              />
              <Search className="absolute left-4 top-[18px] w-5 h-5 text-slate-500" />
            </div>

            {/* List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-slate-400 uppercase font-black tracking-wider">
                    <th className="py-4 px-4">Data / Hora</th>
                    <th className="py-4 px-4">Estudante</th>
                    <th className="py-4 px-4 text-center">Tipo</th>
                    <th className="py-4 px-4">Referência / Documento</th>
                    <th className="py-4 px-4">Detalhes</th>
                    <th className="py-4 px-4 text-right">Valor (Kz)</th>
                    <th className="py-4 px-4 text-center">Recibo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500">
                        Nenhuma transação encontrada para os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-4 px-4 font-mono text-xs text-slate-400">
                          {tx.date.toLocaleString('pt-PT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-white text-xs uppercase">{tx.studentName}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{tx.studentNumber}</p>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            tx.type === 'DEPOSIT' 
                              ? 'bg-teal-950/50 border border-teal-500/20 text-teal-400' 
                              : 'bg-rose-950/50 border border-rose-500/20 text-rose-400'
                          }`}>
                            {tx.type === 'DEPOSIT' ? 'Depósito' : 'Compra'}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs text-slate-300">
                          {tx.reference}
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-400 max-w-[220px] truncate" title={tx.details}>
                          {tx.details}
                        </td>
                        <td className={`py-4 px-4 text-right font-black ${
                          tx.type === 'DEPOSIT' ? 'text-teal-400' : 'text-rose-400'
                        }`}>
                          {tx.type === 'DEPOSIT' ? '+' : ''}{tx.amount.toLocaleString('pt-PT')} Kz
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => {
                              if (tx.type === 'DEPOSIT') {
                                setSelectedReceiptInfo({
                                  type: 'DEPOSIT',
                                  studentName: tx.studentName,
                                  studentNumber: tx.studentNumber,
                                  classGroup: tx.classGroup,
                                  total: tx.amount,
                                  reference: tx.reference,
                                  date: tx.date.toISOString(),
                                  details: tx.details
                                });
                              } else {
                                const matchedP = purchases.find(p => p.id === tx.id);
                                setSelectedReceiptInfo({
                                  type: 'PURCHASE',
                                  studentName: tx.studentName,
                                  studentNumber: tx.studentNumber,
                                  classGroup: tx.classGroup,
                                  total: Math.abs(tx.amount),
                                  reference: tx.reference,
                                  date: tx.date.toISOString(),
                                  items: matchedP?.items || []
                                });
                              }
                            }}
                            className="bg-brand-royal/10 border border-brand-royal/30 hover:bg-brand-royal/40 text-brand-cyan hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
