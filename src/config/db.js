import mongoose from 'mongoose';



const connectDB = async (retries = 5, delay = 5000) => {
  while (retries) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);

      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return; // success → exit loop
    } catch (error) {
      console.error(`❌ DB connection failed: ${error.message}`);

      retries -= 1;

      if (retries === 0) {
        console.error('❌ All retry attempts failed. Exiting...');
        process.exit(1);
      }

      console.log(`🔄 Retrying connection... (${retries} attempts left)`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
};

// Connection Events
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ Mongoose error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Mongoose disconnected');
});

export default connectDB;