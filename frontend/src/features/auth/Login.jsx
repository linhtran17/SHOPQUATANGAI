import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import authApi from "../../services/authService";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const nav = useNavigate();
  const loc = useLocation();

  // Nếu đã có token thì về trang chủ
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) nav("/", { replace: true });
  }, [nav]);

  const from = loc.state?.from || "/";

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const validate = () => {
    if (!form.email.trim()) return "Vui lòng nhập email";
    if (!/\S+@\S+\.\S+/.test(form.email)) return "Email không hợp lệ";
    if (!form.password || form.password.length < 6)
      return "Mật khẩu tối thiểu 6 ký tự";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) return setErr(v);

    setLoading(true);
    setErr("");
    try {
      const data = await authApi.login(form); // { token, user }
      localStorage.setItem("token", data.token);

      // Điều hướng về nơi gốc (nếu đi từ trang cần quyền) hoặc Home
      nav(from, { replace: true });

      // Nếu muốn Header cập nhật ngay user (vì Header chỉ fetch /me khi mount)
      // thì bỏ comment dòng dưới:
      // window.location.reload();

    } catch (e2) {
      const msg =
        e2?.response?.data?.message ||
        e2?.message ||
        "Sai email hoặc mật khẩu";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-5">
        <h1 className="text-lg font-bold mb-3">Đăng nhập</h1>

        {err && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
              placeholder="you@example.com"
              value={form.email}
              onChange={onChange}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Mật khẩu</label>
            <div className="mt-1 relative">
              <input
                name="password"
                type={showPwd ? "text" : "password"}
                className="block w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
                placeholder="••••••••"
                value={form.password}
                onChange={onChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute inset-y-0 right-2 my-auto text-xs text-slate-500 hover:text-slate-700"
                aria-label="Toggle password"
              >
                {showPwd ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>

        <div className="mt-3 text-sm text-center text-slate-600">
          Chưa có tài khoản?{" "}
          <Link
            to="/signup"
            state={{ from }}
            className="text-rose-600 hover:underline"
          >
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
