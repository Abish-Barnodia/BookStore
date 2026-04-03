import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../model/productModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const books = [
  { title: "Starfall", author: "I. Verma", price: 399, stock: 10, bestSeller: true },
  { title: "Quantum Shift", author: "A. Rao", price: 499, stock: 7, bestSeller: true },
  { title: "Mars Colony", author: "D. Kapoor", price: 349, stock: 12, bestSeller: false },
  { title: "Neon Future", author: "S. Iyer", price: 299, stock: 8, bestSeller: false },
  { title: "AI Reborn", author: "R. Khan", price: 459, stock: 6, bestSeller: true },
  { title: "Time Rift", author: "K. Shah", price: 379, stock: 11, bestSeller: false },
  { title: "Cyber World", author: "V. Mehta", price: 329, stock: 9, bestSeller: false },
  { title: "Dark Orbit", author: "N. Joshi", price: 399, stock: 5, bestSeller: true },
  { title: "Galaxy War", author: "T. Nair", price: 449, stock: 14, bestSeller: true },
  { title: "Nano Age", author: "L. Das", price: 289, stock: 6, bestSeller: false },
];

async function seedSciFiBooks() {
  const mongoUrl = process.env.MONGODB_URL;
  if (!mongoUrl) {
    throw new Error("MONGODB_URL is missing in backend/.env");
  }

  await mongoose.connect(mongoUrl);

  let inserted = 0;
  let updated = 0;

  for (const book of books) {
    const filter = {
      title: book.title,
      author: book.author,
      category: "Sci-Fi",
    };

    const update = {
      $set: {
        category: "Sci-Fi",
        price: book.price,
        stock: book.stock,
        bestSeller: book.bestSeller,
      },
      $setOnInsert: {
        imageUrl: "",
      },
    };

    const result = await Product.updateOne(filter, update, { upsert: true });

    if (result.upsertedCount > 0) inserted += 1;
    else if (result.modifiedCount > 0) updated += 1;
  }

  console.log(`Sci-Fi seed complete: inserted=${inserted}, updated=${updated}, total=${books.length}`);
  await mongoose.disconnect();
}

seedSciFiBooks().catch(async (err) => {
  console.error("seedSciFiBooks failed:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
