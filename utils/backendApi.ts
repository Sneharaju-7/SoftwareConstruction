const BACKEND_URL = 'http://localhost:3000';

export type UserProfilePayload = {
  username: string;
  phone: string;
  profilePicture?: string;
  currentPhoneNumber?: string;
};

export type BackendUser = {
  id: string;
  username: string;
  phoneNumber: string;
  profilePicture: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type BackendAlert = {
  id: string;
  title: string;
  type: string;
  time: string;
  userPhoneNumber: string;
  scheduleKind: 'daily' | 'one_time';
  status: 'scheduled' | 'completed';
  nextTriggerAt: string | null;
  lastTriggeredAt: string | null;
  completedAt: string | null;
  whatsappLink: string;
  message: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type BackendContact = {
  id: string;
  name: string;
  phone: string;
  relation: string;
  userPhoneNumber: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type ApiResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

async function parseUserResponse(response: Response): Promise<ApiResult<BackendUser>> {
  const data = await readJson<{ success: boolean; user?: BackendUser; error?: string }>(response);

  if (!response.ok || !data.success || !data.user) {
    return { ok: false, error: data.error || 'User request failed.' };
  }

  return { ok: true, data: data.user };
}

export async function signupBackendUser(profile: UserProfilePayload): Promise<ApiResult<BackendUser>> {
  try {
    const response = await fetch(`${BACKEND_URL}/users/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: profile.username,
        phoneNumber: profile.phone,
        profilePicture: profile.profilePicture || '',
      }),
    });

    return parseUserResponse(response);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not connect to the backend.',
    };
  }
}

export async function loginBackendUser(profile: {
  username: string;
  phone: string;
}): Promise<ApiResult<BackendUser>> {
  try {
    const response = await fetch(`${BACKEND_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: profile.username,
        phoneNumber: profile.phone,
      }),
    });

    return parseUserResponse(response);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not connect to the backend.',
    };
  }
}

export async function updateBackendUserProfile(
  profile: UserProfilePayload
): Promise<ApiResult<BackendUser>> {
  try {
    const response = await fetch(`${BACKEND_URL}/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPhoneNumber: profile.currentPhoneNumber,
        username: profile.username,
        phoneNumber: profile.phone,
        profilePicture: profile.profilePicture || '',
      }),
    });

    return parseUserResponse(response);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not connect to the backend.',
    };
  }
}

export async function fetchBackendAlerts(phone: string): Promise<ApiResult<BackendAlert[]>> {
  try {
    const response = await fetch(`${BACKEND_URL}/alerts?phoneNumber=${encodeURIComponent(phone)}`);
    const data = await readJson<{ success: boolean; alerts?: BackendAlert[]; error?: string }>(response);

    if (!response.ok || !data.success || !data.alerts) {
      return { ok: false, error: data.error || 'Could not load alerts from MongoDB.' };
    }

    return { ok: true, data: data.alerts };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not connect to the backend.',
    };
  }
}

export async function createBackendAlert(payload: {
  title: string;
  type: string;
  time: string;
  userPhoneNumber: string;
}): Promise<ApiResult<BackendAlert>> {
  try {
    const response = await fetch(`${BACKEND_URL}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await readJson<{ success: boolean; alert?: BackendAlert; error?: string }>(response);

    if (!response.ok || !data.success || !data.alert) {
      return { ok: false, error: data.error || 'Could not create the alert.' };
    }

    return { ok: true, data: data.alert };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not connect to the backend.',
    };
  }
}

export async function deleteBackendAlert(alertId: string, phone: string): Promise<ApiResult<true>> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/alerts/${encodeURIComponent(alertId)}?phoneNumber=${encodeURIComponent(phone)}`,
      { method: 'DELETE' }
    );
    const data = await readJson<{ success: boolean; error?: string }>(response);

    if (!response.ok || !data.success) {
      return { ok: false, error: data.error || 'Could not delete the alert.' };
    }

    return { ok: true, data: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not connect to the backend.',
    };
  }
}

export async function fetchBackendContacts(phone: string): Promise<ApiResult<BackendContact[]>> {
  try {
    const response = await fetch(`${BACKEND_URL}/contacts?phoneNumber=${encodeURIComponent(phone)}`);
    const data = await readJson<{ success: boolean; contacts?: BackendContact[]; error?: string }>(response);

    if (!response.ok || !data.success || !data.contacts) {
      return { ok: false, error: data.error || 'Could not load contacts from MongoDB.' };
    }

    return { ok: true, data: data.contacts };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not connect to the backend.',
    };
  }
}

export async function createBackendContact(payload: {
  userPhoneNumber: string;
  name: string;
  phone: string;
  relation: string;
}): Promise<ApiResult<BackendContact>> {
  try {
    const response = await fetch(`${BACKEND_URL}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await readJson<{ success: boolean; contact?: BackendContact; error?: string }>(response);

    if (!response.ok || !data.success || !data.contact) {
      return { ok: false, error: data.error || 'Could not create the contact.' };
    }

    return { ok: true, data: data.contact };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not connect to the backend.',
    };
  }
}

export async function deleteBackendContact(contactId: string, phone: string): Promise<ApiResult<true>> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/contacts/${encodeURIComponent(contactId)}?phoneNumber=${encodeURIComponent(phone)}`,
      { method: 'DELETE' }
    );
    const data = await readJson<{ success: boolean; error?: string }>(response);

    if (!response.ok || !data.success) {
      return { ok: false, error: data.error || 'Could not delete the contact.' };
    }

    return { ok: true, data: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not connect to the backend.',
    };
  }
}
