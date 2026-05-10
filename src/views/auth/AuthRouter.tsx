import { useState } from "react";
import { LoginView } from "./LoginView";
import { RegisterView } from "./RegisterView";
import { ForgotPasswordView } from "./ForgotPasswordView";
import type { TelaAuth } from "./tipos";

export function AuthRouter() {
  const [tela, setTela] = useState<TelaAuth>("login");

  if (tela === "registrar") return <RegisterView onTrocarTela={setTela} />;
  if (tela === "esqueci") return <ForgotPasswordView onTrocarTela={setTela} />;
  if (tela === "esqueci-enviado")
    return <ForgotPasswordView onTrocarTela={setTela} enviado />;
  return <LoginView onTrocarTela={setTela} />;
}
