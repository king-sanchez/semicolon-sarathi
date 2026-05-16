"use client";

import { useState } from "react";
import axios from "axios";

export default function UserProfileForm() {

  const [form, setForm] = useState({
    name: "",
    email: "",
    age: "",
    gender: "",
    state: "",
    occupation: "",
    annualIncome: "",
    category: "",
  });

  async function submit() {

    const res = await axios.post(
      "http://localhost:8000/api/users",
      form
    );

    localStorage.setItem(
      "userId",
      res.data.id
    );

    window.location.href = "/dashboard";
  }

  return (
    <div>
      <input
        placeholder="Name"
        onChange={(e) =>
          setForm({
            ...form,
            name: e.target.value,
          })
        }
      />

      <input
        placeholder="Email"
        onChange={(e) =>
          setForm({
            ...form,
            email: e.target.value,
          })
        }
      />

      <button onClick={submit}>
        Create Profile
      </button>
    </div>
  );
}
