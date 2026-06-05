const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function listIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to Database successfully.");

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log("Collections in DB:", collections.map(c => c.name));

    // Get indexes for students collection
    const studentsCollection = db.collection('students');
    const indexes = await studentsCollection.indexes();
    console.log("\nIndexes on 'students' collection:");
    console.log(JSON.stringify(indexes, null, 2));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

listIndexes();
