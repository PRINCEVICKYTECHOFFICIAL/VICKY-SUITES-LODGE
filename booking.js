export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      roomSlug,
      checkIn,
      checkOut,
      guests,
      guestName,
      guestEmail,
      guestPhone,
      specialRequest = ""
    } = req.body || {};

    if (!roomSlug || !checkIn || !checkOut || !guests || !guestName || !guestEmail || !guestPhone) {
      return res.status(400).json({ error: "Please complete all required booking fields." });
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({ error: "Please provide valid check-in and check-out dates." });
    }

    const projectId = process.env.SANITY_PROJECT_ID || "hje696ci";
    const dataset = process.env.SANITY_DATASET || "production";
    const token = process.env.SANITY_WRITE_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "Booking service is not configured yet. Please contact reservations directly."
      });
    }

    const apiVersion = process.env.SANITY_API_VERSION || "2025-02-19";
    const base = `https://${projectId}.api.sanity.io/v${apiVersion}/data`;
    const query = encodeURIComponent(
      `*[_type=="room" && slug.current == $slug][0]{_id,name,price,maxGuests}`
    );

    const roomResponse = await fetch(
      `${base}/query/${dataset}?query=${query}&$slug=${encodeURIComponent(roomSlug)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!roomResponse.ok) {
      throw new Error("Could not verify the selected room.");
    }

    const roomData = await roomResponse.json();
    const room = roomData.result;

    if (!room) {
      return res.status(400).json({ error: "The selected room could not be found." });
    }

    const nights = Math.ceil((end - start) / 86400000);
    const totalAmount = Number(room.price || 0) * nights;
    const bookingReference =
      `VSL-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const mutation = {
      mutations: [{
        create: {
          _type: "booking",
          bookingReference,
          room: { _type: "reference", _ref: room._id },
          checkIn,
          checkOut,
          guests: Number(guests),
          guestName,
          guestEmail,
          guestPhone,
          specialRequest,
          totalAmount,
          status: "pending",
          createdAt: new Date().toISOString()
        }
      }]
    };

    const mutationResponse = await fetch(`${base}/mutate/${dataset}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(mutation)
    });

    if (!mutationResponse.ok) {
      throw new Error("Could not save the booking request.");
    }

    return res.status(200).json({
      success: true,
      bookingReference,
      roomName: room.name,
      totalAmount,
      nights
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "We could not complete the booking request. Please contact reservations directly."
    });
  }
}
