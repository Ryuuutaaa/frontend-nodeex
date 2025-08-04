import React, { useState } from "react";

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

  return <div>UserPage</div>;
};

export default UserPage;
