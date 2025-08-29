import expres from "express";
import {createAwards,getAllAwards,getAwardsById,updateAwards,deleteAwards} from "../controller/awardsController.js";
import {restrictTo, protect} from "../utils/auth.js";

import upload from "../utils/multerMemory.js";
const router = expres.Router();

router.post("/createAwards", protect, restrictTo("admin"), upload.fields([
    { name: "image", maxCount: 1 },
    { name: "array_images", maxCount: 10 },
  ]), createAwards);
router.get("/getAllAwards", getAllAwards);
router.get("/getAwardsById/:id", getAwardsById);
router.put("/updateAwards/:id", protect,restrictTo("admin"), updateAwards);
router.delete("/deleteAwards/:id", protect, restrictTo("admin"), deleteAwards);


export default router;