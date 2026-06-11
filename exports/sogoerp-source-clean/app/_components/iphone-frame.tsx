import type { ReactNode } from "react";

type IphoneFrameProps = {
  children: ReactNode;
};

export function IphoneFrame({ children }: IphoneFrameProps) {
  return (
    <div className="auth-phone-wrap">
      <div className="auth-phone">
        <div className="auth-phone-island" />
        <div className="auth-phone-button auth-phone-button-left" />
        <div className="auth-phone-button auth-phone-button-right" />
        <div className="auth-phone-screen">{children}</div>
      </div>
    </div>
  );
}
