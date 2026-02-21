/**
 * Session-plan and slot-category API response helpers.
 */
export function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function created(res, data) {
  return res.status(201).json({ success: true, data });
}

export function notFound(res, msg = "Not found") {
  return res.status(404).json({ success: false, error: msg });
}

export function badReq(res, msg = "Bad request") {
  return res.status(400).json({ success: false, error: msg });
}

export function err(res, e) {
  console.error(e);
  return res.status(500).json({ success: false, error: "Server error" });
}
