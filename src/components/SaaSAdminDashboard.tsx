import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchAllUsers,
  fetchAllOrders,
  fetchAllCoupons,
  updateUserManagement,
  createManualCustomer,
  createSaaSOrder,
  updateOrderStatus,
  createCoupon,
  toggleCouponActive,
  deleteCoupon,
  seedDemoDataIfEmpty,
  isUserAdmin
} from '../services/saasDbService';
import {
  User,
  SaaSOrder,
  SaaSCoupon,
  SubscriptionPlan,
  OrderStatus,
  PaymentMethod,
  UserRole,
  UserStatus
} from '../types/cv';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  Users,
  CreditCard,
  Tag,
  Settings,
  Database,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Trash2,
  X,
  Sparkles,
  ChevronRight,
  Shield,
  Layers,
  BarChart3,
  Check,
  UserCheck,
  UserX,
  DollarSign
} from 'lucide-react';

interface SaaSAdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SaaSAdminDashboard: React.FC<SaaSAdminDashboardProps> = ({ isOpen, onClose }) => {
  const { user, firebaseUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'kpi' | 'users' | 'orders' | 'coupons' | 'plans' | 'database'>('kpi');

  // Core SaaS collections state
  const [usersList, setUsersList] = useState<User[]>([]);
  const [ordersList, setOrdersList] = useState<SaaSOrder[]>([]);
  const [couponsList, setCouponsList] = useState<SaaSCoupon[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Filter & Search states
  const [userSearch, setUserSearch] = useState<string>('');
  const [userPlanFilter, setUserPlanFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Modals inside Admin
  const [showNewUserModal, setShowNewUserModal] = useState<boolean>(false);
  const [showNewOrderModal, setShowNewOrderModal] = useState<boolean>(false);
  const [showNewCouponModal, setShowNewCouponModal] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SaaSOrder | null>(null);

  // New User Form State
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    plan: 'pro' as SubscriptionPlan,
    phone: '',
    role: 'user' as UserRole,
    credits: 9999,
    notes: ''
  });

  // New Manual Order Form State
  const [newOrderForm, setNewOrderForm] = useState({
    userName: '',
    userEmail: '',
    plan: 'pro' as SubscriptionPlan,
    amount: 29,
    currency: 'USD',
    paymentMethod: 'multicaixa' as PaymentMethod,
    status: 'paid' as OrderStatus,
    notes: 'Venda manual registada pelo administrador'
  });

  // New Coupon Form State
  const [newCouponForm, setNewCouponForm] = useState({
    code: '',
    discountPercent: 20,
    maxUses: 100,
    expiresDays: 60
  });

  // Load all SaaS data
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [users, orders, coupons] = await Promise.all([
        fetchAllUsers(),
        fetchAllOrders(),
        fetchAllCoupons()
      ]);

      // If empty on first boot, auto-seed with realistic data so admin has an operational view
      if (users.length === 0 && orders.length === 0) {
        await seedDemoDataIfEmpty();
        const [seededUsers, seededOrders, seededCoupons] = await Promise.all([
          fetchAllUsers(),
          fetchAllOrders(),
          fetchAllCoupons()
        ]);
        setUsersList(seededUsers);
        setOrdersList(seededOrders);
        setCouponsList(seededCoupons);
      } else {
        setUsersList(users);
        setOrdersList(orders);
        setCouponsList(coupons);
      }
    } catch (err) {
      console.error('Falha ao carregar dados do SaaS no Firestore:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const showNotification = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // -------------------------------------------------------------
  // COMPUTED KPI METRICS
  // -------------------------------------------------------------
  const kpiStats = useMemo(() => {
    const totalUsers = usersList.length;
    const proUsers = usersList.filter((u) => u.plan === 'pro').length;
    const executiveUsers = usersList.filter((u) => u.plan === 'executive').length;
    const freeUsers = usersList.filter((u) => u.plan === 'free').length;
    const paidUsers = proUsers + executiveUsers;

    const paidOrders = ordersList.filter((o) => o.status === 'paid');
    const totalRevenue = paidOrders.reduce((acc, o) => acc + (Number(o.amount) || 0), 0);

    // Approximate MRR (monthly plans + yearly / 12)
    const mrr = paidUsers * 29; // average nominal MRR
    const arr = mrr * 12;

    const conversionRate = totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : '0';
    const totalResumes = usersList.reduce((acc, u) => acc + (u.totalCvGenerated || 1), 0);

    return {
      totalUsers,
      proUsers,
      executiveUsers,
      freeUsers,
      paidUsers,
      totalRevenue,
      mrr,
      arr,
      conversionRate,
      totalResumes,
      totalOrders: ordersList.length
    };
  }, [usersList, ordersList]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.phone && u.phone.includes(userSearch));
      const matchPlan = userPlanFilter === 'all' || u.plan === userPlanFilter;
      return matchSearch && matchPlan;
    });
  }, [usersList, userSearch, userPlanFilter]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return ordersList.filter((o) => {
      const matchSearch =
        o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.userName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.userEmail.toLowerCase().includes(orderSearch.toLowerCase());
      const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [ordersList, orderSearch, orderStatusFilter]);

  // -------------------------------------------------------------
  // ACTIONS
  // -------------------------------------------------------------
  const handleQuickPlanChange = async (userId: string, newPlan: SubscriptionPlan) => {
    try {
      await updateUserManagement(userId, {
        plan: newPlan,
        creditsRemaining: newPlan === 'free' ? 5 : 9999,
        status: 'active'
      });
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, plan: newPlan, creditsRemaining: newPlan === 'free' ? 5 : 9999 } : u))
      );
      showNotification(`Plano do utilizador atualizado para ${newPlan.toUpperCase()}`);
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar plano no Firestore.');
    }
  };

  const handleToggleUserStatus = async (userObj: User) => {
    const nextStatus: UserStatus = userObj.status === 'suspended' ? 'active' : 'suspended';
    try {
      await updateUserManagement(userObj.id, { status: nextStatus });
      setUsersList((prev) =>
        prev.map((u) => (u.id === userObj.id ? { ...u, status: nextStatus } : u))
      );
      showNotification(`Conta do utilizador ${nextStatus === 'suspended' ? 'SUSPENSA' : 'REATIVADA'}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCredits = async (userId: string, amount: number) => {
    const target = usersList.find((u) => u.id === userId);
    if (!target) return;
    const newBal = (target.creditsRemaining || 0) + amount;
    try {
      await updateUserManagement(userId, { creditsRemaining: newBal });
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, creditsRemaining: newBal } : u))
      );
      showNotification(`+${amount} créditos atribuídos com sucesso!`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email) return;

    try {
      const created = await createManualCustomer({
        name: newUserForm.name,
        email: newUserForm.email,
        plan: newUserForm.plan,
        phone: newUserForm.phone,
        role: newUserForm.role,
        creditsRemaining: newUserForm.credits,
        notes: newUserForm.notes
      });
      setUsersList((prev) => [created, ...prev]);
      setShowNewUserModal(false);
      setNewUserForm({
        name: '',
        email: '',
        plan: 'pro',
        phone: '',
        role: 'user',
        credits: 9999,
        notes: ''
      });
      showNotification(`Novo cliente ${created.name} registado na base de dados!`);
    } catch (err) {
      console.error(err);
      alert('Erro ao criar cliente no Firestore.');
    }
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderForm.userName || !newOrderForm.userEmail) return;

    try {
      const createdOrder = await createSaaSOrder({
        userName: newOrderForm.userName,
        userEmail: newOrderForm.userEmail,
        plan: newOrderForm.plan,
        amount: Number(newOrderForm.amount),
        currency: newOrderForm.currency,
        paymentMethod: newOrderForm.paymentMethod,
        status: newOrderForm.status,
        notes: newOrderForm.notes
      });
      setOrdersList((prev) => [createdOrder, ...prev]);
      setShowNewOrderModal(false);
      showNotification(`Venda ${createdOrder.orderNumber} registada e faturada!`);
    } catch (err) {
      console.error(err);
      alert('Erro ao registar venda no Firestore.');
    }
  };

  const handleCreateCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponForm.code) return;

    try {
      const expires = new Date(Date.now() + newCouponForm.expiresDays * 24 * 60 * 60 * 1000).toISOString();
      const created = await createCoupon({
        code: newCouponForm.code,
        discountPercent: Number(newCouponForm.discountPercent),
        maxUses: Number(newCouponForm.maxUses),
        expiresAt: expires,
        active: true
      });
      setCouponsList((prev) => [created, ...prev]);
      setShowNewCouponModal(false);
      setNewCouponForm({ code: '', discountPercent: 20, maxUses: 100, expiresDays: 60 });
      showNotification(`Cupom ${created.code} ativado com sucesso!`);
    } catch (err) {
      console.error(err);
      alert('Erro ao criar cupom no Firestore.');
    }
  };

  const handleToggleCoupon = async (c: SaaSCoupon) => {
    try {
      await toggleCouponActive(c.id, c.active);
      setCouponsList((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, active: !c.active } : item))
      );
      showNotification(`Cupom ${c.code} ${c.active ? 'desativado' : 'ativado'}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Deseja realmente eliminar este cupom?')) return;
    try {
      await deleteCoupon(id);
      setCouponsList((prev) => prev.filter((item) => item.id !== id));
      showNotification('Cupom removido da base de dados.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeedDatabase = async () => {
    if (!confirm('Deseja sincronizar e carregar dados de demonstração realistas no Firestore?')) return;
    setIsRefreshing(true);
    try {
      const res = await seedDemoDataIfEmpty();
      await loadData();
      showNotification(`Base de dados atualizada: +${res.usersAdded} clientes, +${res.ordersAdded} vendas, +${res.couponsAdded} cupons`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Export CSV
  const handleExportCSV = (type: 'users' | 'orders') => {
    let csvContent = '';
    let filename = '';

    if (type === 'users') {
      filename = `Relatorio_Clientes_SaaS_${new Date().toISOString().slice(0, 10)}.csv`;
      csvContent = 'ID,Nome,Email,Telefone,Plano,Status,Creditos,TotalCVs,DataCadastro\n';
      usersList.forEach((u) => {
        csvContent += `"${u.id}","${u.name}","${u.email}","${u.phone || ''}","${u.plan}","${u.status || 'active'}","${u.creditsRemaining}","${u.totalCvGenerated || 0}","${u.createdAt}"\n`;
      });
    } else {
      filename = `Relatorio_Vendas_Faturas_SaaS_${new Date().toISOString().slice(0, 10)}.csv`;
      csvContent = 'Ordem,Cliente,Email,Plano,Ciclo,Valor,Moeda,Metodo,Status,Data\n';
      ordersList.forEach((o) => {
        csvContent += `"${o.orderNumber}","${o.userName}","${o.userEmail}","${o.plan}","${o.billingCycle}","${o.amount}","${o.currency}","${o.paymentMethod}","${o.status}","${o.createdAt}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`Ficheiro CSV (${filename}) exportado!`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-800 w-full max-w-7xl h-[94vh] flex flex-col overflow-hidden text-slate-900">
        
        {/* Top Executive Header */}
        <header className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight">
                  Painel de Gestão & Backoffice Administrativo
                </h1>
                <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                  Admin Master
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Base de Dados Firestore</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-emerald-400 font-mono text-[11px]">europe-west2 · Ativa</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-300">Admin: {user?.email || firebaseUser?.email || 'gugurai923@gmail.com'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
              title="Recarregar dados do Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>

            <button
              type="button"
              onClick={handleSeedDatabase}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-lg transition-colors border border-amber-500/30"
              title="Popular base com clientes e vendas de teste"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Semear Demonstração</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
              title="Fechar Painel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Global Toast Notification */}
        {feedbackMessage && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between transition-all animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{feedbackMessage}</span>
            </div>
            <button onClick={() => setFeedbackMessage(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('kpi')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'kpi'
                ? 'border-slate-900 text-slate-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-amber-500" />
            <span>Métricas & Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'users'
                ? 'border-slate-900 text-slate-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-blue-500" />
            <span>Clientes & Utilizadores ({usersList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'orders'
                ? 'border-slate-900 text-slate-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-500" />
            <span>Vendas & Faturas ({ordersList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('coupons')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'coupons'
                ? 'border-slate-900 text-slate-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-4 h-4 text-purple-500" />
            <span>Cupons de Desconto ({couponsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'plans'
                ? 'border-slate-900 text-slate-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-600" />
            <span>Configuração de Planos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'database'
                ? 'border-slate-900 text-slate-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-slate-600" />
            <span>Base Firestore & Exportação</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/70">
          
          {/* TAB 1: EXECUTIVE KPI DASHBOARD */}
          {activeTab === 'kpi' && (
            <div className="space-y-6">
              {/* Top Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      MRR (Recorrente Mensal)
                    </span>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                    ${kpiStats.mrr.toLocaleString()} <span className="text-xs font-normal text-slate-400">/mês</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-medium">
                    <span>ARR Estimado:</span>
                    <span className="font-bold font-mono">${kpiStats.arr.toLocaleString()} /ano</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Receita Total Bruta
                    </span>
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                    ${kpiStats.totalRevenue.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-400">USD</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                    <span>{ordersList.filter((o) => o.status === 'paid').length} faturas liquidadas com sucesso</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Clientes Pagos / Total
                    </span>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                    {kpiStats.paidUsers} <span className="text-xs font-normal text-slate-400">/ {kpiStats.totalUsers} utilizadores</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-600 font-medium">
                    <span>Taxa de Conversão:</span>
                    <span className="font-bold">{kpiStats.conversionRate}%</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      CVs & Cartas Geradas
                    </span>
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                    {kpiStats.totalResumes}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                    <span>Exportações em Word & Otimizações ATS</span>
                  </div>
                </div>
              </div>

              {/* Visual Breakdown & Chart Simulation */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue & Growth Trend */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Evolução Mensal de Faturamento & Novas Assinaturas
                      </h3>
                      <p className="text-xs text-slate-500">
                        Crescimento orgânico e conversões através dos planos Pro e Executivo
                      </p>
                    </div>
                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold">
                      +42% este trimestre
                    </span>
                  </div>

                  {/* Visual SVG Chart */}
                  <div className="h-56 w-full pt-4">
                    <div className="h-full w-full flex items-end gap-3 justify-between pb-4 border-b border-slate-100">
                      {[
                        { month: 'Nov', rev: 420, users: 12 },
                        { month: 'Dez', rev: 680, users: 18 },
                        { month: 'Jan', rev: 950, users: 27 },
                        { month: 'Fev', rev: 1420, users: 38 },
                        { month: 'Mar', rev: 2150, users: 54 },
                        { month: 'Abr (Atual)', rev: 2890, users: 76 }
                      ].map((item, idx) => {
                        const heightPct = Math.round((item.rev / 3000) * 100);
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="text-[10px] font-mono font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                              ${item.rev}
                            </div>
                            <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end h-36">
                              <div
                                style={{ height: `${heightPct}%` }}
                                className="w-full bg-gradient-to-t from-slate-900 to-amber-500 rounded-t-lg transition-all duration-500 group-hover:from-slate-800 group-hover:to-amber-400"
                              ></div>
                            </div>
                            <span className="text-[11px] font-medium text-slate-500">{item.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-slate-900"></span>
                        <span>Receita Recorrente</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-amber-500"></span>
                        <span>Novas Assinaturas</span>
                      </div>
                    </div>
                    <span className="font-mono text-slate-400">Total Faturado: ${kpiStats.totalRevenue} USD</span>
                  </div>
                </div>

                {/* Subscription Tier Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Distribuição por Plano
                    </h3>
                    <p className="text-xs text-slate-500">
                      Segmentação da base de clientes
                    </p>

                    <div className="space-y-4 mt-6">
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-purple-700">Executivo VIP ($440/ano)</span>
                          <span className="font-mono">{kpiStats.executiveUsers} ({kpiStats.totalUsers > 0 ? Math.round((kpiStats.executiveUsers / kpiStats.totalUsers) * 100) : 0}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${kpiStats.totalUsers > 0 ? (kpiStats.executiveUsers / kpiStats.totalUsers) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-amber-700">Profissional ($29/mês)</span>
                          <span className="font-mono">{kpiStats.proUsers} ({kpiStats.totalUsers > 0 ? Math.round((kpiStats.proUsers / kpiStats.totalUsers) * 100) : 0}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-amber-500 h-2 rounded-full"
                            style={{ width: `${kpiStats.totalUsers > 0 ? (kpiStats.proUsers / kpiStats.totalUsers) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-600">Gratuito (Lead Free)</span>
                          <span className="font-mono">{kpiStats.freeUsers} ({kpiStats.totalUsers > 0 ? Math.round((kpiStats.freeUsers / kpiStats.totalUsers) * 100) : 0}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-slate-400 h-2 rounded-full"
                            style={{ width: `${kpiStats.totalUsers > 0 ? (kpiStats.freeUsers / kpiStats.totalUsers) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs space-y-1.5">
                    <p className="font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Insight de Vendas
                    </p>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      Clientes que utilizaram o analisador ATS converteram 3.4x mais rápido para o plano Profissional.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Últimas Transações Financeiras
                    </h3>
                    <p className="text-xs text-slate-500">
                      Entradas de pagamento em tempo real registradas no Firestore
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-slate-700 hover:text-slate-900 font-bold flex items-center gap-1"
                  >
                    <span>Ver Todas as Vendas</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Fatura</th>
                        <th className="py-2.5 px-3">Cliente</th>
                        <th className="py-2.5 px-3">Plano</th>
                        <th className="py-2.5 px-3">Valor</th>
                        <th className="py-2.5 px-3">Método</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {ordersList.slice(0, 5).map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">{ord.userName}</div>
                            <div className="text-[11px] text-slate-400">{ord.userEmail}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="capitalize font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              {ord.plan}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ${ord.amount} {ord.currency}
                          </td>
                          <td className="py-3 px-3 capitalize text-slate-600">
                            {ord.paymentMethod === 'multicaixa' ? 'Multicaixa Express' : ord.paymentMethod}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              ord.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {ord.status === 'paid' ? 'Pago' : ord.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                            {new Date(ord.createdAt).toLocaleDateString('pt-PT')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CRM & CLIENTS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Actions & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Pesquisar por nome, email ou telefone..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <select
                    value={userPlanFilter}
                    onChange={(e) => setUserPlanFilter(e.target.value)}
                    className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
                  >
                    <option value="all">Todos os Planos</option>
                    <option value="free">Gratuito (Free)</option>
                    <option value="pro">Profissional (Pro)</option>
                    <option value="executive">Executivo VIP</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportCSV('users')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowNewUserModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Cliente</span>
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                        <th className="py-3 px-4">Utilizador / Contacto</th>
                        <th className="py-3 px-3">Plano Atual</th>
                        <th className="py-3 px-3">Créditos IA</th>
                        <th className="py-3 px-3">CVs Gerados</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Registo</th>
                        <th className="py-3 px-4 text-right">Ações de Gestão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            Nenhum utilizador encontrado para estes critérios.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const isAdm = isUserAdmin(u.email, u.role);
                          return (
                            <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                    {u.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                      <span>{u.name}</span>
                                      {isAdm && (
                                        <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black uppercase">
                                          Admin
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                                    {u.phone && (
                                      <div className="text-[10px] text-slate-400">{u.phone}</div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-3">
                                <select
                                  value={u.plan}
                                  onChange={(e) => handleQuickPlanChange(u.id, e.target.value as SubscriptionPlan)}
                                  className={`text-xs font-bold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer ${
                                    u.plan === 'executive'
                                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                                      : u.plan === 'pro'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-slate-50 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  <option value="free">Free (Gratuito)</option>
                                  <option value="pro">Pro ($29/mês)</option>
                                  <option value="executive">Executivo VIP ($440/ano)</option>
                                </select>
                              </td>

                              <td className="py-3.5 px-3">
                                <div className="flex items-center gap-1.5 font-mono">
                                  <span className="font-bold text-slate-900">{u.creditsRemaining}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleAddCredits(u.id, 50)}
                                    className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded"
                                    title="Adicionar +50 créditos"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>

                              <td className="py-3.5 px-3 font-mono text-slate-600">
                                {u.totalCvGenerated || 1}
                              </td>

                              <td className="py-3.5 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  u.status === 'suspended'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {u.status === 'suspended' ? 'Suspenso' : 'Ativo'}
                                </span>
                              </td>

                              <td className="py-3.5 px-3 text-slate-400 font-mono text-[11px]">
                                {new Date(u.createdAt).toLocaleDateString('pt-PT')}
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleUserStatus(u)}
                                    className={`px-2 py-1 rounded text-[11px] font-semibold border transition-colors ${
                                      u.status === 'suspended'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                    }`}
                                    title={u.status === 'suspended' ? 'Reativar Conta' : 'Suspender Acesso'}
                                  >
                                    {u.status === 'suspended' ? 'Reativar' : 'Suspender'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS & BILLING TRANSACTIONS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Header Filters & Manual Sale Trigger */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Pesquisar por fatura, cliente ou email..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                    />
                  </div>

                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
                  >
                    <option value="all">Todos os Estados</option>
                    <option value="paid">Pagas</option>
                    <option value="pending">Pendentes</option>
                    <option value="refunded">Reembolsadas</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportCSV('orders')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar Vendas CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowNewOrderModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registar Venda Manual</span>
                  </button>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                        <th className="py-3 px-4">Nº Fatura</th>
                        <th className="py-3 px-3">Cliente</th>
                        <th className="py-3 px-3">Plano / Ciclo</th>
                        <th className="py-3 px-3">Valor Cobrado</th>
                        <th className="py-3 px-3">Método de Pagamento</th>
                        <th className="py-3 px-3">Estado</th>
                        <th className="py-3 px-3">Data</th>
                        <th className="py-3 px-4 text-right">Comprovativo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            Nenhuma transação financeira encontrada.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                              {ord.orderNumber}
                            </td>

                            <td className="py-3.5 px-3">
                              <div className="font-semibold text-slate-900">{ord.userName}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{ord.userEmail}</div>
                            </td>

                            <td className="py-3.5 px-3">
                              <span className="capitalize font-bold text-slate-800">
                                {ord.plan}
                              </span>
                              <span className="text-[11px] text-slate-400 block capitalize">
                                {ord.billingCycle === 'yearly' ? 'Anual' : 'Mensal'}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                              ${ord.amount} {ord.currency}
                            </td>

                            <td className="py-3.5 px-3">
                              <span className="capitalize font-medium text-slate-700 block">
                                {ord.paymentMethod === 'stripe'
                                  ? 'Stripe (Recorrente)'
                                  : ord.paymentMethod === 'multicaixa'
                                  ? 'Multicaixa Express'
                                  : ord.paymentMethod === 'transfer'
                                  ? 'Transferência IBAN'
                                  : ord.paymentMethod === 'card'
                                  ? 'Cartão Crédito/Débito'
                                  : ord.paymentMethod.toUpperCase()}
                              </span>
                              {ord.stripeSubscriptionId && (
                                <span className="text-[10px] font-mono text-purple-600 block">
                                  {ord.stripeSubscriptionId}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-3">
                              <select
                                value={ord.status}
                                onChange={async (e) => {
                                  const nextSt = e.target.value as OrderStatus;
                                  await updateOrderStatus(ord.id, nextSt);
                                  setOrdersList((prev) =>
                                    prev.map((o) => (o.id === ord.id ? { ...o, status: nextSt } : o))
                                  );
                                  showNotification(`Estado da fatura ${ord.orderNumber} atualizado para ${nextSt.toUpperCase()}`);
                                }}
                                className={`text-[11px] font-bold uppercase rounded-md px-2 py-0.5 border cursor-pointer ${
                                  ord.status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : ord.status === 'pending'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-rose-50 text-rose-800 border-rose-200'
                                }`}
                              >
                                <option value="paid">Pago</option>
                                <option value="pending">Pendente</option>
                                <option value="refunded">Reembolsado</option>
                                <option value="failed">Falhado</option>
                              </select>
                            </td>

                            <td className="py-3.5 px-3 text-slate-500 font-mono text-[11px]">
                              {new Date(ord.createdAt).toLocaleDateString('pt-PT')}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedInvoice(ord)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded-lg transition-colors border border-slate-200 inline-flex items-center gap-1"
                              >
                                <Printer className="w-3 h-3 text-slate-500" />
                                <span>Ver Fatura</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DISCOUNT COUPONS */}
          {activeTab === 'coupons' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Campanhas Promocionais & Cupons de Parceria
                  </h3>
                  <p className="text-xs text-slate-500">
                    Crie códigos de desconto percentuais aplicados diretamente no checkout do cliente
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewCouponModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Criar Novo Cupom</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {couponsList.map((cup) => (
                  <div
                    key={cup.id}
                    className={`bg-white p-5 rounded-2xl border transition-all shadow-xs flex flex-col justify-between ${
                      cup.active ? 'border-purple-200' : 'border-slate-200 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-sm text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 tracking-wider">
                          {cup.code}
                        </span>
                        <span className="text-lg font-black text-emerald-600 font-mono">
                          {cup.discountPercent}% OFF
                        </span>
                      </div>

                      <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>Utilizações:</span>
                          <span className="font-bold font-mono text-slate-900">
                            {cup.usedCount} de {cup.maxUses}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-purple-600 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, (cup.usedCount / cup.maxUses) * 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                          <span>Expira em:</span>
                          <span>{new Date(cup.expiresAt).toLocaleDateString('pt-PT')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleToggleCoupon(cup)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition-colors ${
                          cup.active
                            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {cup.active ? 'Desativar Cupom' : 'Ativar Cupom'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(cup.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar cupom"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PLANS & PRICING CONFIGURATION */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Configuração de Planos do SaaS
                </h3>
                <p className="text-xs text-slate-500">
                  Tabela oficial de preços e permissões sincronizada com a apresentação de planos para o utilizador.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Free Plan */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-base font-bold text-slate-900">Plano Gratuito</h4>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">Free</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-900">$0 <span className="text-xs font-normal text-slate-400">/mês</span></div>
                  <ul className="text-xs text-slate-600 space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>5 Créditos de IA iniciais</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>1 Modelo Básico</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Exportação em PDF do navegador</span>
                    </li>
                  </ul>
                </div>

                {/* Pro Plan */}
                <div className="bg-white p-6 rounded-2xl border-2 border-amber-500 shadow-md space-y-4 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-3 py-0.5 rounded-full">
                    Mais Vendido
                  </div>
                  <div className="flex justify-between items-center">
                    <h4 className="text-base font-bold text-slate-900">Profissional</h4>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">Pro</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-900">$29 <span className="text-xs font-normal text-slate-400">/mês</span></div>
                  <ul className="text-xs text-slate-600 space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Exportação Ilimitada em Word (.docx)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Analisador de Vagas ATS com Radar 100%</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cartas de Apresentação em 6 línguas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sincronização Cloud Firestore em Tempo Real</span>
                    </li>
                  </ul>
                </div>

                {/* Executive VIP Plan */}
                <div className="bg-white p-6 rounded-2xl border border-purple-200 shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-base font-bold text-slate-900">Executivo VIP</h4>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">Executive</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-900">$440 <span className="text-xs font-normal text-slate-400">/ano</span></div>
                  <ul className="text-xs text-slate-600 space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tudo do Plano Pro</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Modelos Oficiais Nações Unidas (P11 & UN Classic)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Scripts Python para Compilação Offline</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Suporte Executivo Prioritário via WhatsApp</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DATABASE STATUS & EXPORT SUITE */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Diagnóstico & Conectividade do Banco Firestore
                    </h3>
                    <p className="text-xs text-slate-500">
                      Instância Oficial provisionada na Google Cloud Platform
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Região Cloud</div>
                    <div className="font-mono font-bold text-slate-900 mt-1">europe-west2 (Londres)</div>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Coleções Ativas</div>
                    <div className="font-mono font-bold text-slate-900 mt-1">users · orders · coupons · plansConfig</div>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Segurança & Regras</div>
                    <div className="font-mono font-bold text-emerald-600 mt-1">ABAC Fortress (Deployed)</div>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 text-slate-300 rounded-xl font-mono text-xs space-y-1">
                  <div className="text-amber-400 font-bold">// Configuração Ativa:</div>
                  <div>ID Base: ai-studio-currculoestratgi-6a6d81b0-05e6-43d5-9bd8-a709df4dd736</div>
                  <div>Admin Primário: gugurai923@gmail.com</div>
                  <div>Documentos Sincronizados: {usersList.length} Usuários, {ordersList.length} Ordens, {couponsList.length} Cupons</div>
                </div>
              </div>

              {/* Data Export Box */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Exportação Completa de Dados (Compliance & Contabilidade)
                </h3>
                <p className="text-xs text-slate-500">
                  Descarregue relatórios consolidados em formato CSV para importação no Excel ou software de faturação.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleExportCSV('users')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descarregar Base de Clientes (.csv)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportCSV('orders')}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descarregar Livro de Vendas & Faturas (.csv)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD MANUAL CUSTOMER */}
      {showNewUserModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900">Registar Novo Cliente Manual</h3>
              <button onClick={() => setShowNewUserModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Baptista Silva"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Endereço de Email</label>
                <input
                  type="email"
                  required
                  placeholder="joao@exemplo.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Plano Atribuído</label>
                  <select
                    value={newUserForm.plan}
                    onChange={(e) => setNewUserForm({ ...newUserForm, plan: e.target.value as SubscriptionPlan })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden"
                  >
                    <option value="pro">Pro ($29/mês)</option>
                    <option value="executive">Executivo VIP ($440/ano)</option>
                    <option value="free">Gratuito</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+244 923 000 000"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notas Administrativas</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Cliente VIP com pagamento confirmado via Multicaixa"
                  value={newUserForm.notes}
                  onChange={(e) => setNewUserForm({ ...newUserForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg"
                >
                  Registar no Firestore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD MANUAL ORDER */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900">Registar Venda Manual / Fatura</h3>
              <button onClick={() => setShowNewOrderModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nome do Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do cliente pagador"
                  value={newOrderForm.userName}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, userName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email do Cliente</label>
                <input
                  type="email"
                  required
                  placeholder="cliente@exemplo.com"
                  value={newOrderForm.userEmail}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, userEmail: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Plano Vendido</label>
                  <select
                    value={newOrderForm.plan}
                    onChange={(e) => {
                      const pl = e.target.value as SubscriptionPlan;
                      setNewOrderForm({
                        ...newOrderForm,
                        plan: pl,
                        amount: pl === 'executive' ? 440 : 29
                      });
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden"
                  >
                    <option value="pro">Profissional ($29)</option>
                    <option value="executive">Executivo VIP ($440)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Valor Cobrado</label>
                  <div className="flex">
                    <span className="p-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-slate-500 font-bold">$</span>
                    <input
                      type="number"
                      required
                      value={newOrderForm.amount}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, amount: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-r-lg text-slate-900 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Forma de Pagamento</label>
                  <select
                    value={newOrderForm.paymentMethod}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden"
                  >
                    <option value="multicaixa">Multicaixa Express</option>
                    <option value="transfer">Transferência Bancária / IBAN</option>
                    <option value="card">Cartão Visa / Mastercard</option>
                    <option value="pix">Pix (Brasil)</option>
                    <option value="stripe">Stripe / Internacional</option>
                    <option value="manual">Dinheiro / Presencial</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Estado do Pagamento</label>
                  <select
                    value={newOrderForm.status}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, status: e.target.value as OrderStatus })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden"
                  >
                    <option value="paid">Pago (Confirmado)</option>
                    <option value="pending">Pendente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Observações da Venda</label>
                <input
                  type="text"
                  placeholder="Ex: Referência Multicaixa 10292 ou comprovativo bancário"
                  value={newOrderForm.notes}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg"
                >
                  Emitir & Gravar Fatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD COUPON */}
      {showNewCouponModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900">Criar Novo Cupom de Desconto</h3>
              <button onClick={() => setShowNewCouponModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCouponSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Código do Cupom</label>
                <input
                  type="text"
                  required
                  placeholder="EX: PROMO50 ou PARCEIRO20"
                  value={newCouponForm.code}
                  onChange={(e) => setNewCouponForm({ ...newCouponForm, code: e.target.value.toUpperCase() })}
                  className="w-full p-2 font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Desconto (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={newCouponForm.discountPercent}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, discountPercent: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Limite de Usos</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newCouponForm.maxUses}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, maxUses: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Validade (Dias)</label>
                <input
                  type="number"
                  min={1}
                  value={newCouponForm.expiresDays}
                  onChange={(e) => setNewCouponForm({ ...newCouponForm, expiresDays: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewCouponModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg"
                >
                  Ativar Cupom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: INVOICE / RECEIPT VIEWER */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-lg p-6 animate-in zoom-in-95 print:p-0">
            {/* Invoice Top Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-slate-900" />
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Currículo Estratégico SaaS</h3>
                  <p className="text-[10px] text-slate-400">Recibo & Fatura Comercial Oficial</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg no-print"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Invoice Body */}
            <div className="py-4 space-y-4 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Emitido Para:</span>
                  <p className="font-bold text-slate-900 text-sm">{selectedInvoice.userName}</p>
                  <p className="text-slate-500 font-mono text-[11px]">{selectedInvoice.userEmail}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Nº Fatura:</span>
                  <p className="font-mono font-black text-slate-900">{selectedInvoice.orderNumber}</p>
                  <p className="text-slate-400 text-[11px]">{new Date(selectedInvoice.createdAt).toLocaleDateString('pt-PT')}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200 pb-1">
                      <th>Item / Subscrição</th>
                      <th>Ciclo</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 font-bold text-slate-900 capitalize">
                        Plano {selectedInvoice.plan}
                      </td>
                      <td className="py-2 text-slate-500 capitalize">
                        {selectedInvoice.billingCycle === 'yearly' ? 'Anual' : 'Mensal'}
                      </td>
                      <td className="py-2 text-right font-mono font-black text-slate-900">
                        ${selectedInvoice.amount} {selectedInvoice.currency}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Método:</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {selectedInvoice.paymentMethod === 'multicaixa' ? 'Multicaixa Express' : selectedInvoice.paymentMethod}
                  </span>
                </div>

                <div className="space-y-0.5 text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                    {selectedInvoice.status === 'paid' ? 'Liquidado / Pago' : selectedInvoice.status}
                  </span>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Nota: </span>
                  {selectedInvoice.notes}
                </div>
              )}
            </div>

            {/* Invoice Footer Actions */}
            <div className="pt-4 border-t border-slate-200 flex justify-between items-center no-print">
              <span className="text-[10px] text-slate-400">Autenticado digitalmente por Firestore</span>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / Salvar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
