/**
 * ShopLine demo requests are emailed to Nicholas.
 *
 * Set this on the Vercel project (inarius-dynamics → Settings → Environment Variables):
 *
 *   RESEND_API_KEY
 *     API key from a free Resend account: https://resend.com/api-keys
 *     Create that account with nbstefany87@gmail.com. Until a domain is
 *     verified, Resend only delivers mail sent from onboarding@resend.dev
 *     to the email address on the Resend account.
 *
 * Optional, after inariusdynamics.com is verified in Resend:
 *
 *   DEMO_FROM_EMAIL
 *     Example: Inarius Dynamics <demos@inariusdynamics.com>
 *
 * The recipient is fixed to nbstefany87@gmail.com. If the key is missing or
 * Resend rejects the send, this function tells the page to open a mailto
 * draft to that same address.
 */

var TO = "nbstefany87@gmail.com";
var DEFAULT_FROM = "Inarius Dynamics <onboarding@resend.dev>";

var LIMITS = {
    name: 120,
    shop: 160,
    email: 200,
    phone: 40,
    location: 120,
    volume: 400,
    time: 160,
    notes: 4000
};

function clean(value, max) {
    return String(value == null ? "" : value)
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max);
}

function cleanNotes(value) {
    return String(value == null ? "" : value)
        .replace(/\r/g, "")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        .trim()
        .slice(0, LIMITS.notes);
}

function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validPhone(value) {
    var digits = value.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
}

function parseJson(value) {
    if (value && typeof value === "object") return value;
    if (typeof value === "string" && value) {
        try {
            return JSON.parse(value);
        } catch (err) {
            return {};
        }
    }
    return null;
}

function readBody(req) {
    var parsed = parseJson(req.body);
    if (parsed) return Promise.resolve(parsed);
    if (!req.on || req.readableEnded) return Promise.resolve({});

    return new Promise(function (resolve, reject) {
        var chunks = [];
        var size = 0;
        req.on("data", function (chunk) {
            size += chunk.length;
            if (size > 100000) {
                reject(new Error("Body too large"));
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });
        req.on("end", function () {
            var text = Buffer.concat(chunks).toString("utf8");
            resolve(parseJson(text) || {});
        });
        req.on("error", reject);
    });
}

function originAllowed(req) {
    var origin = req.headers.origin || req.headers.Origin || "";
    var host = req.headers.host || req.headers.Host || "";
    if (!origin || !host) return false;
    try {
        return new URL(origin).host === host;
    } catch (err) {
        return false;
    }
}

function send(res, status, payload) {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(payload));
}

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        send(res, 405, { ok: false, error: "Method not allowed" });
        return;
    }

    if (!originAllowed(req)) {
        send(res, 403, { ok: false, error: "Forbidden" });
        return;
    }

    var body = await readBody(req);

    if (clean(body.company_website, 200)) {
        send(res, 200, { ok: true });
        return;
    }

    var fields = {
        name: clean(body.name, LIMITS.name),
        shop: clean(body.shop, LIMITS.shop),
        email: clean(body.email, LIMITS.email),
        phone: clean(body.phone, LIMITS.phone),
        location: clean(body.location, LIMITS.location),
        volume: clean(body.volume, LIMITS.volume),
        time: clean(body.time, LIMITS.time),
        notes: cleanNotes(body.notes)
    };

    var errors = {};
    if (!fields.name) errors.name = "Enter your name.";
    if (!fields.shop) errors.shop = "Enter the shop name.";
    if (!validEmail(fields.email)) errors.email = "Enter a valid email.";
    if (!validPhone(fields.phone)) errors.phone = "Enter a phone number with at least 10 digits.";
    if (!fields.location) errors.location = "Enter the city and state.";
    if (!fields.time) errors.time = "Enter a preferred contact time.";

    if (Object.keys(errors).length) {
        send(res, 400, { ok: false, errors: errors });
        return;
    }

    var apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        send(res, 503, { ok: false, fallback: true });
        return;
    }

    var text = [
        "ShopLine demo request",
        "",
        "Name: " + fields.name,
        "Shop: " + fields.shop,
        "Email: " + fields.email,
        "Phone: " + fields.phone,
        "City / state: " + fields.location,
        "Calls today: " + (fields.volume || "(not provided)"),
        "Preferred contact time: " + fields.time,
        "",
        "Notes:",
        fields.notes || "(none)"
    ].join("\n");

    try {
        var response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: "Bearer " + apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: process.env.DEMO_FROM_EMAIL || DEFAULT_FROM,
                to: [TO],
                reply_to: fields.email,
                subject: "ShopLine demo request — " + fields.shop,
                text: text
            })
        });

        if (!response.ok) {
            send(res, 502, { ok: false, fallback: true });
            return;
        }

        send(res, 200, { ok: true });
    } catch (err) {
        send(res, 502, { ok: false, fallback: true });
    }
};
