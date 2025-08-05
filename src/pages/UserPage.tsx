import React, { useEffect, useState } from "react";
import {
  createUser,
  deleteUserById,
  getAllUseres,
} from "../services/userServices";

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.firstsname || !newUser.lastname || newUser.age <= 0) {
      return alert("Mohono melengkapidata pengguna dengan benaar");
    }

    try {
      setLoading(true);
      const message = await createUser(newUser);
      alert(message);

      const updateUsers = await getAllUseres();
      setUsers(updateUsers);
      setNewUser({ firstsname: "", lastname: "", age: 0 });
      setError(null);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat menambahkan pengguna.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm("Apakah anda yakin ingin menghapus pengguna ini ?")) {
      try {
        setLoading(true);
        const message = await deleteUserById(id);
        alert(message);

        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
        setError(null);
      } catch (err) {
        setError(err.message || "Terjadi kesalahan saat menghapus pengguna.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser({ ...user });
  };

  const handleEditingUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setEditingUser((prev) =>
      prev
        ? {
            ...prev,
            [name]: name === "age" ? parseInt(value) || 0 : value,
          }
        : null
    );
  };

  const hanldeUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !editingUser ||
      !editingUser.id ||
      !editingUser.firstsname ||
      !editingUser.lastname ||
      !editingUser.age <= 0
    ) {
      return alert("Mohone mengelengkapi data pengguna dengan benar");
    }
    try {
      setLoading(true);
    } catch (err) {
      setError(err.message || "Gagal memperbarui data");
    } finally {
      setLoading(false);
    }
  };

  const handleCancalEdit = () => {
    setEditingUser(null);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        Memuat data pengguna...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: "red", textAlign: "center", padding: "20px" }}>
        Error: {error}
      </div>
    );
  }
  return <div>UserPage</div>;
};

export default UserPage;
