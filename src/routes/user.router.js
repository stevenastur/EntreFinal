import { Router } from "express";
import userModel from "../models/user.model.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    let users = await userModel.find();
    res.send({ result: "Success", payload: users });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "Error", error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  let { name, lastName, email, address } = req.body;
  if (!name || !lastName || !email || !address) {
    return res
      .status(400)
      .send({ status: "Error", error: "Parameters missing" });
  }

  try {
    let result = await userModel.create({ name, lastName, email, address });
    res.send({ result: "Success", payload: result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "Error", error: "Internal server error" });
  }
});

router.put("/:uid", async (req, res) => {
  let { uid } = req.params;
  let { name, lastName, email, address } = req.body;
  if (!name || !lastName || !email || !address) {
    return res
      .status(400)
      .send({ status: "Error", error: "Parameters missing" });
  }

  try {
    let result = await userModel.updateOne(
      { _id: uid },
      { name, lastName, email, address }
    );
    res.send({ result: "Success", payload: result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "Error", error: "Internal server error" });
  }
});

router.delete("/:uid", async (req, res) => {
  let { uid } = req.params;
  try {
    let result = await userModel.deleteOne({ _id: uid });
    res.send({ result: "Success", payload: result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "Error", error: "Internal server error" });
  }
});

export default router;
