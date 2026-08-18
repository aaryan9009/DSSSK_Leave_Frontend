
import axios from 'axios';
import { getItem, setItem } from './storage.js';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
});

// Automatically attach JWT token. Reads from persistent (native) storage —
// axios awaits a Promise returned from a request interceptor, so this stays
// async-safe even though it used to be a synchronous localStorage read.
API.interceptors.request.use(async (config) => {
  const token = await getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

async function saveToken(token) {
  if (token) await setItem('token', token);
}

// Leave policy — mirrors DATTA26.LEAVEMASTER (I_SRNO 1=PL, 2=SL, 3=CL).
// `annual` is only a fallback for display before the real balances
// (DATTA26.LEAVEBAL: N_OB + N_CREDIT - N_CONSUMED - N_ENCASH) load in.
export const LEAVE_POLICY = {
  personal: {
    label: 'Privilege Leave',
    code: 'PL',
    annual: 0,
    color: '#2F6E52',
  },
  sick: {
    label: 'Sick Leave',
    code: 'SL',
    annual: 0,
    color: '#B5402F',
  },
  casual: {
    label: 'Casual Leave',
    code: 'CL',
    annual: 0,
    color: '#B7861A',
  },
};

export async function changeHodPassword(
  currentPassword,
  newPassword
) {
  try {
    const res = await API.post(
      '/auth/hod/change-password',
      {
        currentPassword,
        newPassword,
      }
    );

    return res.data;
  } catch (err) {
    return {
      ok: false,
      error:
        err.response?.data?.error ||
        'Password change failed.',
    };
  }
}

export async function changeMdPassword(
  currentPassword,
  newPassword
) {
  try {
    const res = await API.post(
      '/auth/md/change-password',
      {
        currentPassword,
        newPassword,
      }
    );

    return res.data;
  } catch (err) {
    return {
      ok: false,
      error:
        err.response?.data?.error ||
        'Password change failed.',
    };
  }
}

export async function resetMdPassword(mdId) {
  try {
    const res = await API.post(
      '/auth/admin/reset-md-password',
      { mdId }
    );

    return res.data;
  } catch (err) {
    return {
      ok: false,
      error:
        err.response?.data?.error ||
        'Reset failed.',
    };
  }
}

export async function getMdList() {
  try {
    const res = await API.get('/auth/admin/md-list');
    return res.data;
  } catch (err) {
    return { ok: false, error: err.response?.data?.error || 'Could not load MD list.', mds: [] };
  }
}

export async function setMdDesignation(empId, isMd = true) {
  try {
    const res = await API.post('/auth/admin/set-md', { empId, isMd });
    return res.data;
  } catch (err) {
    return {
      ok: false,
      error: err.response?.data?.error || 'Could not update MD designation.',
    };
  }
}

export async function resetEmployeePassword(empId) {
  try {
    const res = await API.post(
      '/auth/admin/reset-password',
      { empId }
    );

    return res.data;
  } catch (err) {
    return {
      ok: false,
      error:
        err.response?.data?.error ||
        'Reset failed.',
    };
  }
}

export async function resetHodPassword(hodId) {
  try {
    const res = await API.post(
      '/auth/admin/reset-hod-password',
      { hodId }
    );

    return res.data;
  } catch (err) {
    return {
      ok: false,
      error:
        err.response?.data?.error ||
        'Reset failed.',
    };
  }
}
// ==========================
// AUTH
// ==========================

export async function findUserById(userId) {
  try {
    const res = await API.post('/auth/user/lookup', {
      userId,
    });

    return res.data;
  } catch (err) {
    console.error(err);
    return null;
  }
}

// export async function loginUser(userId, password) {
//   try {
//     const res = await API.post('/auth/login', {
//       userId,
//       password,
//     });

//     if (res.data.token) {
//       await saveToken(res.data.token);
//     }

//     return res.data;
//   } catch (err) {
//     return {
//       ok: false,
//       error:
//         err.response?.data?.error ||
//         'Login failed.',
//     };
//   }
// }
export async function loginUser(userId, password) {
  try {
    const res = await API.post('/auth/login', {
      userId,
      password,
    });

    if (res.data.token) {
      await saveToken(res.data.token);
    }

    return res.data;
  } catch (err) {
    console.error('LOGIN ERROR:', err);

    return {
      ok: false,
      error:
        err.response?.data?.error ||
        'Login failed.',
    };
  }
}
export async function findEmployeeById(empId) {
  try {
    const res = await API.post('/auth/employee/lookup', { empId });
    return res.data;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function loginEmployee(empId, password) {
  try {
    const res = await API.post('/auth/employee/login', {
      empId,
      password,
    });

    if (res.data.token) {
      await saveToken(res.data.token);
    }

    return res.data;
  } catch (err) {
    return {
      ok: false,
      error:
        err.response?.data?.error ||
        'Employee login failed.',
    };
  }
}

export async function loginHod(hodId, password) {
  try {
    const res = await API.post('/auth/hod/login', {
      hodId,
      password,
    });

    if (res.data.token) {
      await saveToken(res.data.token);
    }

    return res.data;
  } catch (err) {
    return {
      ok: false,
      error:
        err.response?.data?.error ||
        'HOD login failed.',
    };
  }
}

export async function loginMd(mdId, password) {
  try {
    const res = await API.post('/auth/md/login', {
      mdId,
      password,
    });

    if (res.data.token) {
      await saveToken(res.data.token);
    }

    return res.data;
  } catch (err) {
    return {
      ok: false,
      error:
        err.response?.data?.error ||
        'MD login failed.',
    };
  }
}

export async function loginAdmin(username, password) {
  try {
    const res = await API.post('/auth/admin/login', {
      username,
      password,
    });

    if (res.data.token) {
      await saveToken(res.data.token);
    }

    return res.data;
  } catch (err) {
    return {
      ok: false,
      error:
        err.response?.data?.error ||
        'Admin login failed.',
    };
  }
}

export async function changeEmployeePassword(
  empId,
  currentPassword,
  newPassword
) {
  try {
    const res = await API.post(
      '/auth/employee/change-password',
      {
        currentPassword,
        newPassword,
      }
    );

    return res.data;
  } catch (err) {
    return {
      ok: false,
      error:
        err.response?.data?.error ||
        'Password change failed.',
    };
  }
}

// ==========================
// EMPLOYEE DASHBOARD
// ==========================

export async function getLeaveBalances(empId) {
  try {
    const res = await API.get(
      `/employees/${empId}/leave-balances`
    );

    return res.data;
  } catch (err) {
    console.error(err);
    return {};
  }
}

export async function getMyLeaveRequests(empId) {
  try {
    const res = await API.get(
      `/employees/${empId}/leave-requests`
    );

    return res.data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function applyForLeave(payload) {
  try {
    const res = await API.post(
      '/leave-requests',
      payload
    );

    return res.data;
  } catch (err) {
    return {
      ok: false,
      error:
        err.response?.data?.error ||
        'Could not submit leave request.',
    };
  }
}

export async function cancelMyLeaveRequest(
  requestId,
  empId
) {
  try {
    const res = await API.patch(
      `/leave-requests/${requestId}/withdraw`
    );

    return res.data;
  } catch (err) {
    return {
      ok: false,
      error:
        err.response?.data?.error ||
        'Could not withdraw leave request.',
    };
  }
}

// ==========================
// ADMIN DASHBOARD
// ==========================

export async function getAllLeaveRequests() {
  try {
    const res = await API.get(
      '/admin/leave-requests'
    );

    return res.data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function actionLeaveRequest(
  requestId,
  action,
  adminUsername,
  remarks = ''
) {
  try {
    const res = await API.patch(
      `/admin/leave-requests/${requestId}`,
      {
        action,
        remarks,
      }
    );

    return res.data;
  } catch (err) {
    return {
      ok: false,
      error:
        err.response?.data?.error ||
        'Could not update request.',
    };
  }
}

export async function getLeavesForDate(dateStr) {
  try {
    const res = await API.get(
      '/admin/leave-requests/by-date',
      {
        params: {
          date: dateStr,
        },
      }
    );

    return res.data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function getAllEmployeesSummary() {
  try {
    const res = await API.get(
      '/admin/employees/summary'
    );

    return res.data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

// ==========================
// HOD DASHBOARD (department-scoped leave approval)
// ==========================

export async function getHodLeaveRequests() {
  try {
    const res = await API.get('/hod/leave-requests');
    return res.data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function hodActionLeaveRequest(requestId, action, remarks = '') {
  try {
    const res = await API.patch(`/hod/leave-requests/${requestId}`, {
      action,
      remarks,
    });
    return res.data;
  } catch (err) {
    return {
      ok: false,
      error:
        err.response?.data?.error ||
        'Could not update request.',
    };
  }
}

export async function getHodLeavesForDate(dateStr) {
  try {
    const res = await API.get('/hod/leave-requests/by-date', {
      params: { date: dateStr },
    });
    return res.data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function getHodEmployeesSummary() {
  try {
    const res = await API.get('/hod/employees/summary');
    return res.data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

// ==========================
// MD DASHBOARD (approves HOD leave requests, plus the MD's own)
// ==========================

export async function getMdLeaveRequests() {
  try {
    const res = await API.get('/md/leave-requests');
    return res.data;
  } catch (err) {
    // Deliberately re-thrown (unlike most other GET helpers here) so
    // MdDashboard.jsx can tell "no requests yet" apart from "the request
    // failed" and show a real error instead of a silent empty dashboard.
    console.error(err);
    throw err;
  }
}

export async function mdActionLeaveRequest(requestId, action, remarks = '') {
  try {
    const res = await API.patch(`/md/leave-requests/${requestId}`, {
      action,
      remarks,
    });
    return res.data;
  } catch (err) {
    return {
      ok: false,
      error:
        err.response?.data?.error ||
        'Could not update request.',
    };
  }
}

export async function getMdLeavesForDate(dateStr) {
  try {
    const res = await API.get('/md/leave-requests/by-date', {
      params: { date: dateStr },
    });
    return res.data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function getMdHodsSummary() {
  try {
    const res = await API.get('/md/employees/summary');
    return res.data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

export default API;