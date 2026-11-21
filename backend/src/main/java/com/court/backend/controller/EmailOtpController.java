package com.court.backend.controller;
import com.court.backend.service.EmailOtpService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
public class EmailOtpController {
 private final EmailOtpService otp;
 public record Email(@NotBlank @jakarta.validation.constraints.Email @Size(max=255) String email){}
 public record Verify(@NotBlank @jakarta.validation.constraints.Email @Size(max=255) String email,@NotBlank @Pattern(regexp="[0-9]{6}") String code){}
 public record Reset(@NotBlank @jakarta.validation.constraints.Email String email,@NotBlank @Size(max=64) String token,@NotBlank @Size(min=8,max=72) String newPassword){}
 @PostMapping("/register/request-otp") public Map<String,String> requestUser(@Valid @RequestBody Email r){return request(r,"REGISTER_USER");}
 @PostMapping("/register-owner/request-otp") public Map<String,String> requestOwner(@Valid @RequestBody Email r){return request(r,"REGISTER_OWNER");}
 @PostMapping("/password/forgot") public Map<String,String> forgot(@Valid @RequestBody Email r){return request(r,"RESET");}
 private void limit(String operation){var attributes=(org.springframework.web.context.request.ServletRequestAttributes)org.springframework.web.context.request.RequestContextHolder.currentRequestAttributes();otp.limit(attributes.getRequest().getRemoteAddr(),operation);}
 private Map<String,String> request(Email r,String purpose){limit("LIMIT_SEND");otp.request(r.email(),purpose);return Map.of("message","Nếu email đủ điều kiện, mã xác minh đã được gửi. Mã có hiệu lực 5 phút.");}
 @PostMapping("/register/verify-otp") public Map<String,String> verifyUser(@Valid @RequestBody Verify r){return verify(r,"REGISTER_USER");}
 @PostMapping("/register-owner/verify-otp") public Map<String,String> verifyOwner(@Valid @RequestBody Verify r){return verify(r,"REGISTER_OWNER");}
 @PostMapping("/password/verify-otp") public Map<String,String> verifyReset(@Valid @RequestBody Verify r){return verify(r,"RESET");}
 private Map<String,String> verify(Verify r,String purpose){limit("LIMIT_VERIFY");return Map.of("token",otp.verify(r.email(),purpose,r.code()));}
 @PostMapping("/password/reset") public Map<String,String> reset(@Valid @RequestBody Reset r){limit("LIMIT_VERIFY");otp.reset(r.email(),r.token(),r.newPassword());return Map.of("message","Đã đặt lại mật khẩu. Vui lòng đăng nhập lại.");}
}
