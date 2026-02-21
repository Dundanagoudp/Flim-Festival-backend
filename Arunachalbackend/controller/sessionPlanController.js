import SessionPlan from "../models/SessionPlan.js";
import SlotCategory from "../models/SlotCategory.js";
import { ok, created, notFound, badReq, err } from "../utils/response.js";

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

async function resolveCategoryName(categoryInput) {
  if (categoryInput == null || categoryInput === "") return "Film";
  const str = String(categoryInput).trim();
  if (OBJECT_ID_REGEX.test(str)) {
    const cat = await SlotCategory.findById(str);
    return cat ? cat.name : null;
  }
  const cat = await SlotCategory.findOne({ name: str });
  return cat ? cat.name : str;
}

export async function getPlans(req, res) {
  try {
    const visible = req.query.visible === "true";
    const filter = visible ? { isVisible: true } : {};
    const plans = await SessionPlan.find(filter).sort({ year: -1 });
    return ok(res, plans);
  } catch (e) {
    return err(res, e);
  }
}

export async function createPlan(req, res) {
  try {
    const body = req.body || {};
    if (body.year == null || !body.festival) {
      return badReq(res, "year and festival are required");
    }
    const plan = await SessionPlan.create({
      year: Number(body.year),
      festival: body.festival,
      isVisible: body.isVisible ?? false,
      days: [],
    });
    return created(res, plan);
  } catch (e) {
    return err(res, e);
  }
}

export async function getPlanById(req, res) {
  try {
    const plan = await SessionPlan.findById(req.params.planId);
    if (!plan) return notFound(res, "Plan not found");
    return ok(res, plan);
  } catch (e) {
    return err(res, e);
  }
}

export async function updatePlan(req, res) {
  try {
    const body = req.body || {};
    const update = {};
    if (body.year != null) update.year = Number(body.year);
    if (body.festival != null) update.festival = body.festival;
    if (body.isVisible !== undefined) update.isVisible = body.isVisible;
    const plan = await SessionPlan.findByIdAndUpdate(
      req.params.planId,
      { $set: update },
      { new: true }
    );
    if (!plan) return notFound(res, "Plan not found");
    return ok(res, plan);
  } catch (e) {
    return err(res, e);
  }
}

export async function deletePlan(req, res) {
  try {
    const plan = await SessionPlan.findByIdAndDelete(req.params.planId);
    if (!plan) return notFound(res, "Plan not found");
    return ok(res, { deleted: true });
  } catch (e) {
    return err(res, e);
  }
}

export async function getDays(req, res) {
  try {
    const plan = await SessionPlan.findById(req.params.planId);
    if (!plan) return notFound(res, "Plan not found");
    const days = [...plan.days].sort((a, b) => a.dayNumber - b.dayNumber);
    return ok(res, days);
  } catch (e) {
    return err(res, e);
  }
}

export async function createDay(req, res) {
  try {
    const body = req.body || {};
    if (body.dayNumber == null || !body.date) {
      return badReq(res, "dayNumber and date are required");
    }
    const plan = await SessionPlan.findByIdAndUpdate(
      req.params.planId,
      {
        $push: {
          days: {
            dayNumber: Number(body.dayNumber),
            date: body.date,
            screens: [],
          },
        },
      },
      { new: true }
    );
    if (!plan) return notFound(res, "Plan not found");
    const newDay = plan.days[plan.days.length - 1];
    return created(res, newDay);
  } catch (e) {
    return err(res, e);
  }
}

export async function getDayById(req, res) {
  try {
    const plan = await SessionPlan.findById(req.params.planId);
    if (!plan) return notFound(res, "Plan not found");
    const day = plan.days.id(req.params.dayId);
    if (!day) return notFound(res, "Day not found");
    return ok(res, day);
  } catch (e) {
    return err(res, e);
  }
}

export async function updateDay(req, res) {
  try {
    const plan = await SessionPlan.findById(req.params.planId);
    if (!plan) return notFound(res, "Plan not found");
    const day = plan.days.id(req.params.dayId);
    if (!day) return notFound(res, "Day not found");
    const body = req.body || {};
    if (body.dayNumber != null) day.dayNumber = Number(body.dayNumber);
    if (body.date != null) day.date = body.date;
    await plan.save();
    return ok(res, day);
  } catch (e) {
    return err(res, e);
  }
}

export async function deleteDay(req, res) {
  try {
    const plan = await SessionPlan.findByIdAndUpdate(
      req.params.planId,
      { $pull: { days: { _id: req.params.dayId } } },
      { new: true }
    );
    if (!plan) return notFound(res, "Plan not found");
    return ok(res, { deleted: true });
  } catch (e) {
    return err(res, e);
  }
}

export async function getScreens(req, res) {
  try {
    const plan = await SessionPlan.findById(req.params.planId);
    if (!plan) return notFound(res, "Plan not found");
    const day = plan.days.id(req.params.dayId);
    if (!day) return notFound(res, "Day not found");
    return ok(res, day.screens);
  } catch (e) {
    return err(res, e);
  }
}

export async function createScreen(req, res) {
  try {
    const body = req.body || {};
    if (!body.screenName) return badReq(res, "screenName is required");
    const plan = await SessionPlan.findById(req.params.planId);
    if (!plan) return notFound(res, "Plan not found");
    const day = plan.days.id(req.params.dayId);
    if (!day) return notFound(res, "Day not found");
    day.screens.push({ screenName: body.screenName, slots: [] });
    await plan.save();
    const newScreen = day.screens[day.screens.length - 1];
    return created(res, newScreen);
  } catch (e) {
    return err(res, e);
  }
}

export async function getScreenById(req, res) {
  try {
    const plan = await SessionPlan.findById(req.params.planId);
    if (!plan) return notFound(res, "Plan not found");
    const day = plan.days.id(req.params.dayId);
    if (!day) return notFound(res, "Day not found");
    const screen = day.screens.id(req.params.screenId);
    if (!screen) return notFound(res, "Screen not found");
    return ok(res, screen);
  } catch (e) {
    return err(res, e);
  }
}

export async function updateScreen(req, res) {
  try {
    const body = req.body || {};
    if (!body.screenName) return badReq(res, "screenName is required");
    const plan = await SessionPlan.findById(req.params.planId);
    if (!plan) return notFound(res, "Plan not found");
    const day = plan.days.id(req.params.dayId);
    if (!day) return notFound(res, "Day not found");
    const screen = day.screens.id(req.params.screenId);
    if (!screen) return notFound(res, "Screen not found");
    screen.screenName = body.screenName;
    await plan.save();
    return ok(res, screen);
  } catch (e) {
    return err(res, e);
  }
}

export async function deleteScreen(req, res) {
  try {
    const plan = await SessionPlan.findById(req.params.planId);
    if (!plan) return notFound(res, "Plan not found");
    const day = plan.days.id(req.params.dayId);
    if (!day) return notFound(res, "Day not found");
    day.screens.pull({ _id: req.params.screenId });
    await plan.save();
    return ok(res, { deleted: true });
  } catch (e) {
    return err(res, e);
  }
}

export async function getSlots(req, res) {
  try {
    const plan = await SessionPlan.findById(req.params.planId);
    if (!plan) return notFound(res, "Plan not found");
    const day = plan.days.id(req.params.dayId);
    if (!day) return notFound(res, "Day not found");
    const screen = day.screens.id(req.params.screenId);
    if (!screen) return notFound(res, "Screen not found");
    const slots = [...screen.slots].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    return ok(res, slots);
  } catch (e) {
    return err(res, e);
  }
}

export async function createSlot(req, res) {
  try {
    const body = req.body || {};
    if (!body.title || !body.startTime) {
      return badReq(res, "title and startTime are required");
    }
    const categoryName = await resolveCategoryName(body.category);
    if (categoryName === null) {
      return badReq(res, "Invalid category id");
    }
    const plan = await SessionPlan.findById(req.params.planId);
    if (!plan) return notFound(res, "Plan not found");
    const day = plan.days.id(req.params.dayId);
    if (!day) return notFound(res, "Day not found");
    const screen = day.screens.id(req.params.screenId);
    if (!screen) return notFound(res, "Screen not found");
    screen.slots.push({
      title: body.title,
      startTime: body.startTime,
      endTime: body.endTime ?? undefined,
      director: body.director ?? undefined,
      moderator: body.moderator ?? undefined,
      duration: body.duration ?? undefined,
      category: categoryName,
      description: body.description ?? undefined,
      order: body.order ?? 0,
    });
    await plan.save();
    const newSlot = screen.slots[screen.slots.length - 1];
    return created(res, newSlot);
  } catch (e) {
    return err(res, e);
  }
}

export async function getSlotById(req, res) {
  try {
    const plan = await SessionPlan.findById(req.params.planId);
    if (!plan) return notFound(res, "Plan not found");
    const day = plan.days.id(req.params.dayId);
    if (!day) return notFound(res, "Day not found");
    const screen = day.screens.id(req.params.screenId);
    if (!screen) return notFound(res, "Screen not found");
    const slot = screen.slots.id(req.params.slotId);
    if (!slot) return notFound(res, "Slot not found");
    return ok(res, slot);
  } catch (e) {
    return err(res, e);
  }
}

export async function updateSlot(req, res) {
  try {
    const body = req.body || {};
    const plan = await SessionPlan.findById(req.params.planId);
    if (!plan) return notFound(res, "Plan not found");
    const day = plan.days.id(req.params.dayId);
    if (!day) return notFound(res, "Day not found");
    const screen = day.screens.id(req.params.screenId);
    if (!screen) return notFound(res, "Screen not found");
    const slot = screen.slots.id(req.params.slotId);
    if (!slot) return notFound(res, "Slot not found");
    if (body.category !== undefined) {
      const categoryName = await resolveCategoryName(body.category);
      if (categoryName === null) return badReq(res, "Invalid category id");
      slot.category = categoryName;
    }
    const fields = [
      "title",
      "startTime",
      "endTime",
      "director",
      "moderator",
      "duration",
      "description",
      "order",
    ];
    fields.forEach((f) => {
      if (body[f] !== undefined) slot[f] = body[f];
    });
    if (body.order !== undefined) slot.order = Number(body.order);
    await plan.save();
    return ok(res, slot);
  } catch (e) {
    return err(res, e);
  }
}

export async function deleteSlot(req, res) {
  try {
    const plan = await SessionPlan.findById(req.params.planId);
    if (!plan) return notFound(res, "Plan not found");
    const day = plan.days.id(req.params.dayId);
    if (!day) return notFound(res, "Day not found");
    const screen = day.screens.id(req.params.screenId);
    if (!screen) return notFound(res, "Screen not found");
    screen.slots.pull({ _id: req.params.slotId });
    await plan.save();
    return ok(res, { deleted: true });
  } catch (e) {
    return err(res, e);
  }
}
