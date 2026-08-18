// // ============================================================================
// // Push notification registration (Capacitor + Firebase Cloud Messaging).
// //
// // Only ever called for EMPLOYEE / HOD sessions — never ADMIN (see
// // initPushNotifications call sites: App.jsx checks the role before calling
// // this at all, so no admin device token is ever registered).
// // ============================================================================
// import { Capacitor } from '@capacitor/core';
// import { PushNotifications } from '@capacitor/push-notifications';
// import API from './api.js';
// import { getItem, setItem, removeItem } from './storage.js';

// const LAST_TOKEN_KEY = 'fcm_token';

// async function registerTokenWithBackend(token) {
//   try {
//     await API.post('/notifications/register-token', {
//       token,
//       platform: Capacitor.getPlatform(),
//     });
//     await setItem(LAST_TOKEN_KEY, token);
//   } catch (e) {
//     console.error('[push] failed to register token with backend:', e.message);
//   }
// }

// // Call once, after a successful EMPLOYEE/HOD login (and again on app start
// // if already logged in) — requests notification permission and starts
// // listening for the FCM token + incoming pushes. Safe to call more than
// // once; Capacitor no-ops duplicate listener registration internally is not
// // guaranteed, so callers should still only call this once per app session
// // (handled in App.jsx).
// export async function initPushNotifications() {
//   // Push notifications only work on native (Android/iOS) builds, not in a
//   // plain browser tab — skip entirely on web so `vite dev` isn't broken by
//   // a missing native plugin.
//   if (!Capacitor.isNativePlatform()) return;

//   let permStatus = await PushNotifications.checkPermissions();
//   if (permStatus.receive === 'prompt') {
//     permStatus = await PushNotifications.requestPermissions();
//   }
//   if (permStatus.receive !== 'granted') {
//     console.warn('[push] notification permission not granted');
//     return;
//   }

//   await PushNotifications.register();

//   PushNotifications.addListener('registration', (token) => {
//     registerTokenWithBackend(token.value);
//   });

//   PushNotifications.addListener('registrationError', (err) => {
//     console.error('[push] registration error:', err.error);
//   });

//   // Foreground push received while the app is open — the OS already shows
//   // nothing in this case on Android, so surface it (a toast/banner can be
//   // wired up here later if the app gets one; for now this at least logs it
//   // for debugging).
//   PushNotifications.addListener('pushNotificationReceived', (notification) => {
//     console.log('[push] received in foreground:', notification);
//   });

//   // Person tapped a notification (app was backgrounded/closed).
//   PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
//     console.log('[push] tapped:', action.notification);
//   });
// }

// // Call on explicit logout so this device stops receiving pushes for the
// // account that just signed out.
// export async function unregisterPushNotifications() {
//   if (!Capacitor.isNativePlatform()) return;
//   try {
//     const token = await getItem(LAST_TOKEN_KEY);
//     if (token) {
//       await API.post('/notifications/unregister-token', { token });
//       await removeItem(LAST_TOKEN_KEY);
//     }
//     await PushNotifications.removeAllListeners();
//   } catch (e) {
//     console.error('[push] failed to unregister token:', e.message);
//   }
// }


import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import API from './api.js';
import { getItem } from './storage.js';

const SESSION_KEY = 'dssk_leave_session';
const LAST_TOKEN_KEY = 'fcm_token';

let listenersRegistered = false;

async function getCurrentSession() {
  try {
    const raw = await getItem(SESSION_KEY);

    if (!raw) {
      console.warn('[push] No saved session found');
      return null;
    }

    const session =
      typeof raw === 'string'
        ? JSON.parse(raw)
        : raw;

    console.log('[push] current session:', session);

    return session;
  } catch (error) {
    console.error('[push] failed to read session:', error);
    return null;
  }
}

async function registerTokenWithBackend(fcmToken) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      console.warn('[push] Cannot register token - no session');
      return;
    }

    // IMPORTANT:
    // AuthContext stores role at session.role, NOT session.user.role
    const userRole = String(session.role || '').toUpperCase();

    const user = session.user || {};

    // Employee / HOD ID
    const userId =
      user.empId ||
      user.employeeId ||
      user.hodId ||
      user.userId ||
      user.id;

    console.log('[push] USER ID:', userId);
    console.log('[push] USER ROLE:', userRole);
    console.log('[push] TOKEN LENGTH:', fcmToken?.length);

    // Admin should never receive push notifications
    if (userRole === 'ADMIN') {
      console.log('[push] ADMIN - push registration skipped');
      return;
    }

    if (!userId) {
      console.error('[push] USER ID missing');
      return;
    }

    if (!userRole) {
      console.error('[push] USER ROLE missing');
      return;
    }

    if (!fcmToken) {
      console.error('[push] FCM TOKEN missing');
      return;
    }

    const response = await API.post(
      '/notifications/register-token',
      {
        userId: String(userId),
        userRole: userRole,
        fcmToken: String(fcmToken),
        platform: 'android',
      }
    );

    console.log(
      '[push] TOKEN REGISTERED SUCCESSFULLY:',
      response?.data || response
    );

    // Save only after successful backend registration
    localStorage.setItem(
      LAST_TOKEN_KEY,
      String(fcmToken)
    );

  } catch (error) {
    console.error(
      '[push] TOKEN REGISTRATION FAILED:',
      error?.response?.data || error?.message || error
    );
  }
}

export async function initPushNotifications() {
  try {
    // Only Android/iOS
    if (!Capacitor.isNativePlatform()) {
      console.log('[push] Not running on native platform');
      return;
    }

    console.log('[push] Initializing push notifications...');

    // Prevent duplicate listeners
    if (listenersRegistered) {
      console.log('[push] Listeners already registered');
      return;
    }

    let permStatus =
      await PushNotifications.checkPermissions();

    console.log(
      '[push] Current permission:',
      permStatus.receive
    );

    if (permStatus.receive !== 'granted') {
      permStatus =
        await PushNotifications.requestPermissions();
    }

    console.log(
      '[push] Permission after request:',
      permStatus.receive
    );

    if (permStatus.receive !== 'granted') {
      console.warn(
        '[push] Notification permission not granted'
      );
      return;
    }

    // --------------------------------------------------
    // FCM registration listener
    // --------------------------------------------------

    await PushNotifications.addListener(
      'registration',
      async (token) => {
        console.log(
          '[push] FCM REGISTRATION EVENT'
        );

        console.log(
          '[push] FCM TOKEN:',
          token.value
        );

        console.log(
          '[push] FCM TOKEN LENGTH:',
          token.value?.length
        );

        await registerTokenWithBackend(
          token.value
        );
      }
    );

    // --------------------------------------------------
    // Registration error
    // --------------------------------------------------

    await PushNotifications.addListener(
      'registrationError',
      (error) => {
        console.error(
          '[push] FCM REGISTRATION ERROR:',
          error
        );
      }
    );

    // --------------------------------------------------
    // Notification received while app is open
    // --------------------------------------------------

    await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        console.log(
          '===================================='
        );

        console.log(
          '[push] 🔔 NOTIFICATION RECEIVED'
        );

        console.log(
          '[push] Notification:',
          notification
        );

        console.log(
          '===================================='
        );
      }
    );

    // --------------------------------------------------
    // Notification tapped
    // --------------------------------------------------

    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action) => {
        console.log(
          '[push] 🔔 NOTIFICATION TAPPED:',
          action.notification
        );
      }
    );

    listenersRegistered = true;

    // IMPORTANT:
    // Listeners must be registered BEFORE this
    await PushNotifications.register();

    console.log(
      '[push] FCM registration requested'
    );

  } catch (error) {
    console.error(
      '[push] INITIALIZATION FAILED:',
      error
    );
  }
}

export async function unregisterPushNotifications() {
  try {
    const token = localStorage.getItem(LAST_TOKEN_KEY);

    if (token) {
      const sessionRaw = localStorage.getItem('dssk_leave_session');

      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);

        const user = session?.user;

        const userId =
          user?.empId ||
          user?.employeeId ||
          user?.hodId ||
          user?.id ||
          user?.userId;

        if (userId) {
          await API.post('/notifications/remove-token', {
            userId: String(userId),
            fcmToken: token,
          });

          console.log('[push] token removed');
        }
      }
    }

    localStorage.removeItem(LAST_TOKEN_KEY);

    await PushNotifications.removeAllListeners();

  } catch (error) {
    console.error(
      '[push] unregister failed:',
      error?.response?.data || error
    );
  }
}