# Vicky Suites & Lodge — Launch Build

## Stack
- HTML
- CSS
- Vanilla JavaScript
- Sanity CMS (project `hje696ci`, dataset `production`)

## Pages
Home, Rooms, Room Details, Booking, About, Contact.

## CMS
The frontend reads hotel settings and room data from Sanity. Update prices, room names, amenities and contact information from the Sanity Studio.

Studio: https://vicky-suites-lodge.sanity.studio/

## Local preview
Because this is a static site, open the folder with VS Code and use any local static server. Avoid opening `index.html` directly if your browser blocks API requests.

## Before launch
1. Replace the temporary hotel address.
2. Upload real room/hotel photography to Sanity and connect the image fields.
3. Confirm room prices and booking rules.
4. Add the final reservations email.
5. Add a proper server-side booking endpoint if you want bookings stored automatically in Sanity.
6. Configure the production domain and Sanity CORS origin.
7. Add payment processing only after the booking workflow is tested end-to-end.

## Production booking endpoint
The `/api/booking` Vercel function creates pending booking documents in Sanity without exposing a write token to visitors.

Before deploying:
1. Create a Sanity API token with permission to create booking documents.
2. Add it in Vercel as `SANITY_WRITE_TOKEN`.
3. Keep the token server-side; never put it in `js/config.js`.
4. Add the production frontend origin to Sanity CORS settings.
5. Test one complete booking request before announcing online reservations.

The booking flow intentionally creates **pending** requests rather than claiming real-time availability. Final confirmation should be handled by the hotel until room-inventory rules and payment processing are connected.
