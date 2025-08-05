import React, { useEffect, useState, useCallback } from "react";
import {
  createUser,
  deleteUserById,
  getAllUsers,
  updateUserById,
} from "../services/userServices";

import type { User } from "../services/userServices";

interface NewUser {
  firstname: string;
  lastname: string;
  age: number;
}

interface ErrorState {
  message: string;
  type: "error" | "warning" | "info";
}

const UserPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    firstname: "",
    lastname: "",
    age: 0,
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);

  // ✅ Enhanced error handling with proper typing
  const handleError = useCallback((err: unknown, operation: string) => {
    console.error(`Error in ${operation}:`, err);

    let errorMessage = "Terjadi kesalahan tak terduga";
    let errorType: "error" | "warning" | "info" = "error";

    if (err instanceof Error) {
      errorMessage = err.message;

      // Classify error types based on error message
      if (
        err.message.includes("koneksi") ||
        err.message.includes("network") ||
        err.message.includes("fetch")
      ) {
        errorType = "warning";
      } else if (
        err.message.includes("tidak ditemukan") ||
        err.message.includes("404")
      ) {
        errorType = "info";
      } else if (
        err.message.includes("kosong") ||
        err.message.includes("tidak valid")
      ) {
        errorType = "warning";
      }
    } else if (typeof err === "string") {
      errorMessage = err;
    } else if (typeof err === "object" && err !== null && "message" in err) {
      const errorObj = err as { message: string };
      if (typeof errorObj.message === "string") {
        errorMessage = errorObj.message;
      }
    }

    setError({ message: errorMessage, type: errorType });

    // Auto-clear error after 5 seconds for warnings and info
    if (errorType !== "error") {
      setTimeout(() => setError(null), 5000);
    }
  }, []);

  const fetchUsers = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        setError(null);

        const data = await getAllUsers();
        setUsers(data);

        if (data.length === 0) {
          setError({
            message: "Belum ada pengguna dalam database",
            type: "info",
          });
        }
      } catch (error: unknown) {
        handleError(error, "fetchUsers");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [handleError]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: name === "age" ? Math.max(0, parseInt(value) || 0) : value,
    }));
  };

  const validateUser = (user: NewUser | User): boolean => {
    if (!user.firstname?.trim()) {
      setError({ message: "Nama depan tidak boleh kosong", type: "warning" });
      return false;
    }
    if (!user.lastname?.trim()) {
      setError({
        message: "Nama belakang tidak boleh kosong",
        type: "warning",
      });
      return false;
    }
    if (!user.age || user.age <= 0) {
      setError({ message: "Usia harus lebih dari 0", type: "warning" });
      return false;
    }
    if (user.age > 150) {
      setError({
        message: "Usia tidak boleh lebih dari 150 tahun",
        type: "warning",
      });
      return false;
    }
    return true;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateUser(newUser)) return;

    try {
      setOperationLoading("create");
      setError(null);

      const message = await createUser(newUser);

      // Show success message
      setError({
        message: message || "Pengguna berhasil ditambahkan",
        type: "info",
      });

      // Refresh users list
      await fetchUsers(false);

      // Reset form
      setNewUser({ firstname: "", lastname: "", age: 0 });
    } catch (error: unknown) {
      handleError(error, "createUser");
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDeleteUser = async (id: string) => {
    const user = users.find((u) => u.id === id);
    const userName = user
      ? `${user.firstname} ${user.lastname}`
      : "pengguna ini";

    if (window.confirm(`Apakah Anda yakin ingin menghapus ${userName}?`)) {
      try {
        setOperationLoading(`delete-${id}`);
        setError(null);

        const message = await deleteUserById(id);

        // Show success message
        setError({
          message: message || "Pengguna berhasil dihapus",
          type: "info",
        });

        // Remove from local state immediately for better UX
        setUsers((prev) => prev.filter((user) => user.id !== id));

        // If we were editing this user, cancel edit
        if (editingUser?.id === id) {
          setEditingUser(null);
        }
      } catch (error: unknown) {
        handleError(error, "deleteUser");
        // Refresh users list in case of error to ensure consistency
        await fetchUsers(false);
      } finally {
        setOperationLoading(null);
      }
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser({ ...user });
    setError(null);
  };

  const handleEditingUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditingUser((prev) =>
      prev
        ? {
            ...prev,
            [name]: name === "age" ? Math.max(0, parseInt(value) || 0) : value,
          }
        : null
    );
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser || !validateUser(editingUser)) return;

    try {
      setOperationLoading(`update-${editingUser.id}`);
      setError(null);

      const message = await updateUserById(editingUser.id!, editingUser);

      // Show success message
      setError({
        message: message || "Pengguna berhasil diperbarui",
        type: "info",
      });

      // Update local state immediately for better UX
      setUsers((prev) =>
        prev.map((user) => (user.id === editingUser.id ? editingUser : user))
      );

      setEditingUser(null);
    } catch (error: unknown) {
      handleError(error, "updateUser");
      // Refresh users list in case of error to ensure consistency
      await fetchUsers(false);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setError(null);
  };

  const handleRetry = () => {
    setError(null);
    fetchUsers();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data pengguna...</p>
        </div>
      </div>
    );
  }

  // Error state with retry option
  if (error && error.type === "error" && users.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 mb-4">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Terjadi Kesalahan
          </h2>
          <p className="text-gray-600 mb-6">{error.message}</p>
          <button
            onClick={handleRetry}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans max-w-4xl mx-auto my-5 p-5 border border-gray-300 rounded-lg shadow-md">
      <h1 className="text-center text-3xl font-bold mb-6 text-gray-800">
        Manajemen Pengguna
      </h1>

      {/* Error/Success Alert */}
      {error && (
        <div
          className={`mb-6 p-4 rounded-md flex items-center justify-between ${
            error.type === "error"
              ? "bg-red-50 border border-red-200 text-red-800"
              : error.type === "warning"
              ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
              : "bg-blue-50 border border-blue-200 text-blue-800"
          }`}
        >
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {error.type === "error" ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              ) : error.type === "warning" ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              )}
            </svg>
            <span>{error.message}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Add New User Form */}
      <h2 className="text-2xl font-semibold border-b pb-2 mb-4 text-gray-700">
        Tambah Pengguna Baru
      </h2>
      <form
        onSubmit={handleCreateUser}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 p-4 border border-gray-200 rounded-md bg-gray-50"
      >
        <input
          type="text"
          name="firstname"
          placeholder="Nama Depan"
          value={newUser.firstname}
          onChange={handleNewUserChange}
          disabled={operationLoading === "create"}
          required
          className="p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
        />
        <input
          type="text"
          name="lastname"
          placeholder="Nama Belakang"
          value={newUser.lastname}
          onChange={handleNewUserChange}
          disabled={operationLoading === "create"}
          required
          className="p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
        />
        <input
          type="number"
          name="age"
          placeholder="Usia"
          min="1"
          max="150"
          value={newUser.age === 0 ? "" : newUser.age}
          onChange={handleNewUserChange}
          disabled={operationLoading === "create"}
          required
          className="p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={operationLoading === "create"}
          className="col-span-1 md:col-span-2 p-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {operationLoading === "create" ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Menambahkan...
            </>
          ) : (
            "Tambah Pengguna"
          )}
        </button>
      </form>

      {/* Edit User Form */}
      {editingUser && (
        <div className="mb-8 p-5 border border-yellow-300 rounded-lg bg-yellow-50">
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4 text-gray-700">
            Edit Pengguna: {editingUser.firstname} {editingUser.lastname}
          </h2>
          <form
            onSubmit={handleUpdateUser}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <input
              type="text"
              name="firstname"
              placeholder="Nama Depan"
              value={editingUser.firstname}
              onChange={handleEditingUserChange}
              disabled={operationLoading === `update-${editingUser.id}`}
              required
              className="p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
            />
            <input
              type="text"
              name="lastname"
              placeholder="Nama Belakang"
              value={editingUser.lastname}
              onChange={handleEditingUserChange}
              disabled={operationLoading === `update-${editingUser.id}`}
              required
              className="p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
            />
            <input
              type="number"
              name="age"
              placeholder="Usia"
              min="1"
              max="150"
              value={editingUser.age === 0 ? "" : editingUser.age}
              onChange={handleEditingUserChange}
              disabled={operationLoading === `update-${editingUser.id}`}
              required
              className="p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
            />
            <div className="col-span-1 md:col-span-2 flex gap-4">
              <button
                type="submit"
                disabled={operationLoading === `update-${editingUser.id}`}
                className="flex-1 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {operationLoading === `update-${editingUser.id}` ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memperbarui...
                  </>
                ) : (
                  "Perbarui Pengguna"
                )}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={operationLoading === `update-${editingUser.id}`}
                className="flex-1 p-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <h2 className="text-2xl font-semibold border-b pb-2 mb-4 text-gray-700">
        Daftar Pengguna
      </h2>

      {/* Refresh Button */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-gray-600">Total: {users.length} pengguna</p>
        <button
          onClick={() => fetchUsers(false)}
          disabled={!!operationLoading}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      <div className="grid gap-4">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-gray-500 text-lg mb-2">Belum ada pengguna</p>
            <p className="text-gray-400">
              Tambahkan pengguna pertama menggunakan form di atas
            </p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className={`p-4 border border-gray-200 rounded-lg flex justify-between items-center bg-white shadow-sm transition-all ${
                editingUser?.id === user.id
                  ? "ring-2 ring-yellow-300 bg-yellow-50"
                  : ""
              }`}
            >
              <div>
                <h3 className="text-xl font-medium text-gray-800">
                  {user.firstname} {user.lastname}
                </h3>
                <p className="text-gray-600">Usia: {user.age} tahun</p>
                {user.id && (
                  <p className="text-xs text-gray-400 mt-1">ID: {user.id}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditClick(user)}
                  disabled={!!operationLoading || editingUser?.id === user.id}
                  className="p-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  title={
                    editingUser?.id === user.id
                      ? "Sedang diedit"
                      : "Edit pengguna"
                  }
                >
                  {editingUser?.id === user.id ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => handleDeleteUser(user.id!)}
                  disabled={
                    operationLoading === `delete-${user.id}` ||
                    !!operationLoading
                  }
                  className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                  title="Hapus pengguna"
                >
                  {operationLoading === `delete-${user.id}` ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserPage;
