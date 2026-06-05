const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Class = require('../models/Class');

async function listClasses() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to Database successfully.");

    const classes = await Class.find({});
    console.log(`Found ${classes.length} classes in database:`);
    console.log(JSON.stringify(classes.map(c => ({ _id: c._id, name: c.name })), null, 2));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

listClasses();
