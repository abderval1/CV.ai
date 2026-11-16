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
  limit
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  User,
  SaaSOrder,
  SaaSCoupon,
  SubscriptionPlan,
  OrderStatus,
  UserRole,
  BillingCycle
} from '../types/cv';
import { getCycleDurationDays, getCyclePriceUSD, normalizeBillingCycle } from '../utils/billingCycles';
import { recordAuditLog } from './auditLogService';

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

function getAuthToken(): string | null {
  try {
    return localStorage.getItem('curriculopro_auth_token') || sessionStorage.getItem('curriculopro_auth_token');
  } catch {
    return null;
  }
}

async function apiRequest<T = any>(url: string, options: RequestInit = {}): Promise<{ ok: boolean; status: number; data: T }> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

function normalizeUserRecord(id: string, data: any): User {
  return {
    id,
    name: data.name || 'Sem Nome',
    email: data.email || '',
    role: data.role || (isUserAdmin(data.email) ? 'admin' : 'user'),
    status: data.status || 'active',
    plan: (data.plan as SubscriptionPlan) || 'free',
    avatarUrl: data.avatarUrl,
    phone: data.phone || '',
    company: data.company || '',
    targetRole: data.targetRole || '',
    creditsRemaining: data.creditsRemaining ?? 5,
    creditsUsed: data.creditsUsed ?? 0,
    totalCvGenerated: data.totalCvGenerated ?? 0,
    billingCycle: data.billingCycle || 'monthly',
    subscriptionExpiresAt: data.subscriptionExpiresAt,
    stripeCustomerId: data.stripeCustomerId,
    stripeSubscriptionId: data.stripeSubscriptionId,
    stripeStatus: data.stripeStatus,
    createdAt: data.createdAt || new Date().toISOString(),
    notes: data.notes || ''
  };
}

// -------------------------------------------------------------
// USERS MANAGEMENT
// -------------------------------------------------------------
export async function fetchAllUsers(): Promise<User[]> {
  const usersByEmail = new Map<string, User>();
  const usersById = new Map<string, User>();

  try {
    const { ok, data } = await apiRequest<{ users?: any[] }>('/api/admin/overview', { method: 'GET' });
    if (ok && Array.isArray(data?.users)) {
      for (const u of data.users) {
        if (!u?.id) continue;
        const normalized = normalizeUserRecord(u.id, u);
        usersById.set(normalized.id, normalized);
        if (normalized.email) usersByEmail.set(normalized.email.toLowerCase(), normalized);
      }
    }
  } catch (e) {
    console.warn('Aviso ao consultar utilizadores no servidor:', e);
  }

  if (auth.currentUser) {
    try {
      const usersCol = collection(db, 'users');
      const snapshot = await getDocs(usersCol);
      snapshot.docs.forEach((d) => {
        const normalized = normalizeUserRecord(d.id, d.data());
        const emailKey = normalized.email.toLowerCase();
        const existing = usersById.get(normalized.id) || (emailKey ? usersByEmail.get(emailKey) : undefined);
        const merged = existing
          ? {
              ...existing,
              ...normalized,
              totalCvGenerated: Math.max(existing.totalCvGenerated || 0, normalized.totalCvGenerated || 0),
              notes: normalized.notes || existing.notes
            }
          : normalized;
        usersById.set(merged.id, merged);
        if (emailKey) usersByEmail.set(emailKey, merged);
      });
    } catch (error: any) {
      if (String(error?.code || '').includes('permission-denied')) {
        handleFirestoreError(error, OperationType.LIST, 'users');
      } else {
        console.warn('Aviso Firestore fetchAllUsers:', error);
      }
    }
  }

  return Array.from(usersById.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function updateUserManagement(
  userId: string,
  updates: Partial<User> & { email?: string }
): Promise<void> {
  const { ok, status, data } = await apiRequest<{ error?: string }>(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });

  if (auth.currentUser) {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return;
    } catch (error: any) {
      const code = String(error?.code || '');
      if (code === 'not-found' && ok) {
        return;
      }
      if (code.includes('permission-denied')) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      } else if (!ok) {
        throw error;
      }
    }
  }

  if (!ok && status !== 404) {
    throw new Error(data?.error || 'Não foi possível atualizar o utilizador no servidor.');
  }
}

export async function createManualCustomer(user: Partial<User>): Promise<User> {
  const cleanEmail = String(user.email || '').trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Por favor, indique um endereço de e-mail válido.');
  }

  let createdUser: User = {
    id: user.id || `usr-${Date.now()}`,
    name: user.name?.trim() || cleanEmail.split('@')[0] || 'Cliente',
    email: cleanEmail,
    role: user.role || 'user',
    status: user.status || 'active',
    plan: user.plan || 'pro',
    phone: user.phone || '',
    creditsRemaining: user.creditsRemaining ?? (user.plan === 'free' ? 5 : 9999),
    creditsUsed: 0,
    totalCvGenerated: 0,
    billingCycle: user.billingCycle || 'monthly',
    createdAt: new Date().toISOString(),
    notes: user.notes || 'Registado manualmente pela equipa administrativa'
  };

  const { ok, data } = await apiRequest<{ user?: User; error?: string }>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(createdUser)
  });

  if (ok && data?.user) {
    createdUser = normalizeUserRecord(data.user.id, data.user);
  } else if (!auth.currentUser) {
    throw new Error(data?.error || 'Não foi possível registar o cliente no servidor.');
  }

  if (auth.currentUser) {
    try {
      const userDocRef = doc(db, 'users', createdUser.id);
      await setDoc(userDocRef, createdUser);
    } catch (error: any) {
      if (String(error?.code || '').includes('permission-denied')) {
        handleFirestoreError(error, OperationType.CREATE, `users/${createdUser.id}`);
      } else if (!ok) {
        throw error;
      }
    }
  }

  return createdUser;
}

// -------------------------------------------------------------
// ORDERS & BILLING TRANSACTIONS
// -------------------------------------------------------------
export async function fetchAllOrders(): Promise<SaaSOrder[]> {
  const ordersMap = new Map<string, SaaSOrder>();

  try {
    const { ok, data } = await apiRequest<{ orders?: SaaSOrder[] }>('/api/admin/overview', { method: 'GET' });
    if (ok && Array.isArray(data?.orders)) {
      data.orders.forEach((o) => {
        if (o?.id) ordersMap.set(o.id, o);
      });
    }
  } catch (e) {
    console.warn('Aviso ao consultar ordens no servidor:', e);
  }

  if (auth.currentUser) {
    try {
      const ordersCol = collection(db, 'orders');
      const q = query(ordersCol, limit(100));
      const snapshot = await getDocs(q);

      snapshot.docs.forEach((d) => {
        const data = d.data();
        const order: SaaSOrder = {
          id: d.id,
          orderNumber: data.orderNumber || `FAT-${d.id.slice(0, 6).toUpperCase()}`,
          userId: data.userId || 'anon',
          userName: data.userName || 'Cliente',
          userEmail: data.userEmail || '',
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
      });
    } catch (error: any) {
      if (String(error?.code || '').includes('permission-denied')) {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      } else {
        console.warn('Aviso Firestore fetchAllOrders:', error);
      }
    }
  }

  return Array.from(ordersMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createSaaSOrder(
  order: Partial<SaaSOrder> & { adminManual?: boolean }
): Promise<SaaSOrder> {
  const orderId = order.id || `ord-${Date.now()}`;
  const now = new Date();
  const sequence = String(Math.floor(1000 + Math.random() * 9000));
  const orderNumber =
    order.orderNumber ||
    `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${sequence}`;

  const billingCycle: BillingCycle = normalizeBillingCycle(order.billingCycle);
  const expirationDays = getCycleDurationDays(billingCycle);
  const subscriptionExpiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString();
  const planId = order.plan || 'pro';
  const defaultAmount = getCyclePriceUSD({ id: planId }, billingCycle);

  const newOrder: SaaSOrder = {
    id: orderId,
    orderNumber,
    userId: order.userId || 'guest',
    userName: order.userName || 'Cliente',
    userEmail: order.userEmail || '',
    plan: planId,
    billingCycle,
    amount: order.amount ?? defaultAmount,
    currency: order.currency || 'USD',
    paymentMethod: order.paymentMethod || 'stripe',
    status: order.status || 'paid',
    stripeSubscriptionId: order.stripeSubscriptionId,
    stripePaymentIntentId: order.stripePaymentIntentId,
    receiptUrl: order.receiptUrl,
    createdAt: now.toISOString(),
    notes: order.notes || 'Subscrição SaaS registada com sucesso'
  };

  saveOrderToLocalCache(newOrder);

  const authToken = getAuthToken();
  let backendOrderSaved = false;
  if (authToken) {
    const endpoint = order.adminManual ? '/api/admin/orders' : '/api/orders';
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(newOrder)
      });
      backendOrderSaved = resp.ok;
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

    if (newOrder.status === 'paid' && newOrder.userId && newOrder.userId !== 'guest' && newOrder.userId !== 'manual') {
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
  } catch (error: any) {
    // Non-admin Card / 100% Promo verified paid orders are persisted authoritatively on the Express backend;
    // Firestore denies direct client writes of status='paid' by non-admins to prevent SDK spoofing.
    if (!order.adminManual && newOrder.status === 'paid' && backendOrderSaved) {
      return newOrder;
    }
    if (String(error?.code || '').includes('permission-denied')) {
      handleFirestoreError(error, OperationType.CREATE, `orders/${orderId}`);
    }
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
    const authToken = getAuthToken();
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
        await apiRequest('/api/stripe/cancel-subscription', {
          method: 'POST',
          body: JSON.stringify({ subscriptionId })
        });
      } catch (e) {
        console.warn('Falha na chamada da API de cancelamento:', e);
      }
    }

    const authToken = getAuthToken();
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

    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        stripeStatus: 'canceled',
        notes: `Assinatura cancelada pelo cliente em ${new Date().toLocaleDateString('pt-PT')}`,
        updatedAt: new Date().toISOString()
      });
    }

    void recordAuditLog({
      actorUserId: userId,
      actorEmail: auth.currentUser?.email || 'user',
      actorRole: 'user',
      action: 'subscription_canceled',
      category: 'subscription',
      severity: 'warning',
      status: 'success',
      targetResource: `users/${userId}`,
      details: subscriptionId
        ? `Subscrição ${subscriptionId} cancelada pelo cliente.`
        : 'Subscrição cancelada pelo cliente.',
      metadata: subscriptionId ? { subscriptionId } : undefined
    });

    return {
      success: true,
      message: 'Assinatura cancelada com sucesso. O seu plano permanecerá válido até ao final do período pago.'
    };
  } catch (err: any) {
    if (auth.currentUser && String(err?.code || '').includes('permission-denied')) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
    return {
      success: false,
      message: err.message || 'Não foi possível cancelar a assinatura no momento.'
    };
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  notes?: string,
  orderMeta?: Partial<SaaSOrder>
): Promise<void> {
  const { ok, data } = await apiRequest<{ error?: string }>(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: newStatus, ...(notes ? { notes } : {}) })
  });

  if (auth.currentUser) {
    try {
      const orderDocRef = doc(db, 'orders', orderId);
      await updateDoc(orderDocRef, {
        status: newStatus,
        ...(notes ? { notes } : {}),
        updatedAt: new Date().toISOString()
      });

      if (newStatus === 'paid' && orderMeta?.userId && orderMeta.userId !== 'guest' && orderMeta.userId !== 'manual') {
        const cycle = normalizeBillingCycle(orderMeta.billingCycle);
        const days = getCycleDurationDays(cycle);
        const userDocRef = doc(db, 'users', orderMeta.userId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          await updateDoc(userDocRef, {
            plan: orderMeta.plan || 'pro',
            creditsRemaining: 9999,
            billingCycle: cycle,
            subscriptionExpiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
            stripeStatus: 'active',
            status: 'active',
            updatedAt: new Date().toISOString()
          });
        }
      }
      return;
    } catch (error: any) {
      const code = String(error?.code || '');
      if (code === 'not-found' && ok) return;
      if (code.includes('permission-denied')) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      } else if (!ok) {
        throw error;
      }
    }
  }

  if (!ok) {
    throw new Error(data?.error || 'Não foi possível atualizar a fatura.');
  }
}

// -------------------------------------------------------------
// COUPONS & DISCOUNT MANAGEMENT
// -------------------------------------------------------------
export async function fetchAllCoupons(): Promise<SaaSCoupon[]> {
  const couponsMap = new Map<string, SaaSCoupon>();

  try {
    const { ok, data } = await apiRequest<{ coupons?: SaaSCoupon[] }>('/api/coupons/public', { method: 'GET' });
    if (ok && Array.isArray(data?.coupons)) {
      data.coupons.forEach((c) => {
        if (c?.id) couponsMap.set(c.id, c);
      });
    }
  } catch {
    // ignore public fetch error
  }

  if (auth.currentUser) {
    try {
      const couponsCol = collection(db, 'coupons');
      const snapshot = await getDocs(couponsCol);
      snapshot.docs.forEach((d) => {
        const data = d.data();
        const item: SaaSCoupon = {
          id: d.id,
          code: data.code || '',
          discountPercent: Number(data.discountPercent) || 0,
          maxUses: Number(data.maxUses) || 100,
          usedCount: Number(data.usedCount) || 0,
          expiresAt: data.expiresAt || '',
          active: Boolean(data.active),
          createdAt: data.createdAt || new Date().toISOString()
        };
        couponsMap.set(item.id, item);
      });
    } catch (error: any) {
      if (String(error?.code || '').includes('permission-denied')) {
        handleFirestoreError(error, OperationType.LIST, 'coupons');
      } else {
        console.warn('Aviso Firestore fetchAllCoupons:', error);
      }
    }
  }

  return Array.from(couponsMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
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

  const { ok, data } = await apiRequest<{ error?: string }>('/api/admin/coupons', {
    method: 'POST',
    body: JSON.stringify(newCoupon)
  });

  if (auth.currentUser) {
    try {
      const couponDocRef = doc(db, 'coupons', couponId);
      await setDoc(couponDocRef, newCoupon);
      return newCoupon;
    } catch (error: any) {
      if (String(error?.code || '').includes('permission-denied')) {
        handleFirestoreError(error, OperationType.CREATE, `coupons/${couponId}`);
      } else if (!ok) {
        throw error;
      }
    }
  }

  if (!ok) {
    throw new Error(data?.error || 'Não foi possível criar o cupom.');
  }

  return newCoupon;
}

export async function toggleCouponActive(couponId: string, currentActive: boolean): Promise<void> {
  const { ok, data } = await apiRequest<{ error?: string }>(`/api/admin/coupons/${encodeURIComponent(couponId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ active: !currentActive })
  });

  if (auth.currentUser) {
    try {
      const couponDocRef = doc(db, 'coupons', couponId);
      await updateDoc(couponDocRef, {
        active: !currentActive,
        updatedAt: new Date().toISOString()
      });
      return;
    } catch (error: any) {
      const code = String(error?.code || '');
      if (code === 'not-found' && ok) return;
      if (code.includes('permission-denied')) {
        handleFirestoreError(error, OperationType.UPDATE, `coupons/${couponId}`);
      } else if (!ok) {
        throw error;
      }
    }
  }

  if (!ok) {
    throw new Error(data?.error || 'Não foi possível atualizar o cupom.');
  }
}

export async function deleteCoupon(couponId: string): Promise<void> {
  const { ok, data } = await apiRequest<{ error?: string }>(`/api/admin/coupons/${encodeURIComponent(couponId)}`, {
    method: 'DELETE'
  });

  if (auth.currentUser) {
    try {
      const couponDocRef = doc(db, 'coupons', couponId);
      await deleteDoc(couponDocRef);
      return;
    } catch (error: any) {
      const code = String(error?.code || '');
      if (code === 'not-found' && ok) return;
      if (code.includes('permission-denied')) {
        handleFirestoreError(error, OperationType.DELETE, `coupons/${couponId}`);
      } else if (!ok) {
        throw error;
      }
    }
  }

  if (!ok) {
    throw new Error(data?.error || 'Não foi possível eliminar o cupom.');
  }
}

export async function incrementCouponUsage(couponId: string, currentUsed: number): Promise<void> {
  try {
    await apiRequest(`/api/coupons/${encodeURIComponent(couponId)}/use`, { method: 'POST' });
  } catch {
    // ignore backend error
  }

  if (auth.currentUser) {
    try {
      const couponDocRef = doc(db, 'coupons', couponId);
      await updateDoc(couponDocRef, {
        usedCount: (currentUsed || 0) + 1,
        updatedAt: new Date().toISOString()
      });
    } catch {
      // client may not have admin Firestore coupon write access; server endpoint handles persistence
    }
  }
}

export async function anonymizeUserRecord(userId: string): Promise<void> {
  const { ok, data } = await apiRequest<{ error?: string }>(`/api/admin/users/${encodeURIComponent(userId)}/anonymize`, {
    method: 'POST'
  });

  if (auth.currentUser) {
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
      return;
    } catch (error: any) {
      const code = String(error?.code || '');
      if (code === 'not-found' && ok) return;
      if (code.includes('permission-denied')) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      } else if (!ok) {
        throw error;
      }
    }
  }

  if (!ok) {
    throw new Error(data?.error || 'Não foi possível anonimizar o utilizador.');
  }
}

export async function deleteUserAccountRecord(userId: string): Promise<void> {
  const { ok, data } = await apiRequest<{ error?: string }>(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE'
  });

  if (auth.currentUser) {
    try {
      const userDocRef = doc(db, 'users', userId);
      await deleteDoc(userDocRef);
      return;
    } catch (error: any) {
      const code = String(error?.code || '');
      if (code === 'not-found' && ok) return;
      if (code.includes('permission-denied')) {
        handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
      } else if (!ok) {
        throw error;
      }
    }
  }

  if (!ok) {
    throw new Error(data?.error || 'Não foi possível eliminar o utilizador.');
  }
}

