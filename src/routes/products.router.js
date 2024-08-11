import { Router } from "express";
import productModel from "../models/product.model.js";
import cartModel from "../models/cart.model.js";

const router = Router();

router.get("/", async (req, res) => {
  const { limit = 10, page = 1, sort, query } = req.query;

  let filter = {};
  if (query) {
    const queryParts = query.split("=");
    if (queryParts.length === 2 && queryParts[0] === "category") {
      filter.category = { $regex: queryParts[1], $options: "i" };
    } else if (queryParts.length === 2 && queryParts[0] === "status") {
      filter.status = queryParts[1] === "true";
    }
  }

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: sort ? { price: sort === "asc" ? 1 : -1 } : {},
  };

  try {
    const result = await productModel.paginate(filter, options);

    res.status(200).json({
      status: "success",
      payload: result.docs,
      totalPages: result.totalPages,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
      page: result.page,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevLink: result.hasPrevPage
        ? `/api/products?page=${result.prevPage}&limit=${limit}&sort=${sort}&query=${query}`
        : null,
      nextLink: result.hasNextPage
        ? `/api/products?page=${result.nextPage}&limit=${limit}&sort=${sort}&query=${query}`
        : null,
    });
  } catch (err) {
    res.status(500).json({ status: "error", msg: err.message });
  }
});

router.get("/:pid", async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid);
    if (product) {
      res.status(200).json(product);
    } else {
      res.status(404).json({ msg: "Product not found" });
    }
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

const configureRouter = (io) => {
  router.get("/details/:pid", async (req, res) => {
    try {
      const product = await productModel.findById(req.params.pid);
      if (product) {
        res.render("productDetails", product.toObject());
      } else {
        res.status(404).json({ msg: "Product not found" });
      }
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  });

  router.post("/", async (req, res) => {
    const {
      title,
      description,
      code,
      price,
      status,
      stock,
      category,
      thumbnails,
    } = req.body;
    const newProduct = new productModel({
      title,
      description,
      code,
      price,
      status: status ?? true,
      stock,
      category,
      thumbnails,
    });

    try {
      const savedProduct = await newProduct.save();
      res.status(201).json(savedProduct);
      io.emit("productData", savedProduct); // Emitir el evento a todos los clientes
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  });

  router.put("/:pid", async (req, res) => {
    try {
      const updatedProduct = await productModel.findByIdAndUpdate(
        req.params.pid,
        req.body,
        { new: true }
      );
      if (updatedProduct) {
        res.status(200).json(updatedProduct);
        io.emit("productData", updatedProduct); // Emitir el evento a todos los clientes
      } else {
        res.status(404).json({ msg: "Product not found" });
      }
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  });

  router.delete("/:pid", async (req, res) => {
    try {
      const removedProduct = await productModel.findByIdAndDelete(
        req.params.pid
      );
      if (removedProduct) {
        // Eliminar el producto de todos los carritos
        await cartModel.updateMany(
          {},
          { $pull: { products: { product: req.params.pid } } }
        );
        io.emit("productRemoved", { id: req.params.pid }); // Emitir el evento a todos los clientes
        io.emit("cartUpdated"); // Emitir evento para actualizar los carritos
        res
          .status(200)
          .json({ msg: `Id product: ${req.params.pid} successfully eliminated` });
      } else {
        res.status(404).json({ msg: "Product not found" });
      }
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  });

  return router;
};

export default configureRouter;
