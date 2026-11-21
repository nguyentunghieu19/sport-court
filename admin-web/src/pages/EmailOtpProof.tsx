import { useState } from "react";
import publicApiClient from "../api/publicApiClient";
import { getErrorMessage } from "../api/errorMessage";
export type EmailProof = { email: string; token: string };
export function EmailOtpProof({ email, purpose, onVerified }: {email: string; purpose: "register" | "register-owner" | "password"; onVerified: (proof: EmailProof) => void}) {
 const [code,setCode]=useState(""); const [busy,setBusy]=useState(false); const [message,setMessage]=useState(""); const [sent,setSent]=useState(""); const [retryAt,setRetryAt]=useState(0);
 const clean=email.trim().toLowerCase();
 async function send(){setBusy(true);setMessage("");try{if(Date.now()<retryAt)throw new Error("Vui lòng chờ 60 giây trước khi gửi lại.");await publicApiClient.post(`/api/auth/${purpose}/${purpose==="password"?"forgot":"request-otp"}`,{email:clean});setSent(clean);setCode("");setRetryAt(Date.now()+60000);onVerified({email:"",token:""});setMessage("Nếu email đủ điều kiện, mã đã được gửi. Kiểm tra cả thư rác; mã hết hạn sau 5 phút.");}catch(e){setMessage(getErrorMessage(e));}finally{setBusy(false);}}
 async function verify(){setBusy(true);try{const r=await publicApiClient.post<{token:string}>(`/api/auth/${purpose}/verify-otp`,{email:clean,code});onVerified({email:clean,token:r.data.token});setMessage("Đã xác minh. Hoàn tất biểu mẫu trong 10 phút.");}catch(e){setMessage(getErrorMessage(e));}finally{setBusy(false);}}
 return <section className="my-4 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4" aria-label="Xác minh email">
 <button type="button" disabled={busy || !clean} onClick={send} className="font-semibold text-emerald-800 disabled:opacity-50">{busy?"Đang xử lý…":"Gửi / gửi lại mã OTP qua email"}</button>
 {sent===clean && <div className="flex gap-2"><input aria-label="Mã OTP 6 chữ số" autoComplete="one-time-code" inputMode="numeric" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,""))} className="min-w-0 rounded border p-2" placeholder="OTP 6 số"/><button type="button" disabled={busy || code.length!==6} onClick={verify}>Xác minh</button></div>}
 {message && <p role="status" className="text-sm">{message}</p>}
 </section>;
}
