import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const OauthSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const name = params.get("name");
    const email = params.get("email");
    const avatar = params.get("avatar");
    if (token) {
      localStorage.setItem("token", token);
      if (name) localStorage.setItem("name", name);
      if (email) localStorage.setItem("email", email);
      if (avatar) localStorage.setItem("avatar", avatar);
      navigate("/client-dashboard");
    } else {
      navigate("/login");
    }
  }, [navigate]);

  return <div>Signing you in...</div>;
};

export default OauthSuccess; 