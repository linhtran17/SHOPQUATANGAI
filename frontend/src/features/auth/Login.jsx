import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "../../services/authService"; // Giả sử bạn đang gọi API từ authService

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Kiểm tra nếu đã đăng nhập rồi, điều hướng về trang chủ
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/"); // Điều hướng đến trang chủ nếu đã có token
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await authApi.login(formData); // Gọi API login từ authApi
      setError("");
      localStorage.setItem("token", data.token); // Lưu token vào localStorage
      navigate("/"); // Điều hướng về trang chủ
    } catch (err) {
      setError("Sai email hoặc mật khẩu");
    }
  };

  return (
    <div>
      <h2>Đăng Nhập</h2>
      {error && <p>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Mật khẩu"
          value={formData.password}
          onChange={handleChange}
        />
        <button type="submit">Đăng Nhập</button>
      </form>
    </div>
  );
};

export default Login;
