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

export const createUser = (user: Omit<User, "id">): Promise<string> => {
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

    const message = await response.json();
    return message;
  } catch (erorr) {
    console.error("Error createing user : ", erorr);
    throw error;
  }
};
