import dotenv from "dotenv";
import { connectDB } from "./db/index.js";
import { app } from "./app.js";

dotenv.config();

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running on PORT ${process.env.PORT}`)
    });
})
.catch((err)=>{
    console.log("MongoDb connection failed !!!", err);
})














//1. First approach
// Always use try catch in database connection
// Database is always in another continent, async await use always.

// const app = express();

// ;( async ()=>{
//     try {
//         await mongoose.connect(`{process.env.MONGODB_URI}/${DB_Name}`)
//         app.on("error", (error)=>{
//             console.log("ERR : ", error);
//             throw err
//         })
//     } catch (error) {
//         console.error(error);
//         throw error;
//     }
// })()

// const connectDb = ()=>{
// }

// connectDb();
