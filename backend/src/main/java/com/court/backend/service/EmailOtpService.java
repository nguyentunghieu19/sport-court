package com.court.backend.service;

import com.court.backend.entity.User;
import com.court.backend.enums.UserRole;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.*;
import java.time.*;
import java.util.*;
import java.security.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Service
public class EmailOtpService {
 private final JdbcTemplate db;
 private final UserRepository users;
 private final PasswordEncoder passwords;
 private final ObjectMapper json;
 private final String apiKey, sender, secret;
 private final SecureRandom random = new SecureRandom();
 public EmailOtpService(JdbcTemplate db, UserRepository users, PasswordEncoder passwords, ObjectMapper json,
   @Value("${app.brevo.api-key:${BREVO_API_KEY:}}") String apiKey,
   @Value("${app.brevo.sender-email:${BREVO_SENDER_EMAIL:}}") String sender,
   @Value("${app.otp.secret:${OTP_SECRET:}}") String secret) {
  this.db=db; this.users=users; this.passwords=passwords; this.json=json;
  this.apiKey=apiKey; this.sender=sender; this.secret=secret;
 }
 public String normalize(String email) { return email.trim().toLowerCase(Locale.ROOT); }
 private ApiException bad(String message) {return new ApiException(HttpStatus.BAD_REQUEST,message);}
 private void configured() {
  if(secret.length()<32 || apiKey.isBlank() || sender.isBlank())
   throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,"Chức năng email chưa được cấu hình");
 }
 private String hash(String value) {
  configured();
  try { Mac mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8),"HmacSHA256"));return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8))); }
  catch(Exception e){throw new IllegalStateException("Không tạo được mã xác minh",e);}
 }
 private boolean same(String a,String b) {return a!=null && b!=null && MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8),b.getBytes(StandardCharsets.UTF_8));}
 private Map<String,Object> lock(String email,String purpose) {
  db.update("INSERT INTO email_challenges(email,purpose) VALUES (?,?) ON CONFLICT DO NOTHING",email,purpose);
  return db.queryForMap("SELECT * FROM email_challenges WHERE email=? AND purpose=? FOR UPDATE",email,purpose);
 }
 private Instant time(Map<String,Object> row,String name) {Object v=row.get(name);return v==null?Instant.EPOCH:((java.sql.Timestamp)v).toInstant();}
 private User eligible(String email) {
  return users.findByEmail(email).filter(u->u.isActive() && u.getDeletedAt()==null && (u.getRole()==UserRole.USER || u.getRole()==UserRole.OWNER)).orElse(null);
 }
 @Transactional
 public void limit(String address, String operation) {
  String key="ip:"+hash(address);Instant now=Instant.now();var row=lock(key,operation);
  boolean fresh=time(row,"window_start").plusSeconds(3600).isBefore(now);
  int count=fresh?0:((Number)row.get("sends")).intValue();
  if(count>=100)throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,"Quá nhiều yêu cầu, vui lòng thử lại sau");
  db.update("UPDATE email_challenges SET sends=?,window_start=? WHERE email=? AND purpose=?",count+1,java.sql.Timestamp.from(fresh?now:time(row,"window_start")),key,operation);
 }
 @Transactional
 public void request(String raw,String purpose) {
  configured(); String email=normalize(raw); Instant now=Instant.now();
  Map<String,Object> row=lock(email,purpose);
  boolean fresh=time(row,"window_start").plusSeconds(3600).isBefore(now);
  int sends=fresh?0:((Number)row.get("sends")).intValue();
  if(time(row,"last_sent").plusSeconds(60).isAfter(now) || sends>=5)
   throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,"Vui lòng chờ trước khi gửi lại (tối đa 5 email/giờ)");
  User user=purpose.equals("RESET")?eligible(email):null;
  String code=String.format(Locale.ROOT,"%06d",random.nextInt(1_000_000));
  db.update("UPDATE email_challenges SET code_hash=?,expires_at=?,token_hash=NULL,token_expires_at=NULL,attempts=?,sends=?,window_start=?,last_sent=?,user_id=? WHERE email=? AND purpose=?",
    hash(email+":"+purpose+":"+code),java.sql.Timestamp.from(now.plusSeconds(300)),fresh?0:row.get("attempts"),sends+1,
    java.sql.Timestamp.from(fresh?now:time(row,"window_start")),java.sql.Timestamp.from(now),user==null?null:user.getId(),email,purpose);
  // Cùng phản hồi cho email không tồn tại/không đủ điều kiện, không gửi OTP cho chúng.
  if(purpose.equals("RESET") && user==null) return;
  if(purpose.startsWith("REGISTER") && users.existsByEmail(email)) return;
  send(email,code,purpose.equals("RESET")?"Đặt lại mật khẩu":"Xác minh đăng ký");
 }
 @Transactional(noRollbackFor=ApiException.class)
 public String verify(String raw,String purpose,String code) {
  String email=normalize(raw);Map<String,Object> row=lock(email,purpose);Instant now=Instant.now();
  int attempts=((Number)row.get("attempts")).intValue();
  if(attempts>=5 || !time(row,"expires_at").isAfter(now) || row.get("code_hash")==null) throw bad("Mã không hợp lệ, hết hạn hoặc đã dùng");
  db.update("UPDATE email_challenges SET attempts=attempts+1 WHERE email=? AND purpose=?",email,purpose);
  if(!same((String)row.get("code_hash"),hash(email+":"+purpose+":"+code))) throw bad("Mã xác minh không đúng");
  byte[] bytes=new byte[32];random.nextBytes(bytes);String token=HexFormat.of().formatHex(bytes);
  db.update("UPDATE email_challenges SET code_hash=NULL,token_hash=?,token_expires_at=? WHERE email=? AND purpose=?",hash(token),java.sql.Timestamp.from(now.plusSeconds(600)),email,purpose);
  return token;
 }
 @Transactional
 public void consumeRegistration(String raw,String purpose,String token) {
  consume(raw,purpose,token);
 }
 private Map<String,Object> consume(String raw,String purpose,String token) {
  if(token==null || token.length()!=64)throw bad("Vui lòng xác minh email trước");
  String email=normalize(raw);Map<String,Object> row=lock(email,purpose);
  if(!time(row,"token_expires_at").isAfter(Instant.now()) || !same((String)row.get("token_hash"),hash(token)))throw bad("Phiên xác minh không hợp lệ hoặc hết hạn");
  db.update("UPDATE email_challenges SET token_hash=NULL,token_expires_at=NULL WHERE email=? AND purpose=?",email,purpose);
  return row;
 }
 @Transactional
 public void reset(String email,String token,String password) {
  if(password.length()<8 || password.getBytes(StandardCharsets.UTF_8).length>72)throw bad("Mật khẩu từ 8 ký tự và tối đa 72 byte UTF-8");
  Map<String,Object> row=consume(email,"RESET",token);
  // Khóa tài khoản; kiểm tra ID tránh token cũ tác động tài khoản đăng ký lại cùng email.
  User u=eligible(normalize(email));
  if(u==null || row.get("user_id")==null || u.getId().longValue()!=((Number)row.get("user_id")).longValue())throw bad("Yêu cầu không hợp lệ");
  db.queryForObject("SELECT id FROM users WHERE id=? FOR UPDATE",Long.class,u.getId());
  int updated=db.update("UPDATE users SET password_hash=?,email_verified=true,token_version=token_version+1 WHERE id=? AND email=? AND role::text IN ('USER','OWNER') AND is_active=true AND deleted_at IS NULL",passwords.encode(password),u.getId(),normalize(email));
  if(updated!=1)throw bad("Thông tin tài khoản đã thay đổi, vui lòng yêu cầu lại");
 }
 private void send(String email,String code,String subject) {
  try {
   String body=json.writeValueAsString(Map.of("sender",Map.of("email",sender,"name","SportCourt"),"to",List.of(Map.of("email",email)),"subject","SportCourt - "+subject,"textContent","Mã OTP của bạn: "+code+". Có hiệu lực 5 phút. Không chia sẻ mã này."));
   var req=HttpRequest.newBuilder(URI.create("https://api.brevo.com/v3/smtp/email")).timeout(Duration.ofSeconds(20)).header("api-key",apiKey).header("Content-Type","application/json").POST(HttpRequest.BodyPublishers.ofString(body)).build();
   var response=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build().send(req,HttpResponse.BodyHandlers.discarding());
   if(response.statusCode()/100!=2)throw new IllegalStateException();
  } catch(InterruptedException e){Thread.currentThread().interrupt();throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,"Chưa gửi được email, vui lòng thử lại");}
  catch(Exception e){throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,"Chưa gửi được email. Kiểm tra cấu hình Brevo hoặc thử lại sau");}
 }
}
