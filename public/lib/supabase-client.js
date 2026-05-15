/**
 * RDP S.A. — Supabase Client (CDN version)
 * Requiere en el HTML (antes de este script):
 * <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
 *
 * Configurar ventana de entorno inyectando las variables:
 *   <script>window.SUPABASE_URL='...' window.SUPABASE_ANON_KEY='...'</script>
 * O a través de la variable de entorno cuando se sirve el HTML desde el servidor.
 */

(function () {
  'use strict';

  // Leer configuración desde variables globales, meta tags o valores del proyecto
  const SUPABASE_URL =
    window.SUPABASE_URL ||
    document.querySelector('meta[name="supabase-url"]')?.content ||
    'https://bfgghdississnxkxupce.supabase.co';

  const SUPABASE_ANON_KEY =
    window.SUPABASE_ANON_KEY ||
    document.querySelector('meta[name="supabase-anon-key"]')?.content ||
    'sb_publishable_a5K2UrbyIoLB5ErPCI0y5g_XCeqW1lM';

  const isConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

  let _client = null;

  function getClient() {
    if (!isConfigured) return null;
    if (!_client) {
      if (typeof window.supabase === 'undefined') {
        console.warn('[RDP] Supabase CDN no cargado. Asegúrate de incluir el script CDN antes de supabase-client.js');
        return null;
      }
      _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storageKey: 'rdp_auth_token'
        }
      });
    }
    return _client;
  }

  // ── Autenticación ────────────────────────────────────────────

  async function signUp(email, password, metaData = {}) {
    const client = getClient();
    if (!client) return { data: null, error: { message: 'Supabase no configurado' } };
    return client.auth.signUp({ email, password, options: { data: metaData } });
  }

  async function signIn(email, password) {
    const client = getClient();
    if (!client) return { data: null, error: { message: 'Supabase no configurado' } };
    return client.auth.signInWithPassword({ email, password });
  }

  async function signInWithGoogle(redirectTo) {
    const client = getClient();
    if (!client) return { data: null, error: { message: 'Supabase no configurado' } };
    return client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || window.location.origin + '/login.html',
        queryParams: { access_type: 'offline', prompt: 'consent' }
      }
    });
  }

  async function signOut() {
    const client = getClient();
    if (!client) return;
    await client.auth.signOut();
  }

  async function getSession() {
    const client = getClient();
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data?.session ?? null;
  }

  async function getUser() {
    const session = await getSession();
    return session?.user ?? null;
  }

  function onAuthChange(callback) {
    const client = getClient();
    if (!client) return () => {};
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return () => subscription.unsubscribe();
  }

  // ── Perfil ───────────────────────────────────────────────────

  async function getProfile(userId) {
    const client = getClient();
    if (!client) return { data: null, error: null };
    return client.from('profiles').select('*').eq('id', userId).single();
  }

  async function updateProfile(userId, updates) {
    const client = getClient();
    if (!client) return { data: null, error: { message: 'Supabase no configurado' } };
    return client.from('profiles').update(updates).eq('id', userId).select().single();
  }

  // ── Parqueos ─────────────────────────────────────────────────

  async function getParkings(filters = {}) {
    const client = getClient();
    if (!client) return { data: [], error: null };
    let query = client
      .from('parkings_with_host')
      .select('*')
      .eq('estado', 'activo')
      .is('deleted_at', null);

    if (filters.busqueda) {
      query = query.ilike('nombre', `%${filters.busqueda}%`);
    }
    if (filters.precio_max) {
      query = query.lte('precio_hora', filters.precio_max);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    query = query.order('is_featured', { ascending: false }).order('calificacion_promedio', { ascending: false });
    return query;
  }

  async function getParkingById(id) {
    const client = getClient();
    if (!client) return { data: null, error: null };
    return client.from('parkings_with_host').select('*').eq('id', id).single();
  }

  async function createParking(data) {
    const client = getClient();
    if (!client) return { data: null, error: { message: 'Supabase no configurado' } };
    return client.from('parkings').insert(data).select().single();
  }

  async function updateParking(id, updates) {
    const client = getClient();
    if (!client) return { data: null, error: { message: 'Supabase no configurado' } };
    return client.from('parkings').update(updates).eq('id', id).select().single();
  }

  // ── Reservas ─────────────────────────────────────────────────

  async function createReservation(data) {
    const client = getClient();
    if (!client) return { data: null, error: { message: 'Supabase no configurado' } };
    return client.from('reservations').insert(data).select().single();
  }

  async function getUserReservations(userId) {
    const client = getClient();
    if (!client) return { data: [], error: null };
    return client
      .from('reservations')
      .select('*, parkings(nombre, direccion, lat, lng)')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false });
  }

  async function getHostReservations(hostId) {
    const client = getClient();
    if (!client) return { data: [], error: null };
    return client
      .from('reservations')
      .select('*, parkings!inner(nombre, anfitrion_id), profiles(nombre, telefono)')
      .eq('parkings.anfitrion_id', hostId)
      .order('created_at', { ascending: false });
  }

  async function updateReservationStatus(id, estado, extra = {}) {
    const client = getClient();
    if (!client) return { data: null, error: { message: 'Supabase no configurado' } };
    return client.from('reservations').update({ estado, ...extra }).eq('id', id).select().single();
  }

  // ── Reseñas ──────────────────────────────────────────────────

  async function getParkingRatings(parkingId) {
    const client = getClient();
    if (!client) return { data: [], error: null };
    return client
      .from('ratings')
      .select('*, profiles(nombre, foto_url)')
      .eq('parking_id', parkingId)
      .eq('aprobado', true)
      .order('created_at', { ascending: false });
  }

  async function createRating(data) {
    const client = getClient();
    if (!client) return { data: null, error: { message: 'Supabase no configurado' } };
    return client.from('ratings').insert(data).select().single();
  }

  // ── Mensajes ─────────────────────────────────────────────────

  async function getConversations(userId) {
    const client = getClient();
    if (!client) return { data: [], error: null };
    return client
      .from('messages')
      .select('*, sender:profiles!sender_id(nombre, foto_url), receiver:profiles!receiver_id(nombre, foto_url)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
  }

  async function sendMessage(data) {
    const client = getClient();
    if (!client) return { data: null, error: { message: 'Supabase no configurado' } };
    return client.from('messages').insert(data).select().single();
  }

  // ── Notificaciones ───────────────────────────────────────────

  async function getNotifications(userId) {
    const client = getClient();
    if (!client) return { data: [], error: null };
    return client
      .from('notifications')
      .select('*')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
  }

  async function markNotificationRead(id) {
    const client = getClient();
    if (!client) return;
    await client.from('notifications').update({ leido: true }).eq('id', id);
  }

  // ── Suscripciones realtime ───────────────────────────────────

  function subscribeToNotifications(userId, callback) {
    const client = getClient();
    if (!client) return () => {};
    const channel = client
      .channel(`notifications_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `usuario_id=eq.${userId}`
      }, payload => callback(payload.new))
      .subscribe();
    return () => client.removeChannel(channel);
  }

  function subscribeToMessages(userId, callback) {
    const client = getClient();
    if (!client) return () => {};
    const channel = client
      .channel(`messages_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`
      }, payload => callback(payload.new))
      .subscribe();
    return () => client.removeChannel(channel);
  }

  // ── Exponer API global ────────────────────────────────────────
  window.rdpSupabase = {
    isConfigured,
    getClient,
    // Auth
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    getSession,
    getUser,
    onAuthChange,
    // Profile
    getProfile,
    updateProfile,
    // Parkings
    getParkings,
    getParkingById,
    createParking,
    updateParking,
    // Reservaciones
    createReservation,
    getUserReservations,
    getHostReservations,
    updateReservationStatus,
    // Reseñas
    getParkingRatings,
    createRating,
    // Mensajes
    getConversations,
    sendMessage,
    // Notificaciones
    getNotifications,
    markNotificationRead,
    subscribeToNotifications,
    subscribeToMessages
  };

  if (!isConfigured) {
    console.info('[RDP] Supabase en modo demo (sin credenciales). Los datos provienen del servidor local.');
  }
})();
