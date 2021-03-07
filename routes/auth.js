import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Users } from "../models/Users.js";
import { Code } from "../models/secretCode.js";
import sendMail from "../utils/sendMail.js";

const router = express.Router();
dotenv.config();

//SignUp
router.post("/signup", async (req, res) => {
  try {
    let user = await Users.findOne({ name: req.body.name });

    if (user) {
      return res.status(400).json({ errors: "Email is registered already" });
    }

    const newUser = new Users({
      name: req.body.name,
      password: req.body.password,
    });

    const users = await newUser.save();

    await sendMail(users.name, users._id);

    res.json({
      userRole: users.role,
      userId: users._id,
      userStatus: users.status,
    });
  } catch (error) {
    res.status(404).json({ errors: error.message });
  }
});

//SignIn
router.post("/signin", async (req, res) => {
  try {
    let user = await Users.findOne({ name: req.body.name });

    if (!user) {
      return res.status(400).json({ errors: "Invalid Credentials" });
    }

    const isMatch = user.password === req.body.password ? true : false;

    if (!isMatch) {
      return res.status(401).json({ errors: "Invalid Credentials" });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    var token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).send({
      id: user.id,
      name: user.name,
      role: user.role,
      token: token,
    });
  } catch (error) {
    res.status(404).json({ errors: error.message });
  }
});

// Verify user's email
router.get("/verify-account/:userId/:secretCode", async (req, res) => {
  try {
    const user = await Users.findById(req.params.userId);

    const user_secretCode = await Code.findOne({
      email: user.name,
      code: req.params.secretCode,
    });

    if (!user || !user_secretCode) {
      res.sendStatus(401);
    } else {
      await user.updateOne({
        name: user.name,
        status: "active",
      });

      await Code.deleteMany({ email: user.name });

      res.sendStatus(200);
    }
  } catch (error) {
    res.status(404).json({ errors: error.message });
  }
});

router.get("/send-link/:userId", async (req, res) => {
  try {
    const user = await Users.findById(req.params.userId);
    console.log(user);

    if (!user) {
      res.sendStatus(401);
    } else {
      await sendMail(user.name, user._id);
      res.sendStatus(200);
    }
  } catch (error) {
    res.status(404).json({ errors: error.message });
  }
});

export default router;
