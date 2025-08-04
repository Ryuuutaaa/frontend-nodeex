import React, { useEffect, useState } from "react";
import { getAllUseres } from "../services/userServices";

interface User {
  id: string;
  firstsname: string;
  lastname: string;
  age: number;
}

interface newUser {
  firstsname: string;
  lastname: string;
  age: number;
}

const UserPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<newUser>({
    firstsname: "",
    lastname: "",
    age: 0,
  });

  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUseres();
        setUsers(data);
      } catch (err) {
        setError(
          err.message || "Terjadi kesalahan saat mengambil data pengguna."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handlerNewUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: name === "age" ? parseInt(value) || 0 : value,
    }));
  };

  return <div>UserPage</div>;
};

export default UserPage;
