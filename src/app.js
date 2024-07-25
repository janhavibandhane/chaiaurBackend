// import express from "express"
// import cors from "cors"
// import cookieParser from "cookie-parser"

// const app=express()

// app.use(cors({   //.use is use for middleware uses
//     origin:process.env.CORS_ORIGIN,
//     credentials:true
// }))

// app.use(express.json({limit:"16kb"}))
// app.use(express.urlencoded({extended:true,limit:"16kb"})) //dusri kadun data yenar extend:true 
// app.use(express.static("public")) //imges and vicon public madhe jaude
// app.use(cookieParser())



// //routes import
// import userRouter from "./routes/user.routes.js"



// //routes declaration
// app.use("/api/v1/users",userRouter)


// export {app}


// app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRouter from './routes/user.routes.js';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

// Routes
app.use('/api/v1/users', userRouter);

export default app;
