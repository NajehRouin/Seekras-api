import { Router } from "express"; // Import Router from express
import {
  register,
  login,
  updatePassword,
  loginWithGoogle,
} from "../controllers/authController"; // Import the controller functions

const router = Router();

// Define the register route
router.post("/auth/signup", register);

// Define the login route
router.post("/auth/login", login);
router.post("/auth/loginGoogle", loginWithGoogle);

router.post("/auth/updatePassword", updatePassword);

export default router;
