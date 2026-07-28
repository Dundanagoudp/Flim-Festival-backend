/**
 * Generates Postman Collection v2.1 for Arunachal Film Festival Backend
 * Run: node generate-collection.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SAMPLE_OID = "507f1f77bcf86cd799439011";

const errResponses = [
  { name: "400 Bad Request", status: "Bad Request", code: 400, body: { success: false, message: "Bad request / validation failed" } },
  { name: "401 Unauthorized", status: "Unauthorized", code: 401, body: { success: false, message: "Not authorized, no token provided" } },
  { name: "403 Forbidden", status: "Forbidden", code: 403, body: { success: false, message: "You do not have permission to perform this action" } },
  { name: "404 Not Found", status: "Not Found", code: 404, body: { success: false, message: "Resource not found" } },
  { name: "500 Internal Server Error", status: "Internal Server Error", code: 500, body: { success: false, message: "Server error" } },
];

function makeResponses(successBody, successCode = 200, successName = "200 OK") {
  const success = {
    name: successName,
    originalRequest: undefined,
    status: successCode === 201 ? "Created" : "OK",
    code: successCode,
    _postman_previewlanguage: "json",
    header: [{ key: "Content-Type", value: "application/json" }],
    body: JSON.stringify(successBody, null, 2),
  };
  return [
    success,
    ...errResponses.map((e) => ({
      name: e.name,
      status: e.status,
      code: e.code,
      _postman_previewlanguage: "json",
      header: [{ key: "Content-Type", value: "application/json" }],
      body: JSON.stringify(e.body, null, 2),
    })),
  ];
}

function urlObj(rawPath, query = []) {
  const clean = rawPath.replace(/^\//, "");
  const segments = clean.split("/").filter(Boolean);
  const pathSegments = segments.map((s) => {
    if (s.startsWith(":")) return `{{${s.slice(1)}}}`;
    if (s.startsWith("{{")) return s;
    return s;
  });
  const variable = segments
    .filter((s) => s.startsWith(":"))
    .map((s) => ({
      key: s.slice(1),
      value: SAMPLE_OID,
    }));

  const q = query.map((qItem) => ({
    key: qItem.key,
    value: qItem.value ?? "",
    description: qItem.description || "",
    disabled: qItem.disabled ?? false,
  }));

  return {
    raw: `{{baseUrl}}/${pathSegments.join("/")}${q.length ? `?${q.filter((x) => !x.disabled).map((x) => `${x.key}=${x.value}`).join("&")}` : ""}`,
    host: ["{{baseUrl}}"],
    path: pathSegments,
    ...(q.length ? { query: q } : {}),
    ...(variable.length ? { variable } : {}),
  };
}

function jsonBody(obj) {
  return {
    mode: "raw",
    raw: JSON.stringify(obj, null, 2),
    options: { raw: { language: "json" } },
  };
}

function formdataBody(fields) {
  return {
    mode: "formdata",
    formdata: fields.map((f) => ({
      key: f.key,
      value: f.type === "file" ? undefined : (f.value ?? ""),
      src: f.type === "file" ? [] : undefined,
      type: f.type || "text",
      description: f.description || "",
      ...(f.disabled ? { disabled: true } : {}),
    })),
  };
}

function reqItem({
  name,
  description,
  method,
  path: p,
  auth = false,
  admin = false,
  body,
  formdata,
  query,
  events,
  successBody = { success: true, message: "OK" },
  successCode = 200,
}) {
  const headers = [];
  if (body && !formdata) {
    headers.push({ key: "Content-Type", value: "application/json" });
  }
  if (auth) {
    headers.push({ key: "Authorization", value: "Bearer {{token}}" });
  }

  const request = {
    method,
    header: headers,
    url: urlObj(p, query),
    description: [
      description || name,
      auth ? "\n\n**Auth:** Bearer JWT required" + (admin ? " (admin/editor role)" : "") : "\n\n**Auth:** Public",
    ].join(""),
  };

  if (formdata) {
    request.body = formdataBody(formdata);
  } else if (body !== undefined) {
    request.body = jsonBody(body);
  }

  if (auth) {
    request.auth = {
      type: "bearer",
      bearer: [{ key: "token", value: "{{token}}", type: "string" }],
    };
  }

  const item = {
    name,
    request,
    response: makeResponses(successBody, successCode, successCode === 201 ? "201 Created" : "200 OK"),
  };

  if (events) item.event = events;

  return item;
}

const loginTestScript = {
  listen: "test",
  script: {
    type: "text/javascript",
    exec: [
      "if (pm.response.code === 200) {",
      "  // Token is set as httpOnly cookie by the API",
      "  const cookieToken = pm.cookies.get('token');",
      "  if (cookieToken) {",
      "    pm.collectionVariables.set('token', cookieToken);",
      "    console.log('Saved token from cookie');",
      "  }",
      "  try {",
      "    const json = pm.response.json();",
      "    if (json.token) pm.collectionVariables.set('token', json.token);",
      "    if (json.access_token) pm.collectionVariables.set('token', json.access_token);",
      "    if (json.data && json.data.token) pm.collectionVariables.set('token', json.data.token);",
      "  } catch (e) {}",
      "}",
    ],
  },
};

const folders = [];

// ─── Auth ───────────────────────────────────────────────────────────────────
folders.push({
  name: "Auth",
  description: "Authentication & user management (`/api/v1/auth`). Login sets httpOnly cookie; test script also saves `token` collection variable.",
  item: [
    reqItem({
      name: "Generate CAPTCHA (prerequisite)",
      description: "Get captchaId + captcha image before login. Mounted at /api/v1/captcha.",
      method: "GET",
      path: "/api/v1/captcha/generate",
      successBody: {
        success: true,
        captchaId: "abc123",
        svg: "<svg>...</svg>",
      },
      events: [
        {
          listen: "test",
          script: {
            type: "text/javascript",
            exec: [
              "try {",
              "  const j = pm.response.json();",
              "  if (j.captchaId) pm.collectionVariables.set('captchaId', j.captchaId);",
              "} catch(e) {}",
            ],
          },
        },
      ],
    }),
    reqItem({
      name: "Login",
      description: "Login with email, password, and CAPTCHA. Sets cookie `token`. Test script saves Bearer {{token}}.",
      method: "POST",
      path: "/api/v1/auth/login",
      body: {
        email: "admin@example.com",
        password: "Password@123",
        captchaId: "{{captchaId}}",
        captchaCode: "AB12",
      },
      successBody: { success: true, message: "Login successful" },
      events: [loginTestScript],
    }),
    reqItem({
      name: "Signup",
      description: "Public user registration. Accepts plain JSON or encryptedBody.",
      method: "POST",
      path: "/api/v1/auth/signup",
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "Password@123",
        confirmPassword: "Password@123",
      },
      successBody: { message: "User added successfully" },
      successCode: 201,
    }),
    reqItem({
      name: "Logout",
      description: "Clears auth cookie.",
      method: "POST",
      path: "/api/v1/auth/logout",
      successBody: { success: true, message: "Logged out successfully" },
    }),
    reqItem({
      name: "Get My Profile (auth)",
      description: "Get current authenticated user profile.",
      method: "GET",
      path: "/api/v1/auth/getMyProfile",
      auth: true,
      successBody: { _id: SAMPLE_OID, name: "Admin", email: "admin@example.com", role: "admin" },
    }),
    reqItem({
      name: "Get My Profile (/api/me)",
      description: "Alternate profile endpoint mounted at /api/me.",
      method: "GET",
      path: "/api/me",
      auth: true,
      successBody: { _id: SAMPLE_OID, name: "Admin", email: "admin@example.com", role: "admin" },
    }),
    reqItem({
      name: "Edit User",
      description: "Update user by ID (self or elevated privileges).",
      method: "PUT",
      path: "/api/v1/auth/editUser/:userId",
      auth: true,
      body: {
        name: "Updated Name",
        email: "updated@example.com",
        password: "NewPassword@123",
        confirmPassword: "NewPassword@123",
        role: "editor",
      },
    }),
    reqItem({
      name: "Add User (Admin)",
      description: "Admin creates a user.",
      method: "POST",
      path: "/api/v1/auth/addUser",
      auth: true,
      admin: true,
      body: {
        name: "New User",
        email: "newuser@example.com",
        password: "Password@123",
        confirmPassword: "Password@123",
      },
      successCode: 201,
      successBody: { message: "User added successfully" },
    }),
    reqItem({
      name: "Get All Users (Admin)",
      method: "GET",
      path: "/api/v1/auth/getUsers",
      auth: true,
      admin: true,
      successBody: [{ _id: SAMPLE_OID, name: "Admin", email: "admin@example.com", role: "admin" }],
    }),
    reqItem({
      name: "Delete User (Admin)",
      method: "DELETE",
      path: "/api/v1/auth/deleteUser/:userId",
      auth: true,
      admin: true,
      successBody: { message: "User deleted successfully" },
    }),
  ],
});

// ─── Gallery ────────────────────────────────────────────────────────────────
folders.push({
  name: "Gallery",
  description: "Gallery years, days, and images (`/api/v1/gallery`).",
  item: [
    reqItem({
      name: "Add Gallery Images",
      method: "POST",
      path: "/api/v1/gallery/addimages",
      auth: true,
      admin: true,
      formdata: [
        { key: "caption", value: "Festival opening night", type: "text" },
        { key: "year", value: SAMPLE_OID, type: "text", description: "Year ObjectId" },
        { key: "day", value: SAMPLE_OID, type: "text", description: "Day ObjectId (optional)" },
        { key: "photo", type: "file", description: "Single image" },
        { key: "photos", type: "file", description: "Multiple images" },
      ],
      successCode: 201,
    }),
    reqItem({ name: "Get Gallery Year-wise", method: "GET", path: "/api/v1/gallery/gallery-yearwise" }),
    reqItem({
      name: "Get All Gallery (by year)",
      method: "GET",
      path: "/api/v1/gallery/getallgallery",
      query: [
        { key: "year", value: "2025", description: "Year value" },
        { key: "yearId", value: SAMPLE_OID, description: "Year ObjectId", disabled: true },
        { key: "dayId", value: SAMPLE_OID, description: "Day ObjectId", disabled: true },
      ],
    }),
    reqItem({ name: "Delete Gallery Image", method: "DELETE", path: "/api/v1/gallery/deletegallery/:id", auth: true, admin: true }),
    reqItem({
      name: "Bulk Delete Images",
      method: "DELETE",
      path: "/api/v1/gallery/bulkdeleteimages",
      auth: true,
      admin: true,
      body: { imageIds: [SAMPLE_OID, "507f1f77bcf86cd799439012"] },
    }),
    reqItem({
      name: "Create Year",
      method: "POST",
      path: "/api/v1/gallery/gallerycreateYear",
      auth: true,
      admin: true,
      body: { value: 2025, name: "AFF 2025", active: true },
      successCode: 201,
    }),
    reqItem({
      name: "Update Year",
      method: "PUT",
      path: "/api/v1/gallery/updateyear/:id",
      auth: true,
      admin: true,
      body: { value: 2025, name: "AFF 2025 Updated", active: true },
    }),
    reqItem({ name: "Delete Year", method: "DELETE", path: "/api/v1/gallery/deleteyear/:id", auth: true, admin: true }),
    reqItem({ name: "Get All Years", method: "GET", path: "/api/v1/gallery/getallyear" }),
    reqItem({
      name: "Get Days By Year",
      method: "GET",
      path: "/api/v1/gallery/getdaysbyyear",
      query: [{ key: "yearId", value: SAMPLE_OID }],
    }),
    reqItem({
      name: "Create Day",
      method: "POST",
      path: "/api/v1/gallery/gallerycreateDay",
      auth: true,
      admin: true,
      body: { yearId: SAMPLE_OID, name: "Day 1", date: "2025-11-20", order: 1 },
      successCode: 201,
    }),
    reqItem({
      name: "Update Day",
      method: "PUT",
      path: "/api/v1/gallery/updateday/:id",
      auth: true,
      admin: true,
      body: { name: "Day 1 Updated", date: "2025-11-20", order: 1 },
    }),
    reqItem({ name: "Delete Day", method: "DELETE", path: "/api/v1/gallery/deleteday/:id", auth: true, admin: true }),
  ],
});

// ─── Guest ──────────────────────────────────────────────────────────────────
folders.push({
  name: "Guest",
  description: "Guest years and guests (`/api/v1/guest`).",
  item: [
    reqItem({ name: "Create Year", method: "POST", path: "/api/v1/guest/createYear", auth: true, admin: true, body: { value: 2025 }, successCode: 201 }),
    reqItem({ name: "Get All Years", method: "GET", path: "/api/v1/guest/years" }),
    reqItem({ name: "Update Year", method: "PUT", path: "/api/v1/guest/years/:id", auth: true, admin: true, body: { value: 2025, active: true } }),
    reqItem({ name: "Delete Year", method: "DELETE", path: "/api/v1/guest/years/:id", auth: true, admin: true }),
    reqItem({
      name: "Add Guest",
      method: "POST",
      path: "/api/v1/guest/addguests",
      auth: true,
      admin: true,
      formdata: [
        { key: "name", value: "Adoor Gopalakrishnan", type: "text" },
        { key: "role", value: "Director", type: "text" },
        { key: "age", value: "80", type: "text" },
        { key: "description", value: "Legendary filmmaker", type: "text" },
        { key: "year", value: SAMPLE_OID, type: "text" },
        { key: "movies", value: '["Elippathayam","Swayamvaram"]', type: "text" },
        { key: "photo", type: "file" },
      ],
      successCode: 201,
    }),
    reqItem({
      name: "Get All Guests",
      method: "GET",
      path: "/api/v1/guest/allguests",
      query: [
        { key: "year", value: SAMPLE_OID, disabled: true },
        { key: "groupBy", value: "year", disabled: true },
      ],
    }),
    reqItem({ name: "Get Guests Year-wise", method: "GET", path: "/api/v1/guest/guests-yearwise" }),
    reqItem({ name: "Get Single Guest", method: "GET", path: "/api/v1/guest/guests/:id" }),
    reqItem({
      name: "Update Guest",
      method: "PUT",
      path: "/api/v1/guest/guests/:id",
      auth: true,
      admin: true,
      formdata: [
        { key: "name", value: "Updated Guest", type: "text" },
        { key: "role", value: "Actor", type: "text" },
        { key: "age", value: "45", type: "text" },
        { key: "description", value: "Updated bio", type: "text" },
        { key: "year", value: SAMPLE_OID, type: "text" },
        { key: "photo", type: "file" },
      ],
    }),
    reqItem({ name: "Delete Guest", method: "DELETE", path: "/api/v1/guest/guests/:id", auth: true, admin: true }),
    reqItem({ name: "Get Guests By Year", method: "GET", path: "/api/v1/guest/guests/year/:yearId" }),
  ],
});

// ─── Awards ─────────────────────────────────────────────────────────────────
folders.push({
  name: "Awards",
  description: "Award categories and awards (`/api/v1/awards`).",
  item: [
    reqItem({ name: "Create Category", method: "POST", path: "/api/v1/awards/categoryCreate", auth: true, admin: true, body: { name: "Best Feature Film" }, successCode: 201 }),
    reqItem({ name: "Get All Categories", method: "GET", path: "/api/v1/awards/getAllCategories" }),
    reqItem({ name: "Update Category", method: "PUT", path: "/api/v1/awards/updateCategory/:id", auth: true, admin: true, body: { name: "Best Documentary" } }),
    reqItem({ name: "Delete Category", method: "DELETE", path: "/api/v1/awards/deleteCategory/:id", auth: true, admin: true }),
    reqItem({
      name: "Create Award",
      method: "POST",
      path: "/api/v1/awards/createAwards",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "Golden Hornbill", type: "text" },
        { key: "description", value: "Top festival award", type: "text" },
        { key: "rule1", value: "Must be Arunachal related", type: "text" },
        { key: "rule2", value: "Runtime under 120 min", type: "text" },
        { key: "rule3", value: "Premiered after 2024", type: "text" },
        { key: "category", value: SAMPLE_OID, type: "text" },
        { key: "image", type: "file" },
        { key: "array_images", type: "file" },
      ],
      successCode: 201,
    }),
    reqItem({
      name: "Get All Awards",
      method: "GET",
      path: "/api/v1/awards/getAllAwards",
      query: [{ key: "category", value: SAMPLE_OID, disabled: true }],
    }),
    reqItem({ name: "Get Award By Id", method: "GET", path: "/api/v1/awards/getAwardsById/:id" }),
    reqItem({
      name: "Update Award",
      method: "PUT",
      path: "/api/v1/awards/updateAwards/:id",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "Golden Hornbill Updated", type: "text" },
        { key: "description", value: "Updated description", type: "text" },
        { key: "rule1", value: "Rule 1", type: "text" },
        { key: "rule2", value: "Rule 2", type: "text" },
        { key: "rule3", value: "Rule 3", type: "text" },
        { key: "category", value: SAMPLE_OID, type: "text" },
        { key: "image", type: "file" },
        { key: "array_images", type: "file" },
      ],
    }),
    reqItem({ name: "Delete Award", method: "DELETE", path: "/api/v1/awards/deleteAwards/:id", auth: true, admin: true }),
  ],
});

// ─── Events Schedule ────────────────────────────────────────────────────────
folders.push({
  name: "Events Schedule",
  description: "Event schedule, days, times (`/api/v1/events-schedule`).",
  item: [
    reqItem({
      name: "Add Event",
      method: "POST",
      path: "/api/v1/events-schedule/addEvent",
      auth: true,
      admin: true,
      formdata: [
        { key: "name", value: "Arunachal Film Festival 2025", type: "text" },
        { key: "description", value: "Annual film festival", type: "text" },
        { key: "year", value: "2025", type: "text" },
        { key: "month", value: "November", type: "text" },
        { key: "startDate", value: "2025-11-20", type: "text" },
        { key: "endDate", value: "2025-11-25", type: "text" },
        { key: "location", value: "Itanagar", type: "text" },
        { key: "image", type: "file" },
      ],
      successCode: 201,
    }),
    reqItem({
      name: "Update Event",
      method: "PUT",
      path: "/api/v1/events-schedule/updateEvent/:eventId",
      auth: true,
      admin: true,
      formdata: [
        { key: "name", value: "AFF 2025 Updated", type: "text" },
        { key: "description", value: "Updated", type: "text" },
        { key: "year", value: "2025", type: "text" },
        { key: "month", value: "November", type: "text" },
        { key: "startDate", value: "2025-11-20", type: "text" },
        { key: "endDate", value: "2025-11-25", type: "text" },
        { key: "location", value: "Itanagar", type: "text" },
        { key: "image", type: "file" },
      ],
    }),
    reqItem({
      name: "Update Event Day",
      method: "PUT",
      path: "/api/v1/events-schedule/updateEventDay/:eventDayId",
      auth: true,
      body: { name: "Day 1", description: "Opening day" },
    }),
    reqItem({
      name: "Update Event Day With Image",
      method: "PUT",
      path: "/api/v1/events-schedule/updateEventDayWithImage/:eventDayId",
      auth: true,
      admin: true,
      formdata: [
        { key: "name", value: "Day 1", type: "text" },
        { key: "description", value: "Opening day", type: "text" },
        { key: "image", type: "file" },
      ],
    }),
    reqItem({
      name: "Upload Event Day Image",
      method: "POST",
      path: "/api/v1/events-schedule/uploadEventDayImage/:eventDayId",
      auth: true,
      admin: true,
      formdata: [{ key: "image", type: "file" }],
    }),
    reqItem({
      name: "Delete Event Day Image",
      method: "DELETE",
      path: "/api/v1/events-schedule/deleteEventDayImage/:eventDayId",
      auth: true,
      admin: true,
    }),
    reqItem({
      name: "Add Time Slot",
      method: "POST",
      path: "/api/v1/events-schedule/addTime/:eventId/day/:eventDay_ref",
      auth: true,
      admin: true,
      body: {
        startTime: "10:00",
        endTime: "12:00",
        title: "Opening Ceremony",
        description: "Inauguration",
        type: "ceremony",
        location: "Main Hall",
      },
      successCode: 201,
    }),
    reqItem({
      name: "Update Time Slot",
      method: "PUT",
      path: "/api/v1/events-schedule/updateTime/day/:day_ref/time/:timeId",
      auth: true,
      body: {
        startTime: "10:30",
        endTime: "12:30",
        title: "Opening Ceremony Updated",
        description: "Updated",
        type: "ceremony",
        location: "Main Hall",
      },
    }),
    reqItem({ name: "Delete Event", method: "DELETE", path: "/api/v1/events-schedule/deleteEvent/:eventId", auth: true, admin: true }),
    reqItem({ name: "Get Events", method: "GET", path: "/api/v1/events-schedule/getEvent" }),
    reqItem({ name: "Get Total Events", method: "GET", path: "/api/v1/events-schedule/totalEvent" }),
    reqItem({
      name: "Get Event Day",
      method: "GET",
      path: "/api/v1/events-schedule/getEventDay",
      auth: true,
      query: [{ key: "eventId", value: SAMPLE_OID }],
    }),
    reqItem({ name: "Delete Time Slot", method: "DELETE", path: "/api/v1/events-schedule/deleteTime/:timeId", auth: true, admin: true }),
    reqItem({ name: "Get Time Slots", method: "GET", path: "/api/v1/events-schedule/getTime", auth: true }),
    reqItem({ name: "Get Full Event Details", method: "GET", path: "/api/v1/events-schedule/getFullEvent" }),
    reqItem({ name: "Get Event By Id", method: "GET", path: "/api/v1/events-schedule/event/:eventId" }),
    reqItem({ name: "Get Today Or Latest Event", method: "GET", path: "/api/v1/events-schedule/today-or-latest" }),
    reqItem({ name: "Get Event Details By Id", method: "GET", path: "/api/v1/events-schedule/eventDetails/:eventId" }),
  ],
});

// ─── Registration ───────────────────────────────────────────────────────────
folders.push({
  name: "Registration",
  description: "Public registrations (`/api/v1/registration`).",
  item: [
    reqItem({
      name: "Create Registration",
      method: "POST",
      path: "/api/v1/registration/createRegistration",
      body: {
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "+919876543210",
        message: "I would like to register for the festival.",
      },
      successCode: 201,
    }),
    reqItem({ name: "Get All Registrations", method: "GET", path: "/api/v1/registration/getAllRegistration" }),
    reqItem({ name: "Get Registration By Id", method: "GET", path: "/api/v1/registration/getRegistrationById/:id" }),
    reqItem({
      name: "Update Registration (contacted)",
      method: "PUT",
      path: "/api/v1/registration/updateRegistrationById/:id",
      auth: true,
      admin: true,
      body: { contacted: true },
    }),
    reqItem({ name: "Delete Registration", method: "DELETE", path: "/api/v1/registration/deleteRegistartionById/:id", auth: true, admin: true }),
  ],
});

// ─── Submission ─────────────────────────────────────────────────────────────
folders.push({
  name: "Submission",
  description: "Film submissions with video upload (`/api/v1/submission`).",
  item: [
    reqItem({
      name: "Create Submission",
      method: "POST",
      path: "/api/v1/submission/createSubmission",
      formdata: [
        { key: "fullName", value: "Ravi Kumar", type: "text" },
        { key: "email", value: "ravi@example.com", type: "text" },
        { key: "phone", value: "+919811122233", type: "text" },
        { key: "videoType", value: "short_film", type: "text" },
        { key: "message", value: "Please consider my short film.", type: "text" },
        { key: "videoFile", type: "file", description: "Video file" },
      ],
      successCode: 201,
    }),
    reqItem({ name: "Get All Submissions", method: "GET", path: "/api/v1/submission/getAllSubmission" }),
    reqItem({ name: "Get Submission By Id", method: "GET", path: "/api/v1/submission/getSubmissionById/:id" }),
    reqItem({
      name: "Update Submission",
      method: "PUT",
      path: "/api/v1/submission/updateSubmissionById/:id",
      auth: true,
      admin: true,
      body: {
        fullName: "Ravi Kumar",
        email: "ravi@example.com",
        phone: "+919811122233",
        videoType: "documentary",
        message: "Updated message",
      },
    }),
    reqItem({ name: "Delete Submission", method: "DELETE", path: "/api/v1/submission/deleteSubmissionById/:id", auth: true, admin: true }),
  ],
});

// ─── Blogs ──────────────────────────────────────────────────────────────────
folders.push({
  name: "Blogs",
  description: "Blog categories and posts (`/api/v1/blogs`).",
  item: [
    reqItem({ name: "Create Category", method: "POST", path: "/api/v1/blogs/categoryCreate", auth: true, admin: true, body: { name: "News" }, successCode: 201 }),
    reqItem({ name: "Get All Categories", method: "GET", path: "/api/v1/blogs/getallcategory" }),
    reqItem({ name: "Update Category", method: "PUT", path: "/api/v1/blogs/updatecategory/:id", auth: true, admin: true, body: { name: "Festival News" } }),
    reqItem({ name: "Delete Category", method: "DELETE", path: "/api/v1/blogs/deletecategory/:id", auth: true, admin: true }),
    reqItem({
      name: "Create Blog",
      method: "POST",
      path: "/api/v1/blogs/createblog",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "Festival Opens Tomorrow", type: "text" },
        { key: "contentType", value: "blog", type: "text", description: "blog | link" },
        { key: "publishedDate", value: "2025-11-19", type: "text" },
        { key: "contents", value: "<p>Full article HTML content</p>", type: "text" },
        { key: "link", value: "https://example.com/article", type: "text", description: "Required if contentType=link" },
        { key: "category", value: SAMPLE_OID, type: "text" },
        { key: "author", value: "Editorial Team", type: "text" },
        { key: "image", type: "file" },
      ],
      successCode: 201,
    }),
    reqItem({
      name: "Get All Blogs",
      method: "GET",
      path: "/api/v1/blogs/getallblogs",
      query: [
        { key: "category", value: SAMPLE_OID, disabled: true },
        { key: "latest", value: "5", disabled: true },
        { key: "contentType", value: "blog", disabled: true, description: "blog | link" },
      ],
    }),
    reqItem({ name: "Get Latest Blogs", method: "GET", path: "/api/v1/blogs/getlatest" }),
    reqItem({ name: "Get Single Blog", method: "GET", path: "/api/v1/blogs/singleblog/:id" }),
    reqItem({
      name: "Update Blog",
      method: "PUT",
      path: "/api/v1/blogs/updateblogs/:id",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "Updated Title", type: "text" },
        { key: "contentType", value: "blog", type: "text" },
        { key: "contents", value: "<p>Updated content</p>", type: "text" },
        { key: "category", value: SAMPLE_OID, type: "text" },
        { key: "author", value: "Editorial", type: "text" },
        { key: "image", type: "file" },
      ],
    }),
    reqItem({ name: "Delete Blog", method: "DELETE", path: "/api/v1/blogs/deleteblog/:id", auth: true, admin: true }),
    reqItem({
      name: "Get Content Blog Posts Only",
      method: "GET",
      path: "/api/v1/blogs/contentblogs/posts",
      query: [
        { key: "category", value: SAMPLE_OID, disabled: true },
        { key: "latest", value: "5", disabled: true },
      ],
    }),
    reqItem({
      name: "Get Link Blog Posts Only",
      method: "GET",
      path: "/api/v1/blogs/linkblogs/posts",
      query: [
        { key: "category", value: SAMPLE_OID, disabled: true },
        { key: "latest", value: "5", disabled: true },
      ],
    }),
  ],
});

// ─── About Us ───────────────────────────────────────────────────────────────
folders.push({
  name: "About Us",
  description: "About Us sections (`/api/v1/aboutus`).",
  item: [
    reqItem({ name: "Get Banner", method: "GET", path: "/api/v1/aboutus/banner" }),
    reqItem({
      name: "Create/Update Banner (POST)",
      method: "POST",
      path: "/api/v1/aboutus/banner",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "About Arunachal Film Festival", type: "text" },
        { key: "backgroundImage", type: "file" },
      ],
    }),
    reqItem({
      name: "Create/Update Banner (PUT)",
      method: "PUT",
      path: "/api/v1/aboutus/banner",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "About AFF", type: "text" },
        { key: "backgroundImage", type: "file" },
      ],
    }),
    reqItem({
      name: "Update Banner By Id",
      method: "PUT",
      path: "/api/v1/aboutus/banner/:id",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "Updated Banner", type: "text" },
        { key: "backgroundImage", type: "file" },
      ],
    }),
    reqItem({ name: "Delete Banner", method: "DELETE", path: "/api/v1/aboutus/banner", auth: true, admin: true }),
    reqItem({ name: "Delete Banner By Id", method: "DELETE", path: "/api/v1/aboutus/banner/:id", auth: true, admin: true }),
    reqItem({ name: "Get Statistics", method: "GET", path: "/api/v1/aboutus/statistics" }),
    reqItem({
      name: "Create/Update Statistics (POST)",
      method: "POST",
      path: "/api/v1/aboutus/statistics",
      formdata: [
        { key: "years", value: "10", type: "text" },
        { key: "films", value: "500", type: "text" },
        { key: "countries", value: "40", type: "text" },
        { key: "image", type: "file" },
      ],
    }),
    reqItem({
      name: "Create/Update Statistics (PUT)",
      method: "PUT",
      path: "/api/v1/aboutus/statistics",
      formdata: [
        { key: "years", value: "10", type: "text" },
        { key: "films", value: "500", type: "text" },
        { key: "countries", value: "40", type: "text" },
        { key: "image", type: "file" },
      ],
    }),
    reqItem({
      name: "Update Statistics By Id",
      method: "PUT",
      path: "/api/v1/aboutus/statistics/:id",
      formdata: [
        { key: "years", value: "11", type: "text" },
        { key: "films", value: "550", type: "text" },
        { key: "countries", value: "45", type: "text" },
        { key: "image", type: "file" },
      ],
    }),
    reqItem({ name: "Delete Statistics", method: "DELETE", path: "/api/v1/aboutus/statistics" }),
    reqItem({ name: "Delete Statistics By Id", method: "DELETE", path: "/api/v1/aboutus/statistics/:id" }),
    reqItem({ name: "Get Introduction (Look Inside)", method: "GET", path: "/api/v1/aboutus/introduction" }),
    reqItem({
      name: "Create/Update Introduction (POST)",
      method: "POST",
      path: "/api/v1/aboutus/introduction",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "Look Inside", type: "text" },
        { key: "description", value: "A glimpse into the festival", type: "text" },
        { key: "image", type: "file" },
      ],
    }),
    reqItem({
      name: "Create/Update Introduction (PUT)",
      method: "PUT",
      path: "/api/v1/aboutus/introduction",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "Look Inside", type: "text" },
        { key: "description", value: "Updated description", type: "text" },
        { key: "image", type: "file" },
      ],
    }),
    reqItem({
      name: "Update Introduction By Id",
      method: "PUT",
      path: "/api/v1/aboutus/introduction/:id",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "Look Inside Updated", type: "text" },
        { key: "description", value: "Updated", type: "text" },
        { key: "image", type: "file" },
      ],
    }),
    reqItem({ name: "Delete Introduction", method: "DELETE", path: "/api/v1/aboutus/introduction", auth: true, admin: true }),
    reqItem({ name: "Delete Introduction By Id", method: "DELETE", path: "/api/v1/aboutus/introduction/:id", auth: true, admin: true }),
    reqItem({ name: "Get About Items", method: "GET", path: "/api/v1/aboutus/items" }),
    reqItem({
      name: "Create About Item",
      method: "POST",
      path: "/api/v1/aboutus/items",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "Our Journey", type: "text" },
        { key: "subtitle", value: "Since 2015", type: "text" },
        { key: "description", value: "Celebrating cinema of the Northeast", type: "text" },
        { key: "index", value: "0", type: "text" },
        { key: "images", type: "file", description: "Up to 10 images" },
      ],
      successCode: 201,
    }),
    reqItem({
      name: "Update About Item",
      method: "PUT",
      path: "/api/v1/aboutus/items/:id",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "Our Journey Updated", type: "text" },
        { key: "subtitle", value: "Since 2015", type: "text" },
        { key: "description", value: "Updated", type: "text" },
        { key: "index", value: "0", type: "text" },
        { key: "removeImageIndex", value: "0", type: "text", description: "Optional index to remove" },
        { key: "images", type: "file" },
      ],
    }),
    reqItem({ name: "Delete About Item", method: "DELETE", path: "/api/v1/aboutus/items/:id", auth: true, admin: true }),
  ],
});

// ─── Videos ─────────────────────────────────────────────────────────────────
folders.push({
  name: "Videos",
  description: "Video blogs – YouTube or uploaded (`/api/v1/videos`).",
  item: [
    reqItem({
      name: "Add Video Blog (YouTube)",
      method: "POST",
      path: "/api/v1/videos/addVideoBLog",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "Festival Trailer", type: "text" },
        { key: "videoType", value: "youtube", type: "text", description: "youtube | video" },
        { key: "addedAt", value: "2025-11-01", type: "text" },
        { key: "youtubeUrl", value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", type: "text" },
      ],
      successCode: 201,
    }),
    reqItem({
      name: "Add Video Blog (Upload)",
      method: "POST",
      path: "/api/v1/videos/addVideoBLog",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "Behind the Scenes", type: "text" },
        { key: "videoType", value: "video", type: "text" },
        { key: "addedAt", value: "2025-11-01", type: "text" },
        { key: "video", type: "file" },
        { key: "thumbnail", type: "file" },
      ],
      successCode: 201,
    }),
    reqItem({ name: "Get All Video Blogs", method: "GET", path: "/api/v1/videos/getVideoBlog" }),
    reqItem({ name: "Get YouTube Videos", method: "GET", path: "/api/v1/videos/getYoutubeVideo" }),
    reqItem({ name: "Get Uploaded Videos", method: "GET", path: "/api/v1/videos/getuploadedVideo" }),
    reqItem({ name: "Get Uploaded Video By Id", method: "GET", path: "/api/v1/videos/getuploadedVideoById/:videoId" }),
    reqItem({ name: "Get Video By Id", method: "GET", path: "/api/v1/videos/getVideoById/:videoId" }),
    reqItem({
      name: "Update Video",
      method: "PUT",
      path: "/api/v1/videos/updateVideo/:videoId",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "Updated Trailer", type: "text" },
        { key: "videoType", value: "youtube", type: "text" },
        { key: "addedAt", value: "2025-11-02", type: "text" },
        { key: "youtubeUrl", value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", type: "text" },
        { key: "video", type: "file" },
        { key: "thumbnail", type: "file" },
      ],
    }),
    reqItem({ name: "Delete Video", method: "DELETE", path: "/api/v1/videos/deleteVideo/:videoId", auth: true, admin: true }),
  ],
});

// ─── Workshop ───────────────────────────────────────────────────────────────
folders.push({
  name: "Workshop",
  description: "Workshops and categories (`/api/v1/workshop`).",
  item: [
    reqItem({
      name: "Add Workshop",
      method: "POST",
      path: "/api/v1/workshop/addWorkshop",
      auth: true,
      admin: true,
      formdata: [
        { key: "name", value: "Screenwriting Masterclass", type: "text" },
        { key: "about", value: "Learn story structure", type: "text" },
        { key: "registrationFormUrl", value: "https://forms.example.com/workshop", type: "text" },
        { key: "categoryId", value: SAMPLE_OID, type: "text" },
        { key: "imageUrl", type: "file" },
      ],
      successCode: 201,
    }),
    reqItem({
      name: "Update Workshop",
      method: "PUT",
      path: "/api/v1/workshop/updateWorkshop/:workshopId",
      auth: true,
      admin: true,
      formdata: [
        { key: "name", value: "Updated Workshop", type: "text" },
        { key: "about", value: "Updated about", type: "text" },
        { key: "registrationFormUrl", value: "https://forms.example.com/workshop", type: "text" },
        { key: "categoryId", value: SAMPLE_OID, type: "text" },
        { key: "imageUrl", type: "file" },
      ],
    }),
    reqItem({ name: "Delete Workshop", method: "DELETE", path: "/api/v1/workshop/deleteWorkshop/:workshopId", auth: true, admin: true }),
    reqItem({
      name: "Get Workshops",
      method: "GET",
      path: "/api/v1/workshop/getWorkshop",
      query: [
        { key: "categoryId", value: SAMPLE_OID, disabled: true },
        { key: "groupByCategory", value: "true", disabled: true },
      ],
    }),
    reqItem({
      name: "Add Category",
      method: "POST",
      path: "/api/v1/workshop/addCategory",
      auth: true,
      admin: true,
      body: { name: "Masterclass", order: 1 },
      successCode: 201,
    }),
    reqItem({ name: "Get Categories", method: "GET", path: "/api/v1/workshop/getCategories" }),
    reqItem({
      name: "Update Category",
      method: "PUT",
      path: "/api/v1/workshop/updateCategory/:categoryId",
      auth: true,
      admin: true,
      body: { name: "Masterclass Updated", order: 2 },
    }),
    reqItem({ name: "Delete Category", method: "DELETE", path: "/api/v1/workshop/deleteCategory/:categoryId", auth: true, admin: true }),
  ],
});

// ─── Dashboard ──────────────────────────────────────────────────────────────
folders.push({
  name: "Dashboard",
  description: "Admin dashboard analytics (`/api/v1/dashboard`).",
  item: [
    reqItem({
      name: "Overview",
      method: "GET",
      path: "/api/v1/dashboard/overview",
      query: [{ key: "period", value: "6months", description: "e.g. 6months" }],
    }),
    reqItem({
      name: "Area Chart",
      method: "GET",
      path: "/api/v1/dashboard/area-chart",
      query: [{ key: "period", value: "6months" }],
    }),
    reqItem({
      name: "Bar Chart",
      method: "GET",
      path: "/api/v1/dashboard/bar-chart",
      query: [{ key: "period", value: "6months" }],
    }),
    reqItem({
      name: "Pie Chart",
      method: "GET",
      path: "/api/v1/dashboard/pie-chart",
      query: [{ key: "month", value: "current" }],
    }),
    reqItem({
      name: "Radar Chart",
      method: "GET",
      path: "/api/v1/dashboard/radar-chart",
      query: [{ key: "period", value: "6months" }],
    }),
    reqItem({ name: "Quick Actions", method: "GET", path: "/api/v1/dashboard/quick-actions" }),
    reqItem({ name: "Get Settings", method: "GET", path: "/api/v1/dashboard/settings" }),
    reqItem({
      name: "Update Settings",
      method: "PUT",
      path: "/api/v1/dashboard/settings",
      body: {
        refreshInterval: 300000,
        chartTypes: { area: true, bar: true, pie: true, radar: true },
        isActive: true,
      },
    }),
  ],
});

// ─── Nominations ────────────────────────────────────────────────────────────
folders.push({
  name: "Nominations",
  description: "Nominations (`/api/v1/nominations`). Types: short_film | documentary.",
  item: [
    reqItem({
      name: "Create Nomination",
      method: "POST",
      path: "/api/v1/nominations",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "River Stories", type: "text" },
        { key: "description", value: "A short film about rivers", type: "text" },
        { key: "type", value: "short_film", type: "text", description: "short_film | documentary" },
        { key: "image", type: "file" },
      ],
      successCode: 201,
      successBody: { message: "Nomination created successfully" },
    }),
    reqItem({
      name: "List Nominations",
      method: "GET",
      path: "/api/v1/nominations",
      query: [
        { key: "type", value: "short_film", disabled: true },
        { key: "q", value: "river", disabled: true, description: "Search" },
        { key: "page", value: "1" },
        { key: "limit", value: "10" },
        { key: "sort", value: "-createdAt" },
      ],
    }),
    reqItem({ name: "Get Nomination By Id", method: "GET", path: "/api/v1/nominations/:id" }),
    reqItem({
      name: "Update Nomination",
      method: "PUT",
      path: "/api/v1/nominations/:id",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "River Stories Updated", type: "text" },
        { key: "description", value: "Updated", type: "text" },
        { key: "type", value: "documentary", type: "text" },
        { key: "image", type: "file" },
      ],
    }),
    reqItem({ name: "Delete Nomination", method: "DELETE", path: "/api/v1/nominations/:id", auth: true, admin: true }),
  ],
});

// ─── Homepage ───────────────────────────────────────────────────────────────
folders.push({
  name: "Homepage",
  description: "Homepage hero entries (`/api/v1/homepage`).",
  item: [
    reqItem({
      name: "Create Homepage",
      method: "POST",
      path: "/api/v1/homepage",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "Arunachal Film Festival", type: "text" },
        { key: "description", value: "Celebrating cinema of the mountains", type: "text" },
        { key: "video", type: "file" },
      ],
      successCode: 201,
    }),
    reqItem({ name: "Get All Homepages", method: "GET", path: "/api/v1/homepage" }),
    reqItem({ name: "Get Homepage By Id", method: "GET", path: "/api/v1/homepage/:id" }),
    reqItem({
      name: "Update Homepage",
      method: "PUT",
      path: "/api/v1/homepage/:id",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "Updated Title", type: "text" },
        { key: "description", value: "Updated description", type: "text" },
        { key: "video", type: "file" },
      ],
    }),
    reqItem({ name: "Delete Homepage", method: "DELETE", path: "/api/v1/homepage/:id", auth: true, admin: true }),
  ],
});

// ─── Contact Us ─────────────────────────────────────────────────────────────
folders.push({
  name: "Contact Us",
  description: "Contact form (`/api/v1/contactus`).",
  item: [
    reqItem({
      name: "Create Contact Us",
      method: "POST",
      path: "/api/v1/contactus/createContactUs",
      body: {
        name: "Visitor Name",
        email: "visitor@example.com",
        phone: "+919900112233",
        subject: "Partnership Inquiry",
        message: "I would like to partner with the festival.",
      },
      successCode: 201,
    }),
    reqItem({ name: "Get All Contact Us", method: "GET", path: "/api/v1/contactus/getAllContactUs", auth: true, admin: true }),
    reqItem({ name: "Get Contact Us By Id", method: "GET", path: "/api/v1/contactus/getContactUsById/:id", auth: true, admin: true }),
    reqItem({
      name: "Update Contact Us",
      method: "PUT",
      path: "/api/v1/contactus/updateContactUsById/:id",
      auth: true,
      admin: true,
      body: { resolved: true },
    }),
    reqItem({ name: "Delete Contact Us", method: "DELETE", path: "/api/v1/contactus/deleteContactUsById/:id", auth: true, admin: true }),
  ],
});

// ─── Session Plans ──────────────────────────────────────────────────────────
folders.push({
  name: "Session Plans",
  description: "Session plans hierarchy: categories → plans → days → screens → slots (`/api/v1/session-plans`).",
  item: [
    {
      name: "Slot Categories",
      item: [
        reqItem({
          name: "List Categories",
          method: "GET",
          path: "/api/v1/session-plans/categories",
          query: [{ key: "visible", value: "true", disabled: true }],
        }),
        reqItem({
          name: "Create Category",
          method: "POST",
          path: "/api/v1/session-plans/categories",
          body: { name: "Film", order: 1, isVisible: true },
          successCode: 201,
          successBody: { success: true, data: { name: "Film" } },
        }),
        reqItem({ name: "Get Category By Id", method: "GET", path: "/api/v1/session-plans/categories/:categoryId" }),
        reqItem({
          name: "Update Category",
          method: "PUT",
          path: "/api/v1/session-plans/categories/:categoryId",
          body: { name: "Documentary", order: 2, isVisible: true },
        }),
        reqItem({ name: "Delete Category", method: "DELETE", path: "/api/v1/session-plans/categories/:categoryId" }),
      ],
    },
    {
      name: "Plans",
      item: [
        reqItem({
          name: "List Plans",
          method: "GET",
          path: "/api/v1/session-plans",
          query: [{ key: "visible", value: "true", disabled: true }],
        }),
        reqItem({
          name: "Create Plan",
          method: "POST",
          path: "/api/v1/session-plans",
          body: { year: 2025, festival: "Arunachal Film Festival", isVisible: true },
          successCode: 201,
        }),
        reqItem({ name: "Get Plan By Id", method: "GET", path: "/api/v1/session-plans/:planId" }),
        reqItem({
          name: "Update Plan",
          method: "PUT",
          path: "/api/v1/session-plans/:planId",
          body: { year: 2025, festival: "AFF 2025", isVisible: true },
        }),
        reqItem({ name: "Delete Plan", method: "DELETE", path: "/api/v1/session-plans/:planId" }),
      ],
    },
    {
      name: "Days",
      item: [
        reqItem({ name: "List Days", method: "GET", path: "/api/v1/session-plans/:planId/days" }),
        reqItem({
          name: "Create Day",
          method: "POST",
          path: "/api/v1/session-plans/:planId/days",
          body: { dayNumber: 1, date: "2025-11-20" },
          successCode: 201,
        }),
        reqItem({ name: "Get Day By Id", method: "GET", path: "/api/v1/session-plans/:planId/days/:dayId" }),
        reqItem({
          name: "Update Day",
          method: "PUT",
          path: "/api/v1/session-plans/:planId/days/:dayId",
          body: { dayNumber: 1, date: "2025-11-21" },
        }),
        reqItem({ name: "Delete Day", method: "DELETE", path: "/api/v1/session-plans/:planId/days/:dayId" }),
      ],
    },
    {
      name: "Screens",
      item: [
        reqItem({ name: "List Screens", method: "GET", path: "/api/v1/session-plans/:planId/days/:dayId/screens" }),
        reqItem({
          name: "Create Screen",
          method: "POST",
          path: "/api/v1/session-plans/:planId/days/:dayId/screens",
          body: { screenName: "Screen A" },
          successCode: 201,
        }),
        reqItem({ name: "Get Screen By Id", method: "GET", path: "/api/v1/session-plans/:planId/days/:dayId/screens/:screenId" }),
        reqItem({
          name: "Update Screen",
          method: "PUT",
          path: "/api/v1/session-plans/:planId/days/:dayId/screens/:screenId",
          body: { screenName: "Main Screen" },
        }),
        reqItem({ name: "Delete Screen", method: "DELETE", path: "/api/v1/session-plans/:planId/days/:dayId/screens/:screenId" }),
      ],
    },
    {
      name: "Slots",
      item: [
        reqItem({ name: "List Slots", method: "GET", path: "/api/v1/session-plans/:planId/days/:dayId/screens/:screenId/slots" }),
        reqItem({
          name: "Create Slot",
          method: "POST",
          path: "/api/v1/session-plans/:planId/days/:dayId/screens/:screenId/slots",
          body: {
            title: "Morning Screening",
            startTime: "10:00",
            endTime: "11:30",
            director: "Director Name",
            moderator: "Moderator Name",
            duration: "90 min",
            category: "Film",
            description: "Feature premiere",
            order: 1,
          },
          successCode: 201,
        }),
        reqItem({ name: "Get Slot By Id", method: "GET", path: "/api/v1/session-plans/:planId/days/:dayId/screens/:screenId/slots/:slotId" }),
        reqItem({
          name: "Update Slot",
          method: "PUT",
          path: "/api/v1/session-plans/:planId/days/:dayId/screens/:screenId/slots/:slotId",
          body: {
            title: "Updated Screening",
            startTime: "10:30",
            endTime: "12:00",
            director: "Director",
            category: "Documentary",
            order: 2,
          },
        }),
        reqItem({ name: "Delete Slot", method: "DELETE", path: "/api/v1/session-plans/:planId/days/:dayId/screens/:screenId/slots/:slotId" }),
      ],
    },
  ],
});

// ─── PDFs ───────────────────────────────────────────────────────────────────
folders.push({
  name: "PDFs",
  description: "PDF documents (`/api/v1/pdfs`).",
  item: [
    reqItem({
      name: "Upload PDF",
      method: "POST",
      path: "/api/v1/pdfs",
      formdata: [
        { key: "name", value: "Festival Brochure 2025", type: "text" },
        { key: "pdf", type: "file", description: "PDF file" },
      ],
      successCode: 201,
    }),
    reqItem({ name: "List PDFs", method: "GET", path: "/api/v1/pdfs" }),
    reqItem({ name: "Get PDF By Id", method: "GET", path: "/api/v1/pdfs/:id" }),
    reqItem({ name: "Preview PDF", method: "GET", path: "/api/v1/pdfs/:id/preview" }),
    reqItem({ name: "Download PDF", method: "GET", path: "/api/v1/pdfs/:id/download" }),
    reqItem({
      name: "Update PDF",
      method: "PUT",
      path: "/api/v1/pdfs/:id",
      formdata: [
        { key: "name", value: "Updated Brochure", type: "text" },
        { key: "pdf", type: "file" },
      ],
    }),
    reqItem({ name: "Delete PDF", method: "DELETE", path: "/api/v1/pdfs/:id" }),
  ],
});

// ─── Hero Banner ────────────────────────────────────────────────────────────
folders.push({
  name: "Hero Banner",
  description: "Homepage hero banner video (`/api/v1/hero-banner`).",
  item: [
    reqItem({ name: "Get Current Hero Banner", method: "GET", path: "/api/v1/hero-banner" }),
    reqItem({
      name: "Create/Update Hero Banner (POST)",
      method: "POST",
      path: "/api/v1/hero-banner",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "Arunachal Film Festival 2025", type: "text" },
        { key: "subtitle", value: "Cinema of the Mountains", type: "text" },
        { key: "video", type: "file" },
      ],
    }),
    reqItem({
      name: "Create/Update Hero Banner (PUT)",
      method: "PUT",
      path: "/api/v1/hero-banner",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "AFF 2025", type: "text" },
        { key: "subtitle", value: "Updated subtitle", type: "text" },
        { key: "video", type: "file" },
      ],
    }),
    reqItem({ name: "Delete Hero Banner", method: "DELETE", path: "/api/v1/hero-banner", auth: true, admin: true }),
  ],
});

// ─── Ticker Announcements ───────────────────────────────────────────────────
folders.push({
  name: "Ticker Announcements",
  description: "Scrolling ticker text (`/api/v1/ticker-announcements`).",
  item: [
    reqItem({ name: "List Announcements", method: "GET", path: "/api/v1/ticker-announcements" }),
    reqItem({
      name: "Create Announcement",
      method: "POST",
      path: "/api/v1/ticker-announcements",
      auth: true,
      admin: true,
      body: { text: "Registrations now open for AFF 2025!", order: 1 },
      successCode: 201,
    }),
    reqItem({ name: "Get Announcement By Id", method: "GET", path: "/api/v1/ticker-announcements/:id" }),
    reqItem({
      name: "Update Announcement",
      method: "PUT",
      path: "/api/v1/ticker-announcements/:id",
      auth: true,
      admin: true,
      body: { text: "Updated announcement text", order: 2 },
    }),
    reqItem({ name: "Delete Announcement", method: "DELETE", path: "/api/v1/ticker-announcements/:id", auth: true, admin: true }),
  ],
});

// ─── Curated ────────────────────────────────────────────────────────────────
folders.push({
  name: "Curated",
  description: "Curated sections, jury, and images (`/api/v1/curated`).",
  item: [
    reqItem({
      name: "Get Categories",
      method: "GET",
      path: "/api/v1/curated/categories",
      query: [{ key: "public", value: "true", disabled: true }],
    }),
    reqItem({
      name: "Create Category",
      method: "POST",
      path: "/api/v1/curated/category",
      auth: true,
      admin: true,
      body: { name: "Short Film", slug: "short-film", public: true, order: 1 },
      successCode: 201,
    }),
    reqItem({
      name: "Update Category",
      method: "PUT",
      path: "/api/v1/curated/category/:id",
      auth: true,
      admin: true,
      body: { name: "Documentary Film", slug: "documentary-film", public: true, order: 2 },
    }),
    reqItem({ name: "Delete Category", method: "DELETE", path: "/api/v1/curated/category/:id", auth: true, admin: true }),
    reqItem({ name: "Get Images Grouped", method: "GET", path: "/api/v1/curated/images/grouped" }),
    reqItem({
      name: "Get Images By Category",
      method: "GET",
      path: "/api/v1/curated/images",
      query: [{ key: "categoryId", value: SAMPLE_OID }],
    }),
    reqItem({ name: "Get All Jury", method: "GET", path: "/api/v1/curated/jury" }),
    reqItem({ name: "Get Section By Slug", method: "GET", path: "/api/v1/curated/sections/:slug" }),
    reqItem({ name: "Get Image By Id", method: "GET", path: "/api/v1/curated/image/:id" }),
    reqItem({
      name: "Upload Image",
      method: "POST",
      path: "/api/v1/curated/image",
      auth: true,
      admin: true,
      formdata: [
        { key: "category", value: SAMPLE_OID, type: "text" },
        { key: "title", value: "Jury Member / Film Title", type: "text" },
        { key: "order", value: "1", type: "text" },
        { key: "jury_name", value: "Jane Jury", type: "text" },
        { key: "designation", value: "Chairperson", type: "text" },
        { key: "short_bio", value: "Short bio", type: "text" },
        { key: "full_biography", value: "Full biography text", type: "text" },
        { key: "film_synopsis", value: "Film synopsis", type: "text" },
        { key: "display_order", value: "1", type: "text" },
        { key: "status", value: "active", type: "text" },
        { key: "image", type: "file" },
      ],
      successCode: 201,
    }),
    reqItem({
      name: "Update Image",
      method: "PUT",
      path: "/api/v1/curated/image/:id",
      auth: true,
      admin: true,
      formdata: [
        { key: "category", value: SAMPLE_OID, type: "text" },
        { key: "title", value: "Updated Title", type: "text" },
        { key: "order", value: "2", type: "text" },
        { key: "jury_name", value: "Updated Name", type: "text" },
        { key: "designation", value: "Member", type: "text" },
        { key: "short_bio", value: "Updated bio", type: "text" },
        { key: "image", type: "file" },
      ],
    }),
    reqItem({ name: "Delete Image", method: "DELETE", path: "/api/v1/curated/image/:id", auth: true, admin: true }),
  ],
});

// ─── Uploads ────────────────────────────────────────────────────────────────
folders.push({
  name: "Uploads",
  description: "Static / streamed upload files (`/api/v1/uploads`).",
  item: [
    reqItem({
      name: "Stream Video Blog Video",
      method: "GET",
      path: "/api/v1/uploads/VideoBlog/videos/:filename",
      successBody: "binary video stream",
    }),
    reqItem({
      name: "Get Video Blog Thumbnail",
      method: "GET",
      path: "/api/v1/uploads/VideoBlog/thumbnails/:filename",
    }),
  ],
});

// ─── Health ─────────────────────────────────────────────────────────────────
folders.push({
  name: "Health",
  description: "Root health check.",
  item: [
    reqItem({
      name: "Root Health Check",
      method: "GET",
      path: "/",
      successBody: "arunachal flim fetival backend is running",
    }),
  ],
});

function countItems(items) {
  let n = 0;
  for (const it of items) {
    if (it.item) n += countItems(it.item);
    else n += 1;
  }
  return n;
}

const collection = {
  info: {
    _postman_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "Arunachal Film Festival API",
    description:
      "Complete Postman Collection v2.1 for the Arunachal Film Festival backend (Node.js/Express).\n\n**Setup**\n1. Set `baseUrl` (default http://localhost:5000).\n2. Run Captcha → Login (saves `token` from cookie).\n3. Protected routes use `Authorization: Bearer {{token}}`.\n\n**Notes**\n- Login is rate-limited (5 attempts / 5 minutes).\n- Many auth bodies also accept encryptedBody `{ content, iv }`.\n- Replace path variable ObjectIds with real IDs from list responses.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5000", type: "string" },
    { key: "token", value: "", type: "string" },
    { key: "captchaId", value: "", type: "string" },
    { key: "userId", value: SAMPLE_OID, type: "string" },
    { key: "id", value: SAMPLE_OID, type: "string" },
    { key: "eventId", value: SAMPLE_OID, type: "string" },
    { key: "eventDayId", value: SAMPLE_OID, type: "string" },
    { key: "eventDay_ref", value: SAMPLE_OID, type: "string" },
    { key: "day_ref", value: SAMPLE_OID, type: "string" },
    { key: "timeId", value: SAMPLE_OID, type: "string" },
    { key: "videoId", value: SAMPLE_OID, type: "string" },
    { key: "workshopId", value: SAMPLE_OID, type: "string" },
    { key: "categoryId", value: SAMPLE_OID, type: "string" },
    { key: "yearId", value: SAMPLE_OID, type: "string" },
    { key: "planId", value: SAMPLE_OID, type: "string" },
    { key: "dayId", value: SAMPLE_OID, type: "string" },
    { key: "screenId", value: SAMPLE_OID, type: "string" },
    { key: "slotId", value: SAMPLE_OID, type: "string" },
    { key: "slug", value: "short-film", type: "string" },
    { key: "filename", value: "sample-video.mp4", type: "string" },
  ],
  auth: {
    type: "bearer",
    bearer: [{ key: "token", value: "{{token}}", type: "string" }],
  },
  item: folders,
};

const outPath = path.join(__dirname, "Arunachal_Film_Festival_API.postman_collection.json");
fs.writeFileSync(outPath, JSON.stringify(collection, null, 2), "utf8");
console.log(`Wrote ${outPath}`);
console.log(`Total requests: ${countItems(folders)}`);
console.log(`Folders: ${folders.length}`);
