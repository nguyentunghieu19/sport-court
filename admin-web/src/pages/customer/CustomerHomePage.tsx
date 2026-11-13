import { useCallback, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import * as catalog from "../../services/customerCatalogService";
import { useCustomerQuery } from "./useCustomerQuery";
import { CourtDrawing, Pagination, QueryState, VenuePhoto } from "./CustomerCatalogComponents";
import { money, sportLabels } from "./catalogFormat";

export function CustomerHomePage() {
  const [params, setParams] = useSearchParams();
  const keyword = params.get("keyword") || "";
  const city = params.get("city") || "";
  const district = params.get("district") || "";
  const sportType = params.get("sportType") || "";
  const page = Math.max(0, Number(params.get("page")) || 0);
  const [advanced, setAdvanced] = useState(!!city || !!district);
  const query = useCustomerQuery(useCallback(() => catalog.searchVenues({ keyword, city, district, sportType, page, size: 9 }), [keyword, city, district, sportType, page]));
  const sports = useCustomerQuery(useCallback(() => catalog.getSportTypes(), []));
  function update(key: string, value: string) { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); next.delete("page"); setParams(next); }
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const next = new URLSearchParams(params);
    ["keyword", "city", "district"].forEach(key => { const value = String(data.get(key) ?? "").trim(); if (value) next.set(key, value); else next.delete(key); });
    next.delete("page"); setParams(next);
  }
  return <>
    <section className="customer-hero"><div className="customer-hero-content"><p className="customer-eyebrow"><span /> ĐẶT SÂN · KẾT NỐI · CHƠI HẾT MÌNH</p><h1>Cuộc hẹn tiếp theo.<br /><em>Trên sân của bạn.</em></h1><p>Từ trận cầu cùng bạn bè đến buổi tập mỗi ngày.<br className="hidden sm:block" /> Tìm sân, chọn giờ và sẵn sàng ra sân.</p><a href="#explore" className="customer-hero-cta">Tìm sân ngay <span>↗</span></a></div><div className="customer-hero-art"><span className="customer-hero-orbit" /><CourtDrawing /><span className="customer-hero-tag">YOUR NEXT GAME STARTS HERE</span><span className="customer-ball" /></div><span className="customer-hero-number" aria-hidden="true">01 / PLAY</span></section>
    <section id="explore" className="customer-explore"><div className="customer-section-heading"><div><p className="customer-eyebrow text-emerald-700">KHÔNG GIAN CHO ĐAM MÊ</p><h2>Tìm sân cho buổi chơi của bạn</h2></div><button onClick={query.reload} className="customer-text-button">↻ Làm mới</button></div>
      <form key={`${keyword}|${city}|${district}`} onSubmit={search} className="customer-search-panel"><div className="customer-search-row"><label className="customer-search-input"><span aria-hidden="true">⌕</span><span className="sr-only">Tìm tên sân, địa điểm</span><input name="keyword" defaultValue={keyword} placeholder="Tìm tên sân, địa điểm…" /></label><button type="button" aria-expanded={advanced} className="customer-button-secondary" onClick={() => setAdvanced(!advanced)}>Bộ lọc {city || district ? "•" : "+"}</button><button type="submit" className="customer-button">Tìm kiếm <span aria-hidden="true">→</span></button></div><div className={advanced ? "customer-filter-row" : "hidden"}><label>Tỉnh / Thành phố<input className="customer-input" name="city" defaultValue={city} placeholder="Ví dụ: Hà Nội" /></label><label>Quận / Huyện<input className="customer-input" name="district" defaultValue={district} placeholder="Ví dụ: Cầu Giấy" /></label><button type="button" className="customer-text-button" onClick={() => setParams({})}>Xóa bộ lọc</button></div></form>
      <div className="customer-sport-tabs" aria-label="Lọc môn thể thao"><button className={!sportType ? "active" : ""} onClick={() => update("sportType", "")}>Tất cả môn</button>{(sports.data ?? Object.entries(sportLabels).map(([code, label]) => ({ code, label }))).map(sport => <button key={sport.code} className={sportType === sport.code ? "active" : ""} onClick={() => update("sportType", sport.code)}>{sport.label}</button>)}</div>
      <div className="customer-results-heading"><h3>Khám phá địa điểm</h3><span>{query.data ? `${query.data.totalElements} địa điểm phù hợp` : "Sân tốt cho mọi cuộc hẹn"}</span></div>
      <QueryState loading={query.loading} error={query.error} retry={query.reload} />
      {query.data && <><div className="customer-venue-grid">{query.data.content.map(venue => <Link to={`/locations/${venue.id}`} key={venue.id} className="customer-venue-card"><div className="relative"><VenuePhoto key={venue.imageUrl} url={venue.imageUrl} name={venue.name} /><span className="customer-photo-count">{venue.fieldCount} sân</span></div><div className="customer-venue-card-body"><div className="customer-venue-sports">{venue.sportTypes.map(sport => <span key={sport}>{sportLabels[sport] ?? sport}</span>)}</div><h3>{venue.name}</h3><p className="customer-address">⌖ {[venue.address, venue.district, venue.city].filter(Boolean).join(", ")}</p><div className="customer-venue-card-bottom"><div><small>Giá từ</small><p>{venue.minBasePrice != null ? <><strong>{money(venue.minBasePrice)}</strong><span> / giờ</span></> : <span>Chưa có bảng giá</span>}</p></div><span className="customer-arrow" aria-label="Xem chi tiết">↗</span></div></div></Link>)}</div>{query.data.content.length === 0 && <div className="customer-empty"><h3>Chưa tìm thấy sân phù hợp</h3><p>Thử đổi từ khóa hoặc mở rộng khu vực tìm kiếm.</p><button className="customer-button-secondary" onClick={() => setParams({})}>Xem tất cả địa điểm</button></div>}<Pagination page={page} totalPages={query.data.totalPages} onChange={value => { const next = new URLSearchParams(params); next.set("page", String(value)); setParams(next); }} /></>}
    </section>
    <section className="customer-how"><div><span>01</span><h3>Chọn sân yêu thích</h3><p>Xem ảnh địa điểm và chọn môn thể thao.</p></div><div><span>02</span><h3>Chọn giờ phù hợp</h3><p>Kiểm tra lịch trống và giá theo khung giờ.</p></div><div><span>03</span><h3>Thanh toán & ra sân</h3><p>Đặt cọc trực tuyến, lưu mã đơn và bắt đầu chơi.</p></div></section>
  </>;
}
