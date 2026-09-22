const CONFIG = window.VICKY_CONFIG;

const FALLBACK_ROOMS = [
  {
    _id: "fallback-deluxe",
    name: "Deluxe Room",
    slug: { current: "deluxe-room" },
    price: 120000,
    maxGuests: 2,
    description: "A calm, polished room designed for comfortable business and leisure stays.",
    amenities: ["King-size bed", "Complimentary Wi-Fi", "Air conditioning", "Smart TV", "Room service"],
    featured: true,
    imageUrl: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=85"
  },
  {
    _id: "fallback-executive",
    name: "Executive Suite",
    slug: { current: "executive-suite" },
    price: 180000,
    maxGuests: 3,
    description: "A spacious suite with a dedicated living area for guests who want more room to relax or work.",
    amenities: ["King-size bed", "Living area", "Complimentary Wi-Fi", "Air conditioning", "Room service"],
    featured: true,
    imageUrl: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=85"
  },
  {
    _id: "fallback-premium",
    name: "Premium Suite",
    slug: { current: "premium-suite" },
    price: 250000,
    maxGuests: 4,
    description: "Our most spacious stay option, combining a separate lounge with a premium bathroom experience.",
    amenities: ["King-size bed", "Separate lounge", "Complimentary Wi-Fi", "Air conditioning", "Premium bathroom"],
    featured: true,
    imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=85"
  }
];

const FALLBACK_HOTEL = {
  hotelName: "VICKY SUITES AND LODGE",
  tagline: "Home of Peace and Luxury",
  description: "A refined stay designed around comfort, calm and warm Nigerian hospitality, with thoughtfully furnished rooms and convenient services for business and leisure guests.",
  phone: "+234 812 748 6877",
  whatsapp: "+234 906 013 3921",
  email: "reservations@vickysuites.com",
  address: "Nigeria"
};

const money = value => new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0
}).format(Number(value || 0));

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
}[char]));

function slugOf(room) {
  return typeof room.slug === "string" ? room.slug : room.slug?.current || "";
}

function roomImage(room, index = 0) {
  if (room.imageUrl) return room.imageUrl;
  const images = [
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=85"
  ];
  return images[index % images.length];
}

async function sanityQuery(query) {
  const endpoint = `https://${CONFIG.sanityProjectId}.apicdn.sanity.io/v${CONFIG.sanityApiVersion}/data/query/${CONFIG.sanityDataset}?query=${encodeURIComponent(query)}`;
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error("Sanity request failed");
  const data = await response.json();
  return data.result;
}

async function getHotel() {
  try {
    return (await sanityQuery(`*[_type=="hotelSettings"][0]{hotelName,tagline,description,phone,whatsapp,email,address}`)) || FALLBACK_HOTEL;
  } catch {
    return FALLBACK_HOTEL;
  }
}

async function getRooms() {
  try {
    const rooms = await sanityQuery(`*[_type=="room"]|order(featured desc,name asc){_id,name,slug,price,maxGuests,description,amenities,featured,"imageUrl": image.asset->url}`);
    return Array.isArray(rooms) && rooms.length ? rooms : FALLBACK_ROOMS;
  } catch {
    return FALLBACK_ROOMS;
  }
}

function waNumber(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function bindHotel(hotel) {
  document.querySelectorAll("[data-hotel-name]").forEach(el => el.textContent = hotel.hotelName);
  document.querySelectorAll("[data-hotel-tagline]").forEach(el => el.textContent = hotel.tagline);
  document.querySelectorAll("[data-hotel-description]").forEach(el => el.textContent = hotel.description);
  document.querySelectorAll("[data-hotel-phone]").forEach(el => {
    el.textContent = hotel.phone;
    el.href = `tel:${hotel.phone.replace(/\s/g,"")}`;
  });
  document.querySelectorAll("[data-hotel-whatsapp]").forEach(el => {
    el.textContent = hotel.whatsapp;
    el.href = `https://wa.me/${waNumber(hotel.whatsapp)}`;
  });
  document.querySelectorAll("[data-hotel-email]").forEach(el => {
    el.textContent = hotel.email;
    el.href = `mailto:${hotel.email}`;
  });
  document.querySelectorAll("[data-hotel-address]").forEach(el => el.textContent = hotel.address);
}

function roomCard(room, index = 0) {
  const slug = slugOf(room);
  return `
    <article class="room-card">
      <a class="room-card__image" href="room-details.html?room=${encodeURIComponent(slug || room._id)}">
        <img src="${roomImage(room,index)}" alt="${escapeHtml(room.name)}" loading="lazy">
      </a>
      <div class="room-card__body">
        <div class="room-card__top">
          <h3>${escapeHtml(room.name)}</h3>
          <span>${money(room.price)} <small>/ night</small></span>
        </div>
        <p>${escapeHtml(room.description || "A thoughtfully furnished stay with comfort-focused amenities.")}</p>
        <div class="room-card__meta">
          <span>Up to ${room.maxGuests || 2} guests</span>
          <span>Air conditioning</span>
        </div>
        <div class="room-card__actions">
          <a class="text-link" href="room-details.html?room=${encodeURIComponent(slug || room._id)}">View room</a>
          <a class="button button--small" href="booking.html?room=${encodeURIComponent(slug || room._id)}">Book now</a>
        </div>
      </div>
    </article>`;
}

async function renderFeaturedRooms() {
  const target = document.querySelector("[data-featured-rooms]");
  if (!target) return;
  const rooms = (await getRooms()).filter(room => room.featured !== false).slice(0, 3);
  target.innerHTML = rooms.map(roomCard).join("");
}

async function renderAllRooms() {
  const target = document.querySelector("[data-all-rooms]");
  if (!target) return;
  const rooms = await getRooms();
  target.innerHTML = rooms.map(roomCard).join("");
}

async function renderRoomDetails() {
  const target = document.querySelector("[data-room-details]");
  if (!target) return;
  const params = new URLSearchParams(location.search);
  const requested = params.get("room");
  const rooms = await getRooms();
  const room = rooms.find(item => slugOf(item) === requested || item._id === requested) || rooms[0];
  if (!room) {
    target.innerHTML = `<div class="empty-state"><h2>Room not found</h2><p>Please return to the rooms page and choose another room.</p></div>`;
    return;
  }
  const amenities = (room.amenities || []).map(item => `<li>${escapeHtml(item)}</li>`).join("");
  target.innerHTML = `
    <div class="detail-gallery">
      <img src="${roomImage(room,0)}" alt="${escapeHtml(room.name)}">
      <div class="detail-gallery__side">
        <img src="${roomImage({...room,imageUrl:null},1)}" alt="${escapeHtml(room.name)} interior" loading="lazy">
        <img src="${roomImage({...room,imageUrl:null},2)}" alt="${escapeHtml(room.name)} details" loading="lazy">
      </div>
    </div>
    <div class="detail-grid">
      <div>
        <p class="eyebrow">VICKY SUITES & LODGE</p>
        <h1>${escapeHtml(room.name)}</h1>
        <p class="lead">${escapeHtml(room.description || "")}</p>
        <h3>Room amenities</h3>
        <ul class="amenities-list">${amenities}</ul>
      </div>
      <aside class="booking-card">
        <span class="booking-card__label">From</span>
        <strong>${money(room.price)}</strong>
        <span class="booking-card__sub">per night · up to ${room.maxGuests || 2} guests</span>
        <a class="button button--full" href="booking.html?room=${encodeURIComponent(slugOf(room) || room._id)}">Reserve this room</a>
        <p class="booking-card__note">Flexible booking assistance via WhatsApp.</p>
      </aside>
    </div>`;
}

async function setupBooking() {
  const form = document.querySelector("#booking-form");
  if (!form) return;
  const rooms = await getRooms();
  const select = form.querySelector("[name=room]");
  const params = new URLSearchParams(location.search);
  const requested = params.get("room");
  select.innerHTML = rooms.map(room => `<option value="${escapeHtml(slugOf(room) || room._id)}">${escapeHtml(room.name)} — ${money(room.price)}/night</option>`).join("");
  if (requested) select.value = requested;

  const updateTotal = () => {
    const room = rooms.find(item => (slugOf(item) || item._id) === select.value) || rooms[0];
    const checkIn = new Date(form.checkIn.value);
    const checkOut = new Date(form.checkOut.value);
    const nights = Number.isFinite(checkIn.getTime()) && Number.isFinite(checkOut.getTime()) && checkOut > checkIn
      ? Math.ceil((checkOut - checkIn) / 86400000) : 0;
    document.querySelector("[data-booking-total]").textContent = nights ? `${money(room.price * nights)} · ${nights} night${nights === 1 ? "" : "s"}` : "Select valid dates";
  };

  form.addEventListener("input", updateTotal);
  form.addEventListener("change", updateTotal);

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const room = rooms.find(item => (slugOf(item) || item._id) === select.value) || rooms[0];
    const data = Object.fromEntries(new FormData(form).entries());
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    if (!(checkOut > checkIn)) {
      alert("Please choose a valid check-in and check-out date.");
      return;
    }

    const submitButton = form.querySelector("button[type=submit]");
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Sending booking request…";

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          roomSlug: slugOf(room) || room._id,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          guests: data.guests,
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          guestPhone: data.guestPhone,
          specialRequest: data.specialRequest
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Booking request failed.");
      }

      const hotel = await getHotel();
      const message = [
        `Hello Vicky Suites & Lodge, I submitted booking request ${result.bookingReference}.`,
        `Room: ${result.roomName}`,
        `Check-in: ${data.checkIn}`,
        `Check-out: ${data.checkOut}`,
        `Guests: ${data.guests}`,
        `Guest name: ${data.guestName}`,
        `Estimated total: ${money(result.totalAmount)}`,
        data.specialRequest ? `Special request: ${data.specialRequest}` : ""
      ].filter(Boolean).join("\n");

      target = document.querySelector(".form-panel");
      target.innerHTML = `
        <div class="empty-state">
          <p class="eyebrow">Request received</p>
          <h2>Booking request ${escapeHtml(result.bookingReference)}</h2>
          <p>Thank you, ${escapeHtml(data.guestName)}. Your request has been saved and is awaiting confirmation.</p>
          <p><strong>${escapeHtml(result.roomName)}</strong> · ${result.nights} night${result.nights === 1 ? "" : "s"} · <strong>${money(result.totalAmount)}</strong></p>
          <a class="button" href="https://wa.me/${waNumber(hotel.whatsapp)}?text=${encodeURIComponent(message)}">Continue on WhatsApp</a>
          <a class="text-link" href="index.html" style="display:inline-block;margin-left:16px">Return home</a>
        </div>`;
    } catch (error) {
      alert(error.message);
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
}

function setupNavigation() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-mobile-menu]");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", menu.classList.contains("is-open"));
    });
  }
  window.addEventListener("scroll", () => {
    document.body.classList.toggle("is-scrolled", window.scrollY > 12);
  }, {passive:true});
}

(async function init() {
  setupNavigation();
  const hotel = await getHotel();
  bindHotel(hotel);
  await Promise.all([
    renderFeaturedRooms(),
    renderAllRooms(),
    renderRoomDetails(),
    setupBooking()
  ]);
})();
