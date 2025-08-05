// services/userServices.ts - Properly Typed Version

const API_BASE_URL = "http://localhost:5000";

if (!API_BASE_URL) {
  throw new Error("ENVIRONMENT VARIABLE VITE_API_BASE_URL IS NOT SET.");
}

// ✅ Proper interface definitions
export interface User {
  id?: string;
  firstname: string;
  lastname: string;
  age: number;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface ApiSuccessResponse {
  message: string;
  data?: unknown;
}

// ✅ Type guards
const isApiError = (obj: unknown): obj is ApiError => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "message" in obj &&
    typeof (obj as ApiError).message === "string"
  );
};

const isUser = (obj: unknown): obj is User => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "firstname" in obj &&
    "lastname" in obj &&
    "age" in obj &&
    typeof (obj as User).firstname === "string" &&
    typeof (obj as User).lastname === "string" &&
    typeof (obj as User).age === "number"
  );
};

// ✅ Enhanced error handling function
const handleApiError = (error: unknown, context: string): Error => {
  console.error(`Error in ${context}:`, error);

  // Handle Error instances
  if (error instanceof Error) {
    return error;
  }

  // Handle API error objects
  if (isApiError(error)) {
    return new Error(error.message);
  }

  // Handle Response objects
  if (error instanceof Response) {
    return new Error(`HTTP ${error.status}: ${error.statusText}`);
  }

  // Handle network errors
  if (typeof error === "object" && error !== null && "code" in error) {
    const networkError = error as { code: string; message?: string };
    if (
      networkError.code === "NETWORK_ERROR" ||
      networkError.code === "ECONNREFUSED"
    ) {
      return new Error(
        "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
      );
    }
  }

  // Handle fetch errors
  if (typeof error === "string") {
    if (error.includes("Failed to fetch")) {
      return new Error(
        "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
      );
    }
    return new Error(error);
  }

  // Fallback for unknown errors
  return new Error("Terjadi kesalahan tak terduga");
};

// ✅ Generic API call function with proper typing
const apiCall = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData: unknown = await response.json();
        if (isApiError(errorData)) {
          errorMessage = errorData.message;
        }
      } catch (jsonError) {
        console.warn("Could not parse error response as JSON:", jsonError);
      }

      throw new Error(errorMessage);
    }

    // Check content type
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      // For text responses (like success messages)
      const text = await response.text();
      return text as T;
    }

    const data: unknown = await response.json();
    return data as T;
  } catch (error) {
    throw handleApiError(error, `API call to ${url}`);
  }
};

// ✅ Properly typed service functions
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const data = await apiCall<unknown>(API_BASE_URL);

    // Validate response data
    if (!Array.isArray(data)) {
      throw new Error("Invalid response format: Expected array of users");
    }

    // Validate each user object
    const users = data.filter(isUser);

    if (users.length !== data.length) {
      console.warn("Some users were filtered out due to invalid format");
    }

    return users;
  } catch (error) {
    throw handleApiError(error, "getAllUsers");
  }
};

export const createUser = async (user: Omit<User, "id">): Promise<string> => {
  try {
    // Input validation
    if (!user.firstname?.trim()) {
      throw new Error("Nama depan tidak boleh kosong");
    }
    if (!user.lastname?.trim()) {
      throw new Error("Nama belakang tidak boleh kosong");
    }
    if (!user.age || user.age <= 0) {
      throw new Error("Usia harus lebih dari 0");
    }

    const cleanUser: Omit<User, "id"> = {
      firstname: user.firstname.trim(),
      lastname: user.lastname.trim(),
      age: Number(user.age),
    };

    const message = await apiCall<string>(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cleanUser),
    });

    return message;
  } catch (error) {
    throw handleApiError(error, "createUser");
  }
};

export const getUserById = async (id: string): Promise<User> => {
  try {
    if (!id?.trim()) {
      throw new Error("ID pengguna tidak valid");
    }

    const data = await apiCall<unknown>(
      `${API_BASE_URL}/${encodeURIComponent(id)}`
    );

    if (!isUser(data)) {
      throw new Error("Invalid user data received from server");
    }

    return data;
  } catch (error) {
    throw handleApiError(error, "getUserById");
  }
};

export const updateUserById = async (
  id: string,
  updates: Partial<Omit<User, "id">>
): Promise<string> => {
  try {
    if (!id?.trim()) {
      throw new Error("ID pengguna tidak valid");
    }

    // Validate and clean updates
    const cleanUpdates: Partial<Omit<User, "id">> = {};

    if (updates.firstname !== undefined) {
      const firstName = updates.firstname.trim();
      if (!firstName) {
        throw new Error("Nama depan tidak boleh kosong");
      }
      cleanUpdates.firstname = firstName;
    }

    if (updates.lastname !== undefined) {
      const lastName = updates.lastname.trim();
      if (!lastName) {
        throw new Error("Nama belakang tidak boleh kosong");
      }
      cleanUpdates.lastname = lastName;
    }

    if (updates.age !== undefined) {
      const age = Number(updates.age);
      if (age <= 0) {
        throw new Error("Usia harus lebih dari 0");
      }
      cleanUpdates.age = age;
    }

    const message = await apiCall<string>(
      `${API_BASE_URL}/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanUpdates),
      }
    );

    return message;
  } catch (error) {
    throw handleApiError(error, "updateUserById");
  }
};

export const deleteUserById = async (id: string): Promise<string> => {
  try {
    if (!id?.trim()) {
      throw new Error("ID pengguna tidak valid");
    }

    const message = await apiCall<string>(
      `${API_BASE_URL}/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      }
    );

    return message;
  } catch (error) {
    throw handleApiError(error, "deleteUserById");
  }
};
