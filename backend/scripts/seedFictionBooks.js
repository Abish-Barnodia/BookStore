import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../model/productModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const books = [
  { title: "Lost Horizon", author: "M. Khan", price: 399, stock: 15, bestSeller: true },
  { title: "Paper Dreams", author: "L. Verma", price: 179, stock: 9, bestSeller: false },
  { title: "Golden Lies", author: "T. Nair", price: 299, stock: 7, bestSeller: true },
  { title: "Dark Streets", author: "P. Sharma", price: 259, stock: 11, bestSeller: false },
  { title: "Fading Echo", author: "R. Pillai", price: 199, stock: 5, bestSeller: false },
  { title: "Midnight Rain", author: "A. Sen", price: 349, stock: 13, bestSeller: true },
  { title: "Red Moon", author: "N. Joshi", price: 279, stock: 6, bestSeller: false },
  { title: "Final Chapter", author: "D. Singh", price: 229, stock: 9, bestSeller: false },
  { title: "Empty Frames", author: "S. Kapoor", price: 319, stock: 14, bestSeller: true },
  { title: "Velvet Sky", author: "H. Shah", price: 189, stock: 10, bestSeller: false },
  { title: "Mirror Game", author: "Y. Patel", price: 259, stock: 8, bestSeller: true },
  { title: "Burning Pages", author: "K. Das", price: 299, stock: 12, bestSeller: false },
  { title: "Blue Silence", author: "A. Roy", price: 349, stock: 7, bestSeller: true },
  { title: "Echo Chamber", author: "V. Jain", price: 279, stock: 6, bestSeller: false },
  { title: "Last Letter", author: "S. Bhatt", price: 199, stock: 10, bestSeller: false },
  { title: "Secret Door", author: "R. Bose", price: 249, stock: 11, bestSeller: true },
];

async function seedFictionBooks() {
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
      category: "Fiction",
    };

    const update = {
      $set: {
        category: "Fiction",
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

  console.log(`Fiction seed complete: inserted=${inserted}, updated=${updated}, total=${books.length}`);
  await mongoose.disconnect();
}

seedFictionBooks().catch(async (err) => {
  console.error("seedFictionBooks failed:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
