import React, { useState } from 'react';
import authApi from '../../services/authService';  // Import authApi như một đối tượng
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await authApi.register(formData);  // Sử dụng register từ authApi
      setError('');
      navigate('/login');  // Sau khi đăng ký thành công, chuyển đến trang login
    } catch (err) {
      setError('Có lỗi xảy ra, vui lòng thử lại!');
    }
  };

  return (
    <div>
      <h2>Đăng Ký</h2>
      {error && <p>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Tên người dùng"
          value={formData.name}
          onChange={handleChange}
        />
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
        <button type="submit">Đăng Ký</button>
      </form>
    </div>
  );
};

export default SignUp;
