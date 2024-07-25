// require('dotenv').config({path:'./env'})

// index.js
import dotenv from 'dotenv';
import connectDB from './db/index.js';
import app from './app.js';

dotenv.config({
    path: './.env'
});

connectDB()
    .then(() => {
        const PORT = process.env.PORT || 8000;
        app.listen(PORT, () => {
            console.log(`Server is running at port ${PORT}`);
        });
    })
    .catch((err) => {
        console.log('Database connection failed', err);
    });
















// ;(async ()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGO_URL}`)
//         app.on("error",(error)=>{       //app.on event lisner listing error
//             console.log("Error:",error);
//             throw error
//         })

//         app.listen(process.env.PORT,()=>{
//             console.log(`app is listing on port ${process.env.PORT}`);
//         })
//     }catch(error){
//         console.error("Error",error);
//         throw err
//     }
// })()