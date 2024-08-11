import express, { json, urlencoded } from "express";
import configureProductsRouter from "./routes/products.router.js";
import configureCartsRouter from "./routes/carts.router.js";
import handlebars from "express-handlebars";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import viewsRouter from "./routes/views.router.js";
import userRouter from "./routes/user.router.js";
import __dirname from "./utils/utils.js";
import mongoose from "mongoose";

const app = express();
const PORT = 27017;

mongoose
  .connect(
    "mongodb+srv://stephencurry:stephencurry@cluster0.s1ga1yh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => {
    console.log("DDBB connect");
  })
  .catch((error) => {
    console.log("Connection error", error);
  });

app.use(json());
app.use(urlencoded({ extended: true }));

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Configuración de Handlebars
app.engine("handlebars", handlebars.engine());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "handlebars");

const httpServer = http.createServer(app);

// Configurar Socket.IO
const io = new Server(httpServer);

io.on("connection", (socket) => {
  console.log("Nuevo cliente conectado");

  socket.on("info", (data) => {
    console.log(`la data nueva es ${data}`);
  });

  socket.on("productData", (data) => {
    console.log("Product data received:", data);
    io.emit("productData", data); // Emitir el evento a todos los clientes
  });

  socket.on("removeProduct", (data) => {
    console.log("Remove product:", data);
    io.emit("productRemoved", data); // Notificar a todos los clientes que el producto ha sido eliminado
  });
});

// Routers
app.use("/api/carts", configureCartsRouter(io)); // Pasar io a cartsRouter
app.use("/api/products", configureProductsRouter(io));
app.use("/api/users", userRouter); // Usar el router de usuarios
app.use("/", viewsRouter);

httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

