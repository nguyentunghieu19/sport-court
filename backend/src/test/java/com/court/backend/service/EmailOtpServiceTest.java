package com.court.backend.service;
import com.court.backend.repository.UserRepository;
import com.court.backend.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import tools.jackson.databind.ObjectMapper;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.assertj.core.api.Assertions.*;

class EmailOtpServiceTest {
 private final JdbcTemplate db=mock(JdbcTemplate.class);
 private final UserRepository users=mock(UserRepository.class);
 private final EmailOtpService service=new EmailOtpService(db,users,new BCryptPasswordEncoder(),new ObjectMapper(),"test-key","test@example.com","test-secret-with-more-than-32-characters");
 private Map<String,Object> row(){var r=new HashMap<String,Object>();r.put("attempts",0);r.put("code_hash","invalid");r.put("expires_at",Timestamp.from(Instant.now().plusSeconds(300)));r.put("token_expires_at",Timestamp.from(Instant.now().plusSeconds(300)));return r;}
 @Test void expiredCodeCannotMintToken(){var r=row();r.put("expires_at",Timestamp.from(Instant.now().minusSeconds(1)));when(db.queryForMap(anyString(),any(Object[].class))).thenReturn(r);assertThatThrownBy(()->service.verify("x@example.com","RESET","123456")).isInstanceOf(ApiException.class);verify(db,never()).update(contains("token_hash=?"),any(Object[].class));}
 @Test void exhaustedAttemptsCannotVerify(){var r=row();r.put("attempts",5);when(db.queryForMap(anyString(),any(Object[].class))).thenReturn(r);assertThatThrownBy(()->service.verify("x@example.com","RESET","123456")).isInstanceOf(ApiException.class);}
 @Test void incorrectCodeIncrementsPersistentCounter(){when(db.queryForMap(anyString(),any(Object[].class))).thenReturn(row());assertThatThrownBy(()->service.verify("x@example.com","RESET","000000")).isInstanceOf(ApiException.class);verify(db).update(contains("attempts=attempts+1"),eq("x@example.com"),eq("RESET"));}
 @Test void consumedOrForgedTokenCannotRegister(){when(db.queryForMap(anyString(),any(Object[].class))).thenReturn(row());assertThatThrownBy(()->service.consumeRegistration("x@example.com","REGISTER_USER","a".repeat(64))).isInstanceOf(ApiException.class);verify(db,never()).update(contains("token_hash=NULL,token_expires_at=NULL"),any(Object[].class));}
 private String hmac(String value) throws Exception {var mac=javax.crypto.Mac.getInstance("HmacSHA256");mac.init(new javax.crypto.spec.SecretKeySpec("test-secret-with-more-than-32-characters".getBytes(java.nio.charset.StandardCharsets.UTF_8),"HmacSHA256"));return HexFormat.of().formatHex(mac.doFinal(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)));}
 @Test void correctCodeMintsTokenAndClearsCode() throws Exception {
  var r=row();r.put("code_hash",hmac("x@example.com:REGISTER_USER:123456"));when(db.queryForMap(anyString(),any(Object[].class))).thenReturn(r);
  String token=service.verify("X@EXAMPLE.COM","REGISTER_USER","123456");assertThat(token).hasSize(64);
  verify(db).update(contains("code_hash=NULL,token_hash=?"),eq(hmac(token)),any(),eq("x@example.com"),eq("REGISTER_USER"));
 }
 @Test void tokenIsBoundToOriginalUserIdentity() throws Exception {
  var r=row();r.put("token_hash",hmac("a".repeat(64)));r.put("user_id",1L);when(db.queryForMap(anyString(),any(Object[].class))).thenReturn(r);
  var newUser=new com.court.backend.entity.User();newUser.setId(2L);newUser.setRole(com.court.backend.enums.UserRole.USER);
  when(users.findByEmail("x@example.com")).thenReturn(Optional.of(newUser));
  assertThatThrownBy(()->service.reset("x@example.com","a".repeat(64),"NewPassword123")).isInstanceOf(ApiException.class);
  verify(db,never()).update(contains("UPDATE users"),any(Object[].class));
 }
}
