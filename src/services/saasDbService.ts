import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  User,
  SaaSOrder,
  SaaSCoupon,
  PricingPlan,
  SubscriptionPlan,
  OrderStatus,
  UserRole,
  UserStatus
} from '../types/cv';
import { SAAS_PLANS } from '../data/initialCV';

export const ADMIN_EMAILS = [
  'gugurai923@gmail.com',
  'admin@curriculoestrategico.com',
  'mballoaliou2000@yahoo.fr'
];

export function isUserAdmin(email?: string | null, role?: UserRole): boolean {
  if (role === 'admin') return true;
  if (!email) return false;
  return ADMIN_EMAILS.some((adm) => adm.toLowerCase() === email.trim().toLowerCase());
}

// -------------------------------------------------------------
// USERS MANAGEMENT
// -------------------------------------------------------------
export async function fetchAllUsers(): Promise<User[]> {
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    if (snapshot.empty) return [];

    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || 'Sem Nome',
        email: data.email || '',
        role: data.role || (isUserAdmin(data.email) ? 'admin' : 'user'),
        status: data.status || 'active',
        plan: (data.plan as SubscriptionPlan) || 'free',
        avatarUrl: data.avatarUrl,
        phone: data.phone || '',
        creditsRemaining: data.creditsRemaining ?? 5,
        creditsUsed: data.creditsUsed ?? 0,
        totalCvGenerated: data.totalCvGenerated ?? 1,
        billingCycle: data.billingCycle || 'monthly',
        subscriptionExpiresAt: data.subscriptionExpiresAt,
        createdAt: data.createdAt || new Date().toISOString(),
        notes: data.notes || ''
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
    return [];
  }
}

export async function updateUserManagement(
  userId: string,
  updates: Partial<User>
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}

export async function createManualCustomer(user: Partial<User>): Promise<User> {
  const newId = user.id || `usr-${Date.now()}`;
  const newUser: User = {
    id: newId,
    name: user.name || 'Novo Cliente',
    email: user.email || `cliente-${Date.now()}@exemplo.com`,
    role: user.role || 'user',
    status: user.status || 'active',
    plan: user.plan || 'pro',
    phone: user.phone || '',
    creditsRemaining: user.creditsRemaining ?? (user.plan === 'free' ? 5 : 9999),
    creditsUsed: 0,
    totalCvGenerated: 0,
    billingCycle: user.billingCycle || 'monthly',
    createdAt: new Date().toISOString(),
    notes: user.notes || 'Cadastrado manualmente pela equipa'
  };

  try {
    const userDocRef = doc(db, 'users', newId);
    await setDoc(userDocRef, newUser);
    return newUser;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${newId}`);
    return newUser;
  }
}

// -------------------------------------------------------------
// ORDERS & BILLING TRANSACTIONS
// -------------------------------------------------------------
export async function fetchAllOrders(): Promise<SaaSOrder[]> {
  try {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, limit(100));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return [];

    const orders: SaaSOrder[] = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        orderNumber: data.orderNumber || `FAT-${d.id.slice(0, 6).toUpperCase()}`,
        userId: data.userId || 'anon',
        userName: data.userName || 'Cliente',
        userEmail: data.userEmail || '',
        plan: data.plan || 'pro',
        billingCycle: data.billingCycle || 'monthly',
        amount: Number(data.amount) || 0,
        currency: data.currency || 'USD',
        paymentMethod: data.paymentMethod || 'card',
        status: (data.status as OrderStatus) || 'paid',
        stripeSubscriptionId: data.stripeSubscriptionId,
        stripePaymentIntentId: data.stripePaymentIntentId,
        receiptUrl: data.receiptUrl,
        createdAt: data.createdAt || new Date().toISOString(),
        notes: data.notes || ''
      };
    });

    // sort client-side in case composite indexes are not yet deployed
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'orders');
    return [];
  }
}

export async function createSaaSOrder(order: Partial<SaaSOrder>): Promise<SaaSOrder> {
  const orderId = order.id || `ord-${Date.now()}`;
  const now = new Date();
  const sequence = String(Math.floor(1000 + Math.random() * 9000));
  const orderNumber = order.orderNumber || `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${sequence}`;

  const isYearly = order.billingCycle === 'yearly';
  const expirationDays = isYearly ? 365 : 30;
  const subscriptionExpiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString();

  const newOrder: SaaSOrder = {
    id: orderId,
    orderNumber,
    userId: order.userId || 'guest',
    userName: order.userName || 'Cliente',
    userEmail: order.userEmail || '',
    plan: order.plan || 'pro',
    billingCycle: order.billingCycle || 'monthly',
    amount: order.amount ?? 2,
    currency: order.currency || 'USD',
    paymentMethod: order.paymentMethod || 'stripe',
    status: order.status || 'paid',
    stripeSubscriptionId: order.stripeSubscriptionId,
    stripePaymentIntentId: order.stripePaymentIntentId,
    receiptUrl: order.receiptUrl,
    createdAt: now.toISOString(),
    notes: order.notes || 'Subscrição SaaS ativada via Stripe'
  };

  saveOrderToLocalCache(newOrder);

  const authToken = (() => {
    try {
      return localStorage.getItem('curriculopro_auth_token') || sessionStorage.getItem('curriculopro_auth_token');
    } catch {
      return null;
    }
  })();

  if (authToken) {
    try {
      await fetch('/api/orders', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(newOrder)
      });
    } catch {
      // non-fatal
    }
  }

  if (!auth.currentUser) {
    return newOrder;
  }

  try {
    const orderDocRef = doc(db, 'orders', orderId);
    await setDoc(orderDocRef, newOrder);

    // If customer exists, also update user's plan and credits in users collection
    if (newOrder.userId && newOrder.userId !== 'guest') {
      const userDocRef = doc(db, 'users', newOrder.userId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        await updateDoc(userDocRef, {
          plan: newOrder.plan,
          creditsRemaining: 9999,
          billingCycle: newOrder.billingCycle,
          subscriptionExpiresAt,
          stripeSubscriptionId: newOrder.stripeSubscriptionId || null,
          stripeStatus: 'active',
          status: 'active'
        });
      }
    }

    return newOrder;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `orders/${orderId}`);
    return newOrder;
  }
}

const LOCAL_STORAGE_ORDERS_KEY = 'curriculopro_local_orders';

export function saveOrderToLocalCache(order: SaaSOrder) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    const list: SaaSOrder[] = raw ? JSON.parse(raw) : [];
    const exists = list.some((o) => o.id === order.id || o.orderNumber === order.orderNumber);
    if (!exists) {
      list.unshift(order);
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(list.slice(0, 50)));
    }
  } catch (e) {
    console.warn('Erro ao guardar pedido em cache local:', e);
  }
}

export function getLocalCachedOrders(userId?: string, userEmail?: string): SaaSOrder[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    if (!raw) return [];
    const list: SaaSOrder[] = JSON.parse(raw);
    if (!userId && !userEmail) return list;
    return list.filter(
      (o) =>
        (userId && o.userId === userId) ||
        (userEmail && o.userEmail?.toLowerCase() === userEmail.toLowerCase())
    );
  } catch {
    return [];
  }
}

export async function fetchUserOrders(userId: string, userEmail?: string): Promise<SaaSOrder[]> {
  const localOrders = getLocalCachedOrders(userId, userEmail);
  const ordersMap = new Map<string, SaaSOrder>();
  localOrders.forEach((o) => ordersMap.set(o.id, o));

  try {
    const authToken = localStorage.getItem('curriculopro_auth_token') || sessionStorage.getItem('curriculopro_auth_token');
    if (authToken) {
      const res = await fetch('/api/orders', {
        credentials: 'include',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json?.orders)) {
          (json.orders as SaaSOrder[]).forEach((o) => {
            if (o?.id) {
              ordersMap.set(o.id, o);
              saveOrderToLocalCache(o);
            }
          });
        }
      }
    }
  } catch {
    // ignore backend fetch failure
  }

  if (!auth.currentUser) {
    const allOrders = Array.from(ordersMap.values());
    return allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  try {
    const ordersCol = collection(db, 'orders');
    // 1. Query by userId directly from Firestore
    if (userId) {
      const qUserId = query(ordersCol, where('userId', '==', userId), limit(50));
      const snapUserId = await getDocs(qUserId);
      snapUserId.docs.forEach((d) => {
        const data = d.data();
        const order: SaaSOrder = {
          id: d.id,
          orderNumber: data.orderNumber || `FAT-${d.id.slice(0, 6).toUpperCase()}`,
          userId: data.userId || userId,
          userName: data.userName || 'Cliente',
          userEmail: data.userEmail || userEmail || '',
          plan: data.plan || 'pro',
          billingCycle: data.billingCycle || 'monthly',
          amount: Number(data.amount) || 0,
          currency: data.currency || 'USD',
          paymentMethod: data.paymentMethod || 'stripe',
          status: (data.status as OrderStatus) || 'paid',
          stripeSubscriptionId: data.stripeSubscriptionId,
          stripePaymentIntentId: data.stripePaymentIntentId,
          receiptUrl: data.receiptUrl,
          createdAt: data.createdAt || new Date().toISOString(),
          notes: data.notes || ''
        };
        ordersMap.set(order.id, order);
        saveOrderToLocalCache(order);
      });
    }

    // 2. Query by userEmail if present to link any guest or pre-login sessions
    if (userEmail && userEmail.includes('@')) {
      try {
        const qEmail = query(ordersCol, where('userEmail', '==', userEmail), limit(50));
        const snapEmail = await getDocs(qEmail);
        snapEmail.docs.forEach((d) => {
          const data = d.data();
          const order: SaaSOrder = {
            id: d.id,
            orderNumber: data.orderNumber || `FAT-${d.id.slice(0, 6).toUpperCase()}`,
            userId: data.userId || userId,
            userName: data.userName || 'Cliente',
            userEmail: data.userEmail || userEmail,
            plan: data.plan || 'pro',
            billingCycle: data.billingCycle || 'monthly',
            amount: Number(data.amount) || 0,
            currency: data.currency || 'USD',
            paymentMethod: data.paymentMethod || 'stripe',
            status: (data.status as OrderStatus) || 'paid',
            stripeSubscriptionId: data.stripeSubscriptionId,
            stripePaymentIntentId: data.stripePaymentIntentId,
            receiptUrl: data.receiptUrl,
            createdAt: data.createdAt || new Date().toISOString(),
            notes: data.notes || ''
          };
          ordersMap.set(order.id, order);
          saveOrderToLocalCache(order);
        });
      } catch (e) {
        console.warn('Consulta secundária de pedidos por email:', e);
      }
    }
  } catch (error) {
    console.warn('Aviso ao consultar pedidos no Firestore, utilizando cache:', error);
  }

  const allOrders = Array.from(ordersMap.values());
  return allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function cancelUserSubscription(
  userId: string,
  subscriptionId?: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (subscriptionId) {
      try {
        await fetch('/api/stripe/cancel-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionId })
        });
      } catch (e) {
        console.warn('Falha na chamada da API Stripe de cancelamento:', e);
      }
    }

    if (!auth.currentUser) {
      const authToken = localStorage.getItem('curriculopro_auth_token') || sessionStorage.getItem('curriculopro_auth_token');
      if (authToken) {
        await fetch('/api/auth/sync-plan', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({ stripeStatus: 'canceled' })
        }).catch(() => {});
      }
      return {
        success: true,
        message: 'Assinatura cancelada com sucesso. O seu plano permanecerá válido até ao final do período pago.'
      };
    }

    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      stripeStatus: 'canceled',
      notes: `Assinatura cancelada pelo cliente em ${new Date().toLocaleDateString('pt-PT')}`,
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Assinatura cancelada com sucesso. O seu plano permanecerá válido até ao final do período pago.'
    };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    return {
      success: false,
      message: err.message || 'Não foi possível cancelar a assinatura no momento.'
    };
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  notes?: string
): Promise<void> {
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    await updateDoc(orderDocRef, {
      status: newStatus,
      ...(notes ? { notes } : {}),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
  }
}

// -------------------------------------------------------------
// COUPONS & DISCOUNT MANAGEMENT
// -------------------------------------------------------------
export async function fetchAllCoupons(): Promise<SaaSCoupon[]> {
  if (!auth.currentUser) return [];
  try {
    const couponsCol = collection(db, 'coupons');
    const snapshot = await getDocs(couponsCol);
    if (snapshot.empty) return [];

    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        code: data.code || '',
        discountPercent: Number(data.discountPercent) || 0,
        maxUses: Number(data.maxUses) || 100,
        usedCount: Number(data.usedCount) || 0,
        expiresAt: data.expiresAt || '',
        active: Boolean(data.active),
        createdAt: data.createdAt || new Date().toISOString()
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'coupons');
    return [];
  }
}

export async function createCoupon(coupon: Partial<SaaSCoupon>): Promise<SaaSCoupon> {
  const couponId = coupon.id || `cup-${Date.now()}`;
  const code = (coupon.code || 'PROMO').toUpperCase().trim();

  const newCoupon: SaaSCoupon = {
    id: couponId,
    code,
    discountPercent: Number(coupon.discountPercent) || 20,
    maxUses: Number(coupon.maxUses) || 100,
    usedCount: 0,
    expiresAt: coupon.expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    active: coupon.active ?? true,
    createdAt: new Date().toISOString()
  };

  try {
    const couponDocRef = doc(db, 'coupons', couponId);
    await setDoc(couponDocRef, newCoupon);
    return newCoupon;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `coupons/${couponId}`);
    return newCoupon;
  }
}

export async function toggleCouponActive(couponId: string, currentActive: boolean): Promise<void> {
  try {
    const couponDocRef = doc(db, 'coupons', couponId);
    await updateDoc(couponDocRef, {
      active: !currentActive,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `coupons/${couponId}`);
  }
}

export async function deleteCoupon(couponId: string): Promise<void> {
  try {
    const couponDocRef = doc(db, 'coupons', couponId);
    await deleteDoc(couponDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `coupons/${couponId}`);
  }
}

export async function incrementCouponUsage(couponId: string, currentUsed: number): Promise<void> {
  try {
    const couponDocRef = doc(db, 'coupons', couponId);
    await updateDoc(couponDocRef, {
      usedCount: (currentUsed || 0) + 1,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Erro ao incrementar contagem do cupom:', error);
  }
}

export async function anonymizeUserRecord(userId: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      name: 'Utilizador Anonimizado (RGPD)',
      email: `anon-${userId.slice(0, 8)}@eliminado.rgpd`,
      phone: '',
      status: 'suspended',
      plan: 'free',
      creditsRemaining: 0,
      notes: `Conta anonimizada conforme Art. 17 RGPD em ${new Date().toISOString()}`,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}

export async function deleteUserAccountRecord(userId: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await deleteDoc(userDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
  }
}

// -------------------------------------------------------------
// SEED REALISTIC SAAS DEMO DATA
// -------------------------------------------------------------
export async function seedDemoDataIfEmpty(): Promise<{ usersAdded: number; ordersAdded: number; couponsAdded: number }> {
  let usersAdded = 0;
  let ordersAdded = 0;
  let couponsAdded = 0;

  // 1. Initial Coupons
  const demoCoupons: SaaSCoupon[] = [
    {
      id: 'cup-lancamento',
      code: 'LANCAMENTO50',
      discountPercent: 50,
      maxUses: 200,
      usedCount: 38,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'cup-unvip',
      code: 'UN_SPECIAL',
      discountPercent: 30,
      maxUses: 100,
      usedCount: 14,
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'cup-stripe',
      code: 'STRIPE100',
      discountPercent: 100,
      maxUses: 20,
      usedCount: 7,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      createdAt: new Date().toISOString()
    }
  ];

  for (const c of demoCoupons) {
    try {
      await setDoc(doc(db, 'coupons', c.id), c);
      couponsAdded++;
    } catch (e) {
      console.warn('Erro ao semear cupom:', e);
    }
  }

  // 2. Demo Users & Customers
  const demoUsers: Partial<User>[] = [
    {
      id: 'usr-admin-owner',
      name: 'Administrador SaaS (Owner)',
      email: 'gugurai923@gmail.com',
      role: 'admin',
      status: 'active',
      plan: 'executive',
      creditsRemaining: 9999,
      creditsUsed: 140,
      totalCvGenerated: 42,
      billingCycle: 'yearly',
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Proprietário & Administrador Geral do Sistema'
    },
    {
      id: 'usr-aliou-mballo',
      name: 'Dr. Aliou Diouf Mballo',
      email: 'aliou.mballo@un.org',
      role: 'user',
      status: 'active',
      plan: 'executive',
      phone: '+238 991 2345',
      creditsRemaining: 9999,
      creditsUsed: 65,
      totalCvGenerated: 12,
      billingCycle: 'yearly',
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Economista Sénior & Consultor Internacional de Mercados'
    },
    {
      id: 'usr-antonio-paulo',
      name: 'Carlos Paulo Mendes',
      email: 'c.paulo.mendes@holding.com',
      role: 'user',
      status: 'active',
      plan: 'pro',
      phone: '+55 11 98881-2200',
      creditsRemaining: 850,
      creditsUsed: 32,
      totalCvGenerated: 8,
      billingCycle: 'monthly',
      createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Diretor de Operações & Inovação'
    },
    {
      id: 'usr-claudia-santos',
      name: 'Cláudia Santos Varela',
      email: 'c.santos.varela@empresa.ao',
      role: 'user',
      status: 'active',
      plan: 'pro',
      phone: '+244 912 345 678',
      creditsRemaining: 620,
      creditsUsed: 19,
      totalCvGenerated: 4,
      billingCycle: 'monthly',
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Gestora de Recursos Humanos & Projetos'
    },
    {
      id: 'usr-mateus-cuanza',
      name: 'Mateus Manuel Baptista',
      email: 'mateus.baptista@gmail.com',
      role: 'user',
      status: 'active',
      plan: 'free',
      phone: '+244 934 112 233',
      creditsRemaining: 3,
      creditsUsed: 2,
      totalCvGenerated: 2,
      billingCycle: 'monthly',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Candidato a Vagas Internacionais'
    }
  ];

  for (const u of demoUsers) {
    try {
      await setDoc(doc(db, 'users', u.id!), u);
      usersAdded++;
    } catch (e) {
      console.warn('Erro ao semear utilizador:', e);
    }
  }

  // 3. Demo Orders / Transactions
  const demoOrders: SaaSOrder[] = [
    {
      id: 'ord-1001',
      orderNumber: 'INV-2026-0041',
      userId: 'usr-aliou-mballo',
      userName: 'Dr. Aliou Diouf Mballo',
      userEmail: 'aliou.mballo@un.org',
      plan: 'executive',
      billingCycle: 'yearly',
      amount: 108,
      currency: 'USD',
      paymentMethod: 'stripe',
      status: 'paid',
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Subscrição Anual Executivo VIP aprovada via Cartão Stripe'
    },
    {
      id: 'ord-1002',
      orderNumber: 'INV-2026-0052',
      userId: 'usr-antonio-paulo',
      userName: 'António Paulo Mendes',
      userEmail: 'apaulo2007@hotmail.com',
      plan: 'pro',
      billingCycle: 'monthly',
      amount: 8,
      currency: 'USD',
      paymentMethod: 'stripe',
      status: 'paid',
      createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Pagamento processado via Cartão Internacional Stripe'
    },
    {
      id: 'ord-1003',
      orderNumber: 'INV-2026-0063',
      userId: 'usr-claudia-santos',
      userName: 'Cláudia Santos Varela',
      userEmail: 'c.santos.varela@empresa.com',
      plan: 'pro',
      billingCycle: 'monthly',
      amount: 8,
      currency: 'USD',
      paymentMethod: 'pix',
      status: 'paid',
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Pagamento instantâneo via Pix confirmado'
    },
    {
      id: 'ord-1004',
      orderNumber: 'INV-2026-0074',
      userId: 'usr-antonio-paulo',
      userName: 'António Paulo Mendes',
      userEmail: 'apaulo2007@hotmail.com',
      plan: 'pro',
      billingCycle: 'monthly',
      amount: 8,
      currency: 'USD',
      paymentMethod: 'stripe',
      status: 'paid',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Renovação mensal automática Stripe'
    },
    {
      id: 'ord-1005',
      orderNumber: 'INV-2026-0085',
      userId: 'usr-novocandidato',
      userName: 'Helena Silveira',
      userEmail: 'helena.silveira@outlook.com',
      plan: 'executive',
      billingCycle: 'monthly',
      amount: 12,
      currency: 'USD',
      paymentMethod: 'pix',
      status: 'paid',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Upgrade via Pix Instantâneo'
    }
  ];

  for (const o of demoOrders) {
    try {
      await setDoc(doc(db, 'orders', o.id), o);
      ordersAdded++;
    } catch (e) {
      console.warn('Erro ao semear ordem:', e);
    }
  }

  return { usersAdded, ordersAdded, couponsAdded };
}
