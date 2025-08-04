const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error("ENVIROMENT VARIABEL IS NOT SET.");
}

interface User {
  id?: string;
  firstname: string;
  lastname: string;
  age: number;
}

export const getAllUseres = async (): Promise<User[]> => {
  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Gagal mengambil data pengguna");
    }
    const data: User[] = await response.json();
    return data;
  } catch (error) {
    console.error("Eerorr fetchingg all users : ", error);
    throw error;
  }
};

export const createUser = async (user: Omit<User, "id">): Promise<string> => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Gagal menambahkan pengguna");
    }
    const message = await response.text();
    return message;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const getUserById = async (id: string): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Gagal mengambil data pengguna");
    }

    const data: User = await response.json();
    return data;
  } catch (error) {
    console.error("Error get user by id", error);
    throw error;
  }
};

export const updateUserById = async (
  id: string,
  updates: Partial<Omit<User, "id">>
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Gagal memperbarui data pengguna");
    }

    const message = await response.text();
    return message;
  } catch (error) {
    console.error("Error update user by id", error);
    throw error;
  }
};

export const deleteUserById = async (id: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Gagal menghapus data pengguna");
    }

    const message = await response.text();
    return message;
  } catch (error) {
    console.error("Error delete user by id", error);
    throw error;
  }
};
