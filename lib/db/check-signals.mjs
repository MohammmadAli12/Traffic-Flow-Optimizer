import { db } from "./src/index.js";
import { signalsTable } from "./src/index.js";

async function checkSignals() {
  try {
    const signals = await db.select().from(signalsTable);
    console.log("Total signals:", signals.length);
    console.log("Signals data:", JSON.stringify(signals, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}

checkSignals();
